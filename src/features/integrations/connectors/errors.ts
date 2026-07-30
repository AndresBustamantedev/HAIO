/**
 * Errores normalizados para todos los conectores.
 *
 * Los mensajes de error que llegan al usuario nunca deben contener:
 * - Secretos, tokens o claves
 * - Respuestas completas de la API del proveedor
 * - Datos internos de la infraestructura
 */

export type ConnectorErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_NOT_FOUND'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN_PROVIDER_ERROR'
  | 'UNKNOWN_CONNECTOR'
  | 'CAPABILITY_NOT_SUPPORTED'

const USER_MESSAGES: Record<ConnectorErrorCode, string> = {
  INVALID_CREDENTIALS:
    'Las credenciales de la integración no son válidas o han caducado. Actualiza la API key.',
  RATE_LIMITED:
    'La API del proveedor ha rechazado la solicitud por exceso de peticiones. Vuelve a intentarlo en unos minutos.',
  PROVIDER_UNAVAILABLE:
    'El servicio del proveedor no está disponible en este momento. Inténtalo más tarde.',
  TIMEOUT:
    'La solicitud al proveedor superó el tiempo límite. Comprueba la conexión e inténtalo de nuevo.',
  PERMISSION_DENIED:
    'Las credenciales no tienen permisos suficientes para esta operación.',
  RESOURCE_NOT_FOUND:
    'El recurso solicitado no existe en el proveedor o no es accesible con estas credenciales.',
  INVALID_RESPONSE:
    'La respuesta del proveedor tiene un formato inesperado. Es posible que la API haya cambiado.',
  UNKNOWN_PROVIDER_ERROR:
    'El proveedor devolvió un error desconocido. Consulta el historial para más detalles.',
  UNKNOWN_CONNECTOR:
    'No existe un conector registrado para este tipo de integración.',
  CAPABILITY_NOT_SUPPORTED:
    'Esta operación no está disponible para el conector seleccionado.',
}

export class ConnectorError extends Error {
  readonly code: ConnectorErrorCode
  /** Mensaje técnico interno (puede contener detalles de la API, sin secretos). */
  readonly technicalDetail: string | undefined
  /** Si vale true, se puede reintentar con backoff. */
  readonly retryable: boolean
  /** Segundos sugeridos para el siguiente reintento (de los headers de la API). */
  readonly retryAfterSeconds: number | undefined

  constructor(
    code: ConnectorErrorCode,
    options?: {
      technicalDetail?: string
      retryable?: boolean
      retryAfterSeconds?: number
    },
  ) {
    // El mensaje público nunca contiene detalles técnicos.
    super(USER_MESSAGES[code])
    this.name = 'ConnectorError'
    this.code = code
    this.technicalDetail = options?.technicalDetail
    this.retryable = options?.retryable ?? false
    this.retryAfterSeconds = options?.retryAfterSeconds
  }

  /** Mensaje seguro para mostrar al usuario (sin secretos ni detalles internos). */
  get userMessage(): string {
    return USER_MESSAGES[this.code]
  }

  /** Resumen seguro para guardar en error_summary (sin secretos). */
  toSafeErrorSummary(): string {
    return `[${this.code}] ${this.message}`
  }
}

export class UnknownConnectorError extends ConnectorError {
  constructor(connectorType: string) {
    super('UNKNOWN_CONNECTOR', {
      technicalDetail: `No hay conector registrado para el tipo: ${connectorType}`,
    })
    this.name = 'UnknownConnectorError'
  }
}

export class CapabilityNotSupportedError extends ConnectorError {
  constructor(capability: string, connectorType: string) {
    super('CAPABILITY_NOT_SUPPORTED', {
      technicalDetail: `El conector '${connectorType}' no soporta la capacidad '${capability}'`,
    })
    this.name = 'CapabilityNotSupportedError'
  }
}

/** Convierte un error desconocido a ConnectorError sin filtrar detalles sensibles. */
export function toConnectorError(err: unknown): ConnectorError {
  if (err instanceof ConnectorError) return err

  if (err instanceof Error) {
    return new ConnectorError('UNKNOWN_PROVIDER_ERROR', {
      // Solo guardamos el tipo de error y un fragmento del mensaje (nunca el stack completo).
      technicalDetail: `${err.constructor.name}: ${err.message.slice(0, 200)}`,
    })
  }

  return new ConnectorError('UNKNOWN_PROVIDER_ERROR')
}
