import { z } from 'zod'

export const paypalTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string().optional(),
})

export const paypalOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  links: z.array(z.object({
    href: z.string(),
    rel: z.string(),
    method: z.string().optional(),
  })).optional(),
}).passthrough()

export const paypalCaptureSchema = z.object({
  id: z.string(),
  status: z.string(),
  purchase_units: z.array(z.object({
    payments: z.object({
      captures: z.array(z.object({
        id: z.string(),
        status: z.string(),
        amount: z.object({
          currency_code: z.string(),
          value: z.string(),
        }).optional(),
      })).optional(),
    }).optional(),
  })).optional(),
}).passthrough()

export type PayPalOrderRaw   = z.infer<typeof paypalOrderSchema>
export type PayPalCaptureRaw = z.infer<typeof paypalCaptureSchema>
