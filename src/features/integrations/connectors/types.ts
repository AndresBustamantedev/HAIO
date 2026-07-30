/**
 * Contrato común para todos los conectores de proveedores externos.
 *
 * Un conector implementa esta interfaz y declara explícitamente qué
 * capacidades soporta. Nunca simula capacidades que la API no proporciona.
 *
 * La capa de datos normalizada (NormalizedDomain, etc.) es independiente
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
  // Hosting
  | 'hosting.read'
  | 'hosting.usage'
  // Correo
  | 'email.read'
  | 'mailboxes.read'
  // SSL
  | 'ssl.read'
  | 'ssl.write'
  // Facturación
  | 'billing.read'
  // Usuarios y proyectos
  | 'users.read'
  | 'projects.read'
  // Backups y webhooks
  | 'backups.read'
  | 'webhooks'

// ── Tipos de recursos normalizados ───────────────────────────────────────────

/**
 * Tipo de recurso externo genérico.
 * El conector puede devolver cualquier tipo de recurso; el SyncEngine
 * sabe cómo procesarlos.
 */
export type ExternalResourceType =
  | 'domain'
  | 'dns_zone'
  | 'hosting'
  | 'website'
  | 'ssl_certificate'
  | 'email_service'
  | 'mailbox'
  | 'database'
  | 'ftp_account'
  | 'repository'
  | 'deployment'
  | 'backup'
  | 'project'

/**
 * Dominio normalizado — común a todos los proveedores.
 * El conector mapea su respuesta específica a este tipo.
 */
export type NormalizedDomain = {
  readonly resourceType: 'domain'
  readonly externalId: string         // Identificador en el proveedor (nombre del dominio en GoDaddy)
  readonly domainName: string
  readonly status: 'active' | 'expired' | 'cancelled' | 'transferred' | 'pending' | 'unknown'
  readonly expiresOn: Date | null
  readonly autoRenew: boolean
  readonly nameservers: ReadonlyArray<string>
  readonly registrarName: string | null
  // SHA-256 del payload normalizado. Solo para detectar cambios (no es clave de identidad).
  readonly externalPayloadHash: string
  // Payload original del proveedor, sin secretos.
  readonly rawMetadata: Readonly<Record<string, unknown>>
}

/** Unión de todos los tipos de recursos normalizados (ampliable). */
export type NormalizedResource = NormalizedDomain

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
  // Secretos descifrados: secret_type → valor en texto plano.
  // Solo existen en memoria durante la ejecución. Nunca se loguean.
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
  /** Identificador del tipo de conector. Debe coincidir con integrations.connector_type. */
  readonly connectorType: string

  /** Capacidades que este conector puede ejercer con la API del proveedor. */
  readonly capabilities: ReadonlySet<ConnectorCapability>

  /**
   * Verifica que las credenciales son válidas y la API está accesible.
   * No debe persistir ningún dato.
   */
  testConnection(
    secrets: ReadonlyMap<string, string>,
    environment: 'production' | 'sandbox',
  ): Promise<ConnectionTestResult>

  /**
   * Lista dominios de la cuenta (solo si 'domains.read' está en capabilities).
   * Retorna todos los dominios paginando internamente.
   */
  listDomains?(context: SyncContext): Promise<ReadonlyArray<NormalizedDomain>>

  /**
   * Punto de entrada principal de sincronización.
   * El conector llama a la API, normaliza los resultados y los devuelve.
   * No escribe en base de datos.
   */
  sync(context: SyncContext): Promise<{
    domains?: ReadonlyArray<NormalizedDomain>
  }>
}

// ── Información de registro del conector ─────────────────────────────────────

/** Metadata del conector que aparece en la UI al configurar una integración. */
export type ConnectorMeta = {
  readonly connectorType: string
  readonly displayName: string
  readonly description: string
  readonly logoPath?: string
  readonly documentationUrl?: string
  /** Tipos de secretos que necesita configurar el usuario. */
  readonly requiredSecrets: ReadonlyArray<{
    readonly type: string
    readonly label: string
    readonly description: string
    readonly isPassword: boolean
  }>
  readonly capabilities: ReadonlySet<ConnectorCapability>
  readonly supportedEnvironments: ReadonlyArray<'production' | 'sandbox'>
}
