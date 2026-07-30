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
  secrets: z.record(z.string(), z.string().min(1)).optional().default({}),
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
