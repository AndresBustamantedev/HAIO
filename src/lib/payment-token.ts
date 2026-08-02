import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Genera y verifica tokens firmados para links de pago públicos.
 *
 * Formato del token en la URL: {invoiceId}.{hmacBase64url}
 *
 * La clave se lee de PAYMENT_LINK_SECRET (cualquier string no vacío).
 * Si no está definida, el módulo lanza al primer uso.
 */

function getSecret(): string {
  const secret = process.env.PAYMENT_LINK_SECRET
  if (!secret) throw new Error('[payment-token] PAYMENT_LINK_SECRET no está definida.')
  return secret
}

/** Genera un token firmado para el invoice dado. */
export function generatePaymentToken(invoiceId: string): string {
  const mac = createHmac('sha256', getSecret()).update(invoiceId).digest('base64url')
  return `${invoiceId}.${mac}`
}

/**
 * Verifica el token y extrae el invoiceId.
 * Devuelve null si el token es inválido o fue manipulado.
 */
export function verifyPaymentToken(token: string): string | null {
  const dot = token.lastIndexOf('.')
  if (dot < 1) return null

  const invoiceId  = token.slice(0, dot)
  const receivedMac = token.slice(dot + 1)

  if (!invoiceId || !receivedMac) return null

  const expectedMac = createHmac('sha256', getSecret()).update(invoiceId).digest('base64url')

  try {
    const a = Buffer.from(receivedMac, 'base64url')
    const b = Buffer.from(expectedMac, 'base64url')
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return invoiceId
}
