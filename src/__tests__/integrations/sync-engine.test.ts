/**
 * Tests para SyncEngine — T4 (integración de otra organización) y T13 (doble sync concurrente).
 *
 * Todas las dependencias externas (Supabase admin, conectores, resource-matcher, alert-engine)
 * se sustituyen por mocks. No hay tráfico de red ni base de datos real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks de módulos ──────────────────────────────────────────────────────────

vi.mock('@/features/integrations/connectors/registry', () => ({
  getConnector: vi.fn(),
}))

vi.mock('@/features/integrations/services/resource-matcher', () => ({
  matchResources: vi.fn(),
}))

vi.mock('@/features/integrations/services/alert-engine', () => ({
  processAlerts: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/integrations/services/encryption', () => ({
  decryptSecret: vi.fn((raw: string) => `decrypted:${raw}`),
}))

// ── Imports después de los mocks ──────────────────────────────────────────────

import { runSync } from '@/features/integrations/services/sync-engine'
import { getConnector } from '@/features/integrations/connectors/registry'
import { matchResources } from '@/features/integrations/services/resource-matcher'

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTEGRATION_ID = 'int-aaa'
const ORG_ID = 'org-bbb'
const OTHER_ORG_ID = 'org-other'

/** Cadena fluida Supabase que resuelve a resolveValue cuando se awaita. */
function chain(resolveValue: unknown): unknown {
  const proxy: unknown = new Proxy(
    { __v: resolveValue } as Record<string | symbol, unknown>,
    {
      get(target, prop) {
        const s = String(prop)
        if (s === 'then')    return (ok: (v: unknown) => unknown) => Promise.resolve(target.__v).then(ok)
        if (s === 'catch')   return (fn: (e: unknown) => unknown) => Promise.resolve(target.__v).catch(fn)
        if (s === 'finally') return (fn: () => void) => Promise.resolve(target.__v).finally(fn)
        if (s === 'single' || s === 'maybeSingle') return () => Promise.resolve(target.__v)
        return (..._args: unknown[]) => chain(target.__v)
      },
    },
  )
  return proxy
}

function makeAdminDb({
  integrationData = {
    id: INTEGRATION_ID,
    connector_type: 'godaddy',
    environment: 'production',
    status: 'connected',
    provider_id: 'prov-1',
  } as unknown | null,
  lockGranted = true,
  secretsData = [
    { secret_type: 'api_key',    secret_ciphertext: 'cipher-key' },
    { secret_type: 'api_secret', secret_ciphertext: 'cipher-secret' },
  ],
} = {}) {
  const db = {
    from: vi.fn((_table: string) => ({
      select: vi.fn(() => chain({ data: integrationData, error: null })),
      insert: vi.fn(() => chain({ error: null })),
      update: vi.fn(() => chain({ error: null })),
    })),
    rpc: vi.fn((fnName: string) => {
      if (fnName === 'begin_integration_sync') {
        return Promise.resolve({ data: lockGranted, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
  }

  // The secrets query uses a different select structure
  // We need to differentiate from().select() for integrations vs integration_secrets
  db.from.mockImplementation((table: string) => {
    if (table === 'integration_secrets') {
      return {
        select: vi.fn(() => chain({ data: secretsData, error: null })),
        insert: vi.fn(() => chain({ error: null })),
        update: vi.fn(() => chain({ error: null })),
      }
    }
    // For integrations, integration_sync_runs, etc.
    return {
      select: vi.fn(() => chain({ data: integrationData, error: null })),
      insert: vi.fn(() => chain({ error: null })),
      update: vi.fn(() => chain({ error: null })),
    }
  })

  return db
}

const DEFAULT_MATCHER_OUTPUT = {
  results: [],
  created: 0,
  updated: 0,
  unchanged: 0,
  failed: 0,
  missingExternalIds: [],
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(matchResources).mockResolvedValue(DEFAULT_MATCHER_OUTPUT)
  })

  // T4 — Integración de otra organización: loadIntegration no la encuentra → lanza error
  it('T4: integración de otra org — runSync lanza error si la integración no pertenece a la org', async () => {
    // La integración existe pero la query con eq('organization_id', OTHER_ORG_ID) no la encontrará
    const db = makeAdminDb({ integrationData: null })  // null = no encontrada

    await expect(
      runSync({
        integrationId: INTEGRATION_ID,
        organizationId: OTHER_ORG_ID,
        triggerType: 'manual',
        supabaseAdmin: db as never,
      }),
    ).rejects.toThrow(/no encontrada|no pertenece/)
  })

  // T13 — Doble sync concurrente: begin_integration_sync devuelve false → status failed
  it('T13: doble sync concurrente — la segunda sync falla al no adquirir el lock', async () => {
    vi.mocked(getConnector as ReturnType<typeof vi.fn>).mockReturnValue({
      sync: vi.fn().mockResolvedValue({ resources: [] }),
    })

    const db = makeAdminDb({ lockGranted: false })

    const out = await runSync({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      triggerType: 'manual',
      supabaseAdmin: db as never,
    })

    expect(out.status).toBe('failed')
    expect(out.errors.some((e) => e.includes('sincronización en curso') || e.includes('lock'))).toBe(true)
    // matchResources nunca se llama si el lock no se adquiere
    expect(matchResources).not.toHaveBeenCalled()
  })

  // T_EXTRA — Sync exitosa: el flujo completo devuelve status completed
  it('Sync exitosa — status completed con recursos encontrados', async () => {
    const mockConnector = {
      sync: vi.fn().mockResolvedValue({
        resources: [
          { resourceType: 'domain', externalId: 'test.com', externalName: 'test.com',
            externalStatus: 'active', domainName: 'test.com',
            status: 'active', expiresOn: null, autoRenew: true, nameservers: [],
            registrarName: null, externalPayloadHash: 'hash-1', rawMetadata: {} },
        ],
      }),
    }
    vi.mocked(getConnector as ReturnType<typeof vi.fn>).mockReturnValue(mockConnector)
    vi.mocked(matchResources).mockResolvedValue({
      ...DEFAULT_MATCHER_OUTPUT,
      created: 1,
      results: [{ externalResourceId: 'test.com', externalResourceType: 'domain', action: 'created', resourceDbId: 'db-1' }],
    })

    const db = makeAdminDb({ lockGranted: true })

    const out = await runSync({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      triggerType: 'manual',
      supabaseAdmin: db as never,
    })

    expect(out.status).toBe('completed')
    expect(out.resourcesFound).toBe(1)
    expect(out.resourcesCreated).toBe(1)
    expect(mockConnector.sync).toHaveBeenCalledOnce()
    expect(matchResources).toHaveBeenCalledOnce()
  })

  // T_EXTRA2 — Conector lanza error: sync devuelve status failed
  it('Error en el conector — sync devuelve status failed sin llamar a matchResources', async () => {
    vi.mocked(getConnector as ReturnType<typeof vi.fn>).mockReturnValue({
      sync: vi.fn().mockRejectedValue(new Error('INVALID_CREDENTIALS')),
    })

    const db = makeAdminDb({ lockGranted: true })

    const out = await runSync({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      triggerType: 'manual',
      supabaseAdmin: db as never,
    })

    expect(out.status).toBe('failed')
    expect(out.errors.length).toBeGreaterThan(0)
    // El error no incluye secretos
    expect(out.errors.join(' ')).not.toContain('cipher-key')
    expect(out.errors.join(' ')).not.toContain('api_secret')
    expect(matchResources).not.toHaveBeenCalled()
  })
})
