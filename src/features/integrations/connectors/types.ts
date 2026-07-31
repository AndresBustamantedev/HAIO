/**
 * Contrato común para todos los conectores de proveedores externos.
 *
 * Un conector implementa esta interfaz y declara explícitamente qué
 * capacidades soporta. Nunca simula capacidades que la API no proporciona.
 *
 * La capa de datos normalizada (NormalizedResource y subtipos) es independiente
 * de cualquier proveedor. El SyncEngine trabaja siempre con estos tipos.
 */

// ── Capacidades ───────────────────────────────────────────────────────────────

export type ConnectorCapability =
  // Dominios
  | 'domains.read'
  | 'domains.expiration'
  | 'domains.autorenew'
  | 'domains.nameservers'
  | 'domains.dns'
  | 'domains.lock'
  | 'domains.transfer'
  // DNS
  | 'dns.read'
  | 'dns.write'
  // Hosting / VPS
  | 'hosting.read'
  | 'hosting.usage'
  // Correo
  | 'mail.read'
  | 'email.read'       // alias legacy
  | 'mailboxes.read'
  // SSL
  | 'ssl.read'
  | 'ssl.write'
  // Repositorios y despliegues
  | 'repositories.read'
  | 'deployments.read'
  // Proyectos y bases de datos
  | 'projects.read'
  | 'databases.read'
  // Facturación, pagos y suscripciones
  | 'billing.read'
  | 'billing.write'
  | 'subscriptions.read'
  | 'invoices.read'
  | 'customers.read'
  // Usuarios, backups y webhooks
  | 'users.read'
  | 'backups.read'
  | 'webhooks'

// ── Tipos de recursos externos ────────────────────────────────────────────────

export type ExternalResourceType =
  | 'domain'
  | 'dns_zone'
  | 'dns_record'
  | 'hosting'
  | 'website'
  | 'ssl_certificate'
  | 'email_service'
  | 'mail_service'
  | 'mailbox'
  | 'database'
  | 'ftp_account'
  | 'repository'
  | 'deployment'
  | 'backup'
  | 'project'
  | 'payment_customer'
  | 'payment_subscription'
  | 'payment_invoice'

// ── Tipos normalizados ────────────────────────────────────────────────────────

/**
 * Base compartida por todos los tipos de recurso normalizado.
 * El ResourceMatcher opera sobre este contrato genérico.
 */
export type NormalizedResourceBase = {
  readonly resourceType: ExternalResourceType
  /** Identificador estable en el proveedor (clave de identidad para el ResourceMatcher). */
  readonly externalId: string
  /** Etiqueta legible para humanos (dominio, nombre del repo, hostname…). */
  readonly externalName: string
  /** Estado en el proveedor como string (ej. 'active', 'running', 'archived'). */
  readonly externalStatus: string
  /** SHA-256 de los campos que pueden cambiar entre syncs. Detecta actualizaciones. */
  readonly externalPayloadHash: string
  /** Payload original del proveedor sin secretos. Incluye expiresOn para SSL/dominios. */
  readonly rawMetadata: Readonly<Record<string, unknown>>
}

/** Dominio registrado — soportado por GoDaddy, Namecheap, Porkbun, OVH, etc. */
export type NormalizedDomain = NormalizedResourceBase & {
  readonly resourceType: 'domain'
  readonly domainName: string
  readonly status: 'active' | 'expired' | 'cancelled' | 'transferred' | 'pending' | 'unknown'
  /** rawMetadata.expiresOn debe contener este valor como ISO string (lo lee el AlertEngine). */
  readonly expiresOn: Date | null
  readonly autoRenew: boolean
  readonly nameservers: ReadonlyArray<string>
  readonly registrarName: string | null
}

/** Zona DNS — soportado por Cloudflare, OVH. */
export type NormalizedDNSZone = NormalizedResourceBase & {
  readonly resourceType: 'dns_zone'
}

/** Certificado SSL — soportado por Cloudflare, Porkbun. rawMetadata.expiresOn para alertas. */
export type NormalizedSSLCertificate = NormalizedResourceBase & {
  readonly resourceType: 'ssl_certificate'
}

/** Hosting / VPS — soportado por Hostinger, OVH. */
export type NormalizedHosting = NormalizedResourceBase & {
  readonly resourceType: 'hosting'
}

/** Repositorio de código — soportado por GitHub. */
export type NormalizedRepository = NormalizedResourceBase & {
  readonly resourceType: 'repository'
}

/** Despliegue de aplicación — soportado por Vercel. */
export type NormalizedDeployment = NormalizedResourceBase & {
  readonly resourceType: 'deployment'
}

/** Proyecto (Vercel, Supabase). */
export type NormalizedProject = NormalizedResourceBase & {
  readonly resourceType: 'project'
}

/** Servicio de correo (cuenta organizativa) — Zoho Mail, Google Workspace, Microsoft 365. */
export type NormalizedMailService = NormalizedResourceBase & {
  readonly resourceType: 'mail_service'
}

