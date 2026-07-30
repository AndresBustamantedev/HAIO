/**
 * Tests para Server Actions de integraciones — T3, T14, T15, T18.
 *
 * Los módulos server-only, next/cache y Supabase se mockean por completo.
 * Nunca se usa base de datos real ni credenciales reales.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── vi.hoisted garantiza inicialización antes de las factories de vi.mock ──────

const { mockCurrentOrg, mockCreateClient, mockCreateAdminClient } = vi.hoisted(() => ({
  mockCurrentOrg:        vi.fn(),
  mockCreateClient:      vi.fn(),
  mockCreateAdminClient: vi.fn(),
}))

// ── Mocks de módulos ──────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/queries/organizations', () => ({
  getCurrentOrganization: mockCurrentOrg,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/features/integrations/connectors/registry', () => ({
  getConnectorMeta: vi.fn(() => ({
    requiredSecrets: [
      { type: 'api_key', label: 'API Key', isPassword: false },
      { type: 'api_secret', label: 'API Secret', isPassword: true },
    ],
  })),
}))

vi.mock('@/features/integrations/services/encryption', () => ({
  encryptSecret: vi.fn(() => ({ hex: 'deadbeef01020304', buffer: Buffer.alloc(32) })),
  formatHexForPostgres: vi.fn((hex: string) => `\\x${hex}`),
}))

// ── Imports después de los mocks ──────────────────────────────────────────────

import {
  linkExternalResource,
  unlinkExternalResource,
} from '@/features/integrations/actions/link-external-resource'
import { rotateIntegrationCredentials } from '@/features/integrations/actions/rotate-credentials'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Proxy fluido que hace awaitable cualquier cadena de llamadas Supabase. */
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

type MockDbOptions = {
  resourceData?: unknown
  domainData?: unknown
  integrationData?: unknown
  updateError?: { message: string } | null
  upsertError?: { message: string } | null
}

function makeDbMock({
  resourceData = { id: 'res-1', integration_id: 'int-1' },
  domainData = { id: 'dom-1' },
  integrationData = { id: 'int-1', connector_type: 'godaddy', organization_id: 'org-1' },
  updateError = null,
  upsertError = null,
}: MockDbOptions = {}) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => chain(
        table === 'external_resources' ? { data: resourceData, error: null }
          : table === 'domains'        ? { data: domainData, error: null }
          : { data: integrationData, error: null }
      )),
      update: vi.fn(() => chain({ error: updateError })),
      upsert: vi.fn(() => chain({ error: upsertError })),
      insert: vi.fn(() => chain({ error: null })),
    })),
  }
}

const OWNER_ORG = { organizationId: 'org-1', role: 'owner' }
const VIEWER_ORG = { organizationId: 'org-1', role: 'viewer' }

// UUIDs RFC 4122 v4 válidos (3.er grupo empieza en 4, 4.o grupo empieza en 8–b)
const VALID_LINK_INPUT = {
  externalResourceId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  localResourceId:    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
  localResourceType:  'domain' as const,
}

