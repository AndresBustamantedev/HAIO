import { z } from 'zod'

export const createIntegrationSchema = z.object({
  connector_type: z.string().min(1, 'El tipo de conector es obligatorio.'),
  name: z.string().max(100).optional(),
  environment: z.enum(['production', 'sandbox']).default('production'),
  /**
   * Frecuencia de sincronización automática.
   * Refleja la columna sync_frequency TEXT con check ('hourly','daily','weekly').
   */
  sync_frequency: z
    .enum(['hourly', 'daily', 'weekly'])
    .optional()
    .default('daily'),
  sync_enabled: z.boolean().optional().default(false),
  /**
   * Secretos a cifrar. El cliente nunca recibe estos valores de vuelta.
   * Mapa de secret_type → valor en texto plano.
   */
  // Valores vacíos se filtran en el formulario antes de enviar; aquí solo validamos el tipo.
  secrets: z.record(z.string(), z.string()).optional().default({}),
})

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>

export const updateIntegrationSchema = z.object({
  name: z.string().max(100).optional(),
  sync_frequency: z.enum(['hourly', 'daily', 'weekly']).optional(),
  sync_enabled: z.boolean().optional(),
  status: z
    .enum(['disconnected', 'pending', 'connected', 'degraded', 'error', 'disabled'])
    .optional(),
})

export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>

/** Campos editables desde la UI de configuración. */
export const updateIntegrationSettingsSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío.').max(100),
  sync_frequency: z.enum(['hourly', 'daily', 'weekly']),
  sync_enabled: z.boolean(),
})
export type UpdateIntegrationSettingsInput = z.infer<typeof updateIntegrationSettingsSchema>

/** Pre-test de conexión con credenciales en texto plano (nunca se guardan). */
export const preTestConnectionSchema = z.object({
  connector_type: z.string().min(1),
  environment: z.enum(['production', 'sandbox']),
  secrets: z.record(z.string(), z.string().min(1)),
})
export type PreTestConnectionInput = z.infer<typeof preTestConnectionSchema>

/** Rotación de credenciales: reemplaza los secretos cifrados. Valores vacíos se omiten. */
export const rotateCredentialsSchema = z.object({
  secrets: z.record(z.string(), z.string()),
})
export type RotateCredentialsInput = z.infer<typeof rotateCredentialsSchema>

/** Vincula un recurso externo a un dominio local existente. */
export const linkExternalResourceSchema = z.object({
  externalResourceId: z.string().uuid('ID de recurso inválido.'),
  localResourceId: z.string().uuid('ID de dominio inválido.'),
  localResourceType: z.literal('domain'),
})
export type LinkExternalResourceInput = z.infer<typeof linkExternalResourceSchema>

/** Importa un recurso externo creando un dominio local nuevo. */
export const importDomainFromResourceSchema = z.object({
  externalResourceId: z.string().uuid('ID de recurso inválido.'),
  clientId: z.string().uuid('Debes seleccionar un cliente.'),
  projectId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})
export type ImportDomainFromResourceInput = z.infer<typeof importDomainFromResourceSchema>

/** Desvincula un recurso externo de su dominio local sin borrar nada. */
export const unlinkExternalResourceSchema = z.object({
  externalResourceId: z.string().uuid('ID de recurso inválido.'),
})
export type UnlinkExternalResourceInput = z.infer<typeof unlinkExternalResourceSchema>