/** Buzón de correo individual — Zoho Mail, Google Workspace, Microsoft 365. */
export type NormalizedMailbox = NormalizedResourceBase & {
  readonly resourceType: 'mailbox'
}

/** Base de datos — Supabase. */
export type NormalizedDatabase = NormalizedResourceBase & {
  readonly resourceType: 'database'
}

/** Cliente de pago — Stripe, PayPal. Representa un customer en el proveedor. */
export type NormalizedPaymentCustomer = NormalizedResourceBase & {
  readonly resourceType: 'payment_customer'
}

/** Suscripción recurrente — Stripe. rawMetadata.expiresOn = currentPeriodEnd. */
export type NormalizedPaymentSubscription = NormalizedResourceBase & {
  readonly resourceType: 'payment_subscription'
}

/** Factura de pago — Stripe. */
export type NormalizedPaymentInvoice = NormalizedResourceBase & {
  readonly resourceType: 'payment_invoice'
}

/** Unión discriminada de todos los tipos de recurso normalizado. */
export type NormalizedResource =
  | NormalizedDomain
  | NormalizedDNSZone
  | NormalizedSSLCertificate
  | NormalizedHosting
  | NormalizedRepository
  | NormalizedDeployment
  | NormalizedProject
  | NormalizedMailService
  | NormalizedMailbox
  | NormalizedDatabase
  | NormalizedPaymentCustomer
  | NormalizedPaymentSubscription
  | NormalizedPaymentInvoice

// ── Contexto de sincronización ────────────────────────────────────────────────

/**
 * Contexto que el SyncEngine pasa al conector durante una sync.
 * Los secretos descifrados se pasan aquí y no se persisten en ningún lugar.
 */
export type SyncContext = {
  readonly integrationId: string
  readonly organizationId: string
  readonly syncRunId: string
  readonly environment: 'production' | 'sandbox'
  readonly decryptedSecrets: ReadonlyMap<string, string>
}

// ── Resultados ────────────────────────────────────────────────────────────────

export type ConnectionTestResult = {
  readonly success: true
  readonly accountName?: string
  readonly accountEmail?: string
  readonly additionalInfo?: Record<string, unknown>
} | {
  readonly success: false
  readonly error: import('./errors').ConnectorError
}

export type SyncResult = {
  readonly resourcesFound: number
  readonly resourcesCreated: number
  readonly resourcesUpdated: number
  readonly resourcesUnchanged: number
  readonly resourcesFailed: number
  readonly errors: ReadonlyArray<import('./errors').ConnectorError>
}

// ── Interfaz del conector ─────────────────────────────────────────────────────

/**
 * Contrato que todo conector debe implementar.
 *
 * Un conector:
 * - Declara qué capabilities soporta (ReadonlySet para inmutabilidad).
 * - Nunca simula capabilities que la API no tiene.
 * - Normaliza los datos del proveedor al formato interno de HAIO.
 * - No persiste nada en base de datos (eso lo hace el SyncEngine).
 * - No loguea secretos.
 * - Respeta rate limits y timeout.
 */
export interface ProviderConnector {
  readonly connectorType: string
  readonly capabilities: ReadonlySet<ConnectorCapability>

  testConnection(
    secrets: ReadonlyMap<string, string>,
    environment: 'production' | 'sandbox',
  ): Promise<ConnectionTestResult>

  /** Solo para conectores con 'domains.read'. Retorna todos los dominios paginando internamente. */
  listDomains?(context: SyncContext): Promise<ReadonlyArray<NormalizedDomain>>

  /**
   * Punto de entrada principal de sincronización.
   * Devuelve todos los recursos normalizados de todos los tipos que el conector soporta.
   * No escribe en base de datos.
   */
  sync(context: SyncContext): Promise<{
    resources: ReadonlyArray<NormalizedResource>
  }>
}

// ── Metadata del conector ─────────────────────────────────────────────────────

export type ConnectorStatus =
  | 'available'
  | 'setup_required'
  | 'experimental'
  | 'coming_soon'

export type ConnectorMeta = {
  readonly connectorType: string
  readonly displayName: string
  readonly description: string
  readonly category: string
  readonly status: ConnectorStatus
  readonly logoPath?: string
  readonly documentationUrl?: string
  /** Pasos previos que el usuario debe completar fuera de HAIO. */
  readonly setupInstructions?: ReadonlyArray<string>
  readonly requiredSecrets: ReadonlyArray<{
    readonly type: string
    readonly label: string
    readonly description: string
    readonly isPassword: boolean
    /** Si true, el campo puede quedar vacío sin bloquear la creación. */
    readonly optional?: boolean
  }>
  readonly capabilities: ReadonlySet<ConnectorCapability>
  readonly supportedEnvironments: ReadonlyArray<'production' | 'sandbox'>
}