const VALID_UNLINK_INPUT = {
  externalResourceId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Server Actions', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── T3 — Usuario sin permisos ─────────────────────────────────────────────

  describe('T3: usuario sin permisos (role viewer)', () => {
    it('linkExternalResource devuelve error si el rol no está permitido', async () => {
      mockCurrentOrg.mockResolvedValue(VIEWER_ORG)

      const result = await linkExternalResource(VALID_LINK_INPUT)

      expect(result.error).toMatch(/permiso/i)
    })

    it('unlinkExternalResource devuelve error si el rol no está permitido', async () => {
      mockCurrentOrg.mockResolvedValue(VIEWER_ORG)

      const result = await unlinkExternalResource(VALID_UNLINK_INPUT)

      expect(result.error).toMatch(/permiso/i)
    })

    it('rotateIntegrationCredentials devuelve error si el rol no está permitido', async () => {
      mockCurrentOrg.mockResolvedValue(VIEWER_ORG)

      const result = await rotateIntegrationCredentials('int-1', {
        secrets: { api_key: 'newkey', api_secret: 'newsecret' },
      })

      expect(result.error).toMatch(/permiso/i)
    })
  })

  // ── T3b — Sin organización ────────────────────────────────────────────────

  describe('T3b: sin sesión activa', () => {
    it('linkExternalResource devuelve error si no hay organización', async () => {
      mockCurrentOrg.mockResolvedValue(null)

      const result = await linkExternalResource(VALID_LINK_INPUT)

      expect(result.error).toBeDefined()
      expect(result.error).toMatch(/organización/i)
    })
  })

  // ── T14 — Vinculación ─────────────────────────────────────────────────────

  describe('T14: vinculación de recurso externo a dominio local', () => {
    it('retorna null en error cuando todo es correcto', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)

      const result = await linkExternalResource(VALID_LINK_INPUT)

      expect(result.error).toBeNull()
    })

    it('llama update con local_resource_id y local_resource_type', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)

      await linkExternalResource(VALID_LINK_INPUT)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateCalls = (db.from as any).mock.results
        .map((r: any) => r.value?.update?.mock?.calls ?? [])
        .flat()

      const linkUpdateCall = updateCalls.find(
        (c: unknown[]) => JSON.stringify(c).includes('local_resource_id')
      )
      expect(linkUpdateCall).toBeDefined()
      expect(linkUpdateCall![0]).toMatchObject({
        local_resource_id:   VALID_LINK_INPUT.localResourceId,
        local_resource_type: 'domain',
      })
    })

    it('devuelve error si el recurso externo no se encuentra', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock({ resourceData: null })
      mockCreateClient.mockResolvedValue(db)

      const result = await linkExternalResource(VALID_LINK_INPUT)

      expect(result.error).toMatch(/no encontrado/i)
    })

    it('devuelve error si el dominio local no se encuentra', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock({ domainData: null })
      mockCreateClient.mockResolvedValue(db)

      const result = await linkExternalResource(VALID_LINK_INPUT)

      expect(result.error).toMatch(/no encontrado/i)
    })

    it('rechaza input inválido (UUID malformado)', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      mockCreateClient.mockResolvedValue(makeDbMock())

      const result = await linkExternalResource({
        externalResourceId: 'not-a-uuid',
        localResourceId:    VALID_LINK_INPUT.localResourceId,
        localResourceType:  'domain',
      })

      expect(result.error).toBeDefined()
    })
  })

  // ── T15 — Desvinculación ──────────────────────────────────────────────────

  describe('T15: desvinculación de recurso externo', () => {
    it('retorna null en error cuando todo es correcto', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)

      const result = await unlinkExternalResource(VALID_UNLINK_INPUT)

      expect(result.error).toBeNull()
    })

    it('llama update con local_resource_id=null y local_resource_type=null', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)

      await unlinkExternalResource(VALID_UNLINK_INPUT)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateCalls = (db.from as any).mock.results
        .map((r: any) => r.value?.update?.mock?.calls ?? [])
        .flat()

      const unlinkCall = updateCalls.find(
        (c: unknown[]) => JSON.stringify(c).includes('local_resource_id')
      )
      expect(unlinkCall![0]).toMatchObject({
        local_resource_id:   null,
        local_resource_type: null,
      })
    })

    it('devuelve error si la DB falla', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock({ updateError: { message: 'db error' } })
      mockCreateClient.mockResolvedValue(db)

      const result = await unlinkExternalResource(VALID_UNLINK_INPUT)

      expect(result.error).toBeDefined()
    })
  })

  // ── T18 — Rotación de credenciales ───────────────────────────────────────

  describe('T18: rotación de credenciales', () => {
    const ROTATE_INPUT = {
      secrets: { api_key: 'nueva-api-key', api_secret: 'nuevo-api-secret' },
    }

    it('retorna null en error cuando todo es correcto', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)
      mockCreateAdminClient.mockReturnValue(db)

      const result = await rotateIntegrationCredentials('int-1', ROTATE_INPUT)

      expect(result.error).toBeNull()
    })

    it('el secret nunca llega a adminDb en texto plano — solo ciphertext', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)

      const adminDb = makeDbMock()
      mockCreateAdminClient.mockReturnValue(adminDb)

      await rotateIntegrationCredentials('int-1', ROTATE_INPUT)

      // Los upsert del adminDb nunca deben incluir los secretos en texto plano
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const upsertCalls = (adminDb.from as any).mock.results
        .map((r: any) => r.value?.upsert?.mock?.calls ?? [])
        .flat()

      for (const [upsertData] of upsertCalls as [unknown][]) {
        const serialized = JSON.stringify(upsertData)
        expect(serialized).not.toContain('nueva-api-key')
        expect(serialized).not.toContain('nuevo-api-secret')
        // Sí debe contener el hex cifrado (empieza con \\x)
        expect(serialized).toContain('\\\\x')
      }
    })

    it('marca la integración como disconnected tras la rotación', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)
      mockCreateAdminClient.mockReturnValue(makeDbMock())

      await rotateIntegrationCredentials('int-1', ROTATE_INPUT)

      // La última update en db (no adminDb) debe poner status=disconnected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateCalls = (db.from as any).mock.results
        .map((r: any) => r.value?.update?.mock?.calls ?? [])
        .flat()

      const disconnectCall = updateCalls.find(
        (c: unknown[]) => JSON.stringify(c).includes('disconnected')
      )
      expect(disconnectCall).toBeDefined()
    })

    it('rechaza tipo de secreto no permitido por el conector', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)
      mockCreateAdminClient.mockReturnValue(makeDbMock())

      const result = await rotateIntegrationCredentials('int-1', {
        secrets: { unauthorized_field: 'value' },  // no está en requiredSecrets de GoDaddy
      })

      expect(result.error).toMatch(/no permitido/i)
    })

    it('devuelve error si la integración no pertenece a la organización', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock({ integrationData: null })  // no encontrada
      mockCreateClient.mockResolvedValue(db)

      const result = await rotateIntegrationCredentials('int-other-org', ROTATE_INPUT)

      expect(result.error).toMatch(/no encontrada/i)
    })

    it('devuelve error si el upsert en integration_secrets falla', async () => {
      mockCurrentOrg.mockResolvedValue(OWNER_ORG)
      const db = makeDbMock()
      mockCreateClient.mockResolvedValue(db)
      mockCreateAdminClient.mockReturnValue(makeDbMock({ upsertError: { message: 'DB error' } }))

      const result = await rotateIntegrationCredentials('int-1', ROTATE_INPUT)

      expect(result.error).toBeDefined()
    })
  })
})
