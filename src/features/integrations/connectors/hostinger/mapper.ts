import { createHash } from 'crypto'
import type { NormalizedDomain, NormalizedHosting } from '../types'
import type {
  HostingerVMRaw,
  HostingerDomainRaw,
  HostingerSubscriptionRaw,
  HostingerWebsiteRaw,
} from './schemas'

// ── VPS ───────────────────────────────────────────────────────────────────────

export function mapHostingerVM(raw: HostingerVMRaw): NormalizedHosting {
  const hashPayload = { state: raw.state, cpus: raw.cpus, memory: raw.memory, disk: raw.disk }
  return {
    resourceType: 'hosting',
    externalId: `vps:${raw.id}`,
    externalName: raw.hostname,
    externalStatus: raw.state,
    externalPayloadHash: createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex'),
    rawMetadata: {
      type: 'vps',
      vmId: raw.id,
      hostname: raw.hostname,
      state: raw.state,
      cpus: raw.cpus,
      memoryMb: raw.memory,
      diskGb: raw.disk,
      ipv4: raw.ipv4 ?? null,
      template: raw.template?.name ?? null,
      plan: raw.plan?.name ?? null,
      createdAt: raw.created_at,
    },
  } satisfies NormalizedHosting
}

export function mapHostingerVMs(raws: ReadonlyArray<HostingerVMRaw>): NormalizedHosting[] {
  return raws.map(mapHostingerVM)
}

// ── Dominios (portfolio) ──────────────────────────────────────────────────────

function mapDomainStatus(raw?: string): NormalizedDomain['status'] {
  switch (raw?.toUpperCase()) {
    case 'ACTIVE': return 'active'
    case 'EXPIRED': return 'expired'
    case 'SUSPENDED':
    case 'CANCELLED': return 'cancelled'
    case 'PENDING_TRANSFER':
    case 'TRANSFERRED': return 'transferred'
    case 'PENDING':
    case 'PENDING_DELETE':
    case 'REDEMPTION_PERIOD': return 'pending'
    default: return 'unknown'
  }
}

export function mapHostingerDomain(raw: HostingerDomainRaw): NormalizedDomain {
  const status = mapDomainStatus(raw.status)
  const expiresOn = raw.expires_at ? new Date(raw.expires_at) : null
  return {
    resourceType: 'domain',
    externalId: `domain:${raw.domain}`,
    externalName: raw.domain,
    externalStatus: raw.status ?? 'unknown',
    externalPayloadHash: createHash('sha256')
      .update(JSON.stringify({ domain: raw.domain, status: raw.status, expires_at: raw.expires_at }))
      .digest('hex'),
    rawMetadata: {
      source: 'portfolio',
      domainName: raw.domain,
      status: raw.status,
      expiresAt: raw.expires_at ?? null,
      createdAt: raw.created_at ?? null,
      autoRenew: raw.autorenew ?? false,
      locked: raw.locked ?? false,
      expiresOn: raw.expires_at ?? null,
    },
    domainName: raw.domain,
    status,
    expiresOn,
    autoRenew: raw.autorenew ?? false,
    nameservers: [],
    registrarName: 'Hostinger',
  } satisfies NormalizedDomain
}

export function mapHostingerDomains(raws: ReadonlyArray<HostingerDomainRaw>): NormalizedDomain[] {
  return raws.map(mapHostingerDomain)
}

// ── Suscripciones de facturación ──────────────────────────────────────────────
// Las suscripciones cubren planes que quizás no tienen registro en portfolio/websites
// (p. ej. un dominio .es comprado pero no visible en portfolio, o un plan de hosting).

export function mapHostingerSubscription(raw: HostingerSubscriptionRaw): NormalizedHosting {
  // expires_at viene null cuando auto-renovación está activa; usar next_billing_at como fecha de renovación
  const renewalDate = raw.expires_at ?? raw.next_billing_at ?? null
  const hashPayload = { id: raw.id, status: raw.status, next_billing_at: raw.next_billing_at }
  return {
    resourceType: 'hosting',
    externalId: `sub:${raw.id}`,
    externalName: raw.name,
    externalStatus: raw.status ?? 'unknown',
    externalPayloadHash: createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex'),
    rawMetadata: {
      type: 'subscription',
      subscriptionId: raw.id,
      name: raw.name,
      status: raw.status,
      billingPeriod: raw.billing_period,
      billingPeriodUnit: raw.billing_period_unit,
      currencyCode: raw.currency_code,
      totalPriceCents: raw.total_price,
      renewalPriceCents: raw.renewal_price,
      isAutoRenewed: raw.is_auto_renewed,
      createdAt: raw.created_at ?? null,
      expiresAt: raw.expires_at ?? null,
      nextBillingAt: raw.next_billing_at ?? null,
      // AlertEngine puede usar este campo para alertas de renovación
      expiresOn: renewalDate,
    },
  } satisfies NormalizedHosting
}

export function mapHostingerSubscriptions(raws: ReadonlyArray<HostingerSubscriptionRaw>): NormalizedHosting[] {
  return raws.map(mapHostingerSubscription)
}

// ── Websites (hosting compartido) ─────────────────────────────────────────────

export function mapHostingerWebsite(raw: HostingerWebsiteRaw): NormalizedHosting {
  const hashPayload = { domain: raw.domain, status: raw.status, is_enabled: raw.is_enabled }
  return {
    resourceType: 'hosting',
    externalId: `website:${raw.domain}`,
    externalName: raw.domain,
    externalStatus: raw.is_enabled === false ? 'disabled' : (raw.status ?? 'created'),
    externalPayloadHash: createHash('sha256').update(JSON.stringify(hashPayload)).digest('hex'),
    rawMetadata: {
      type: 'website',
      domain: raw.domain,
      username: raw.username ?? null,
      isEnabled: raw.is_enabled ?? true,
      status: raw.status ?? 'created',
      createdAt: raw.created_at ?? null,
    },
  } satisfies NormalizedHosting
}

export function mapHostingerWebsites(raws: ReadonlyArray<HostingerWebsiteRaw>): NormalizedHosting[] {
  return raws.map(mapHostingerWebsite)
}
