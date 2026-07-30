/**
 * Tests para ResourceMatcher — escenarios T5..T10.
 *
 * Todos los accesos a Supabase se interceptan con mocks en memoria.
 * No hace falta base de datos real ni credenciales.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { matchResources } from '@/features/integrations/services/resource-matcher'
import type { NormalizedDomain } from '@/features/integrations/connectors/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

type ExistingResource = {
  id: string
  external_resource_id: string
  external_resource_type: string
  external_payload_hash: string | null
  consecutive_missing_syncs: number
}

/**
 * Proxy recursivo que hace a cualquier cadena de llamadas awaitable.
 * Resolve al valor pasado como primer argumento.
 */
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

function makeSupabase({
  existingResources = [] as ExistingResource[],
  insertId = 'new-uuid',
  insertError = null as { message: string } | null,
  updateError = null as { message: string } | null,
  rpcError = null as { message: string } | null,
} = {}) {
  return {
    from: vi.fn((_table: string) => ({
      // First path: from().select() — initial query loading existing resources
      select: vi.fn(() => chain({ data: existingResources, error: null })),
      // Second path: from().insert({}).select('id').single()
      insert: vi.fn(() => chain({ data: { id: insertId }, error: insertError })),
      // Third path: from().update({}).eq/in/...
      update: vi.fn(() => chain({ error: updateError })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: rpcError })),
  }
}

const BASE_INPUT = {
  integrationId: 'int-1',
  organizationId: 'org-1',
  providerId: 'prov-1',
  syncRunId: 'run-1',
  environment: 'production' as const,
}

function makeDomain(name: string, hash: string, overrides?: Partial<NormalizedDomain>): NormalizedDomain {
  return {
    resourceType: 'domain',
    externalId: name,
    domainName: name,
    status: 'active',
    expiresOn: null,
    autoRenew: true,
    nameservers: [],
    registrarName: null,
    externalPayloadHash: hash,
    rawMetadata: {},
    ...overrides,
  }
}

function makeExisting(externalId: string, hash: string, dbId = 'db-' + externalId): ExistingResource {
  return {
    id: dbId,
    external_resource_id: externalId,
    external_resource_type: 'domain',
    external_payload_hash: hash,
    consecutive_missing_syncs: 0,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('matchResources', () => {

  // T5 — Primera sincronización: DB vacía → todos los dominios se crean
  it('T5: primera sync — crea todos los recursos recibidos', async () => {
    const db = makeSupabase({ existingResources: [], insertId: 'new-id' })
    const domains = [
      makeDomain('alpha.com', 'hash-1'),
      makeDomain('beta.com',  'hash-2'),
    ]

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.created).toBe(2)
    expect(out.updated).toBe(0)
    expect(out.unchanged).toBe(0)
    expect(out.failed).toBe(0)
    expect(out.missingExternalIds).toHaveLength(0)
    expect(out.results.every((r) => r.action === 'created')).toBe(true)
  })

  // T6 — Segunda sync sin cambios: hash idéntico → todos unchanged
  it('T6: segunda sync sin cambios — todos los recursos quedan unchanged', async () => {
    const db = makeSupabase({
      existingResources: [
        makeExisting('alpha.com', 'hash-1'),
        makeExisting('beta.com',  'hash-2'),
      ],
    })
    const domains = [
      makeDomain('alpha.com', 'hash-1'),
      makeDomain('beta.com',  'hash-2'),
    ]

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.unchanged).toBe(2)
    expect(out.created).toBe(0)
    expect(out.updated).toBe(0)
    expect(out.failed).toBe(0)
    expect(out.missingExternalIds).toHaveLength(0)
    // Ningún dominio se marca como ausente
    expect(db.rpc).not.toHaveBeenCalledWith('increment_missing_syncs', expect.anything())
  })

  // T7 — Dominio nuevo: hay uno existente y llega uno nuevo → 1 created, 1 unchanged
  it('T7: dominio nuevo — crea solo el que no existía', async () => {
    const db = makeSupabase({
      existingResources: [makeExisting('alpha.com', 'hash-1')],
      insertId: 'new-beta',
    })
    const domains = [
      makeDomain('alpha.com', 'hash-1'),  // existe, sin cambios
      makeDomain('beta.com',  'hash-2'),  // nuevo
    ]

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.created).toBe(1)
    expect(out.unchanged).toBe(1)
    expect(out.updated).toBe(0)
    expect(out.missingExternalIds).toHaveLength(0)
    expect(out.results.find((r) => r.externalResourceId === 'beta.com')?.action).toBe('created')
    expect(out.results.find((r) => r.externalResourceId === 'alpha.com')?.action).toBe('unchanged')
  })

  // T8 — Dominio modificado: hash diferente → 1 updated
  it('T8: dominio modificado — actualiza cuando el hash cambia', async () => {
    const db = makeSupabase({
      existingResources: [makeExisting('alpha.com', 'old-hash', 'db-alpha')],
    })
    const domains = [makeDomain('alpha.com', 'new-hash')]

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.updated).toBe(1)
    expect(out.created).toBe(0)
    expect(out.unchanged).toBe(0)
    expect(out.results[0]).toMatchObject({ action: 'updated', resourceDbId: 'db-alpha' })
  })

  // T9 — Dominio ausente: existía en DB pero no vino en esta sync → missing++
  it('T9: dominio ausente — incrementa consecutive_missing_syncs via rpc', async () => {
    const db = makeSupabase({
      existingResources: [
        makeExisting('alpha.com', 'hash-1'),
        makeExisting('beta.com',  'hash-2'),  // este NO vendrá en la sync
      ],
    })
    const domains = [makeDomain('alpha.com', 'hash-1')]  // beta.com ausente

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.missingExternalIds).toEqual(['beta.com'])
    // El RPC de incremento sí se llama
    expect(db.rpc).toHaveBeenCalledWith('increment_missing_syncs', {
      p_integration_id: BASE_INPUT.integrationId,
      p_environment: BASE_INPUT.environment,
      p_external_ids: ['beta.com'],
    })
    // El dominio visto (alpha) se restablece a missing=0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateCall = (db.from as any).mock.results
      .flatMap((r: any) => r.value?.update?.mock?.calls ?? [])
    expect(updateCall.some((c: unknown[]) => JSON.stringify(c).includes('consecutive_missing_syncs'))).toBe(true)
  })

  // T10 — Sync parcial: un dominio falla en DB pero SÍ fue visto → no se marca como ausente
  it('T10: sync parcial — fallo de DB no marca el dominio como ausente', async () => {
    const db = makeSupabase({
      existingResources: [],
      insertError: { message: 'unique constraint violation' },
    })
    const domains = [makeDomain('alpha.com', 'hash-1')]

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.failed).toBe(1)
    expect(out.created).toBe(0)
    // El dominio SÍ fue procesado (está en seenExternalIds) → missing = 0
    expect(out.missingExternalIds).toHaveLength(0)
    // increment_missing_syncs NO se llama
    expect(db.rpc).not.toHaveBeenCalledWith('increment_missing_syncs', expect.anything())
    expect(out.results[0].errorMessage).toBeDefined()
  })

  // T11 — No borrar: los recursos ausentes siguen en la tabla (solo se incrementa el contador)
  it('T11: recursos ausentes no se borran, solo se incrementa el contador', async () => {
    const db = makeSupabase({
      existingResources: [makeExisting('ghost.com', 'hash-ghost')],
    })
    const domains: NormalizedDomain[] = []  // Sync vacía — ghost.com ausente

    const out = await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    expect(out.missingExternalIds).toContain('ghost.com')
    // No se llama a ningún delete
    expect(db.from).not.toHaveBeenCalledWith(expect.stringContaining('delete'))
    // El RPC de incremento sí se llama
    expect(db.rpc).toHaveBeenCalledWith('increment_missing_syncs', expect.objectContaining({
      p_external_ids: ['ghost.com'],
    }))
  })

  // T12 — PROTECTED_FIELDS: update no incluye local_resource_id ni local_resource_type
  it('T12: update no sobrescribe campos protegidos', async () => {
    const db = makeSupabase({
      existingResources: [makeExisting('alpha.com', 'old-hash', 'db-alpha')],
    })
    const domains = [makeDomain('alpha.com', 'new-hash')]

    await matchResources({ ...BASE_INPUT, supabase: db as never, domains })

    // Capturamos el objeto pasado al update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateCalls = (db.from as any).mock.results
      .map((r: any) => r.value?.update?.mock?.calls?.[0]?.[0])
      .filter(Boolean)

    for (const updateData of updateCalls) {
      expect(updateData).not.toHaveProperty('local_resource_id')
      expect(updateData).not.toHaveProperty('local_resource_type')
    }
  })
})
