import 'server-only'

/**
 * Wrapper mínimo sobre Resend para envío de emails transaccionales.
 *
 * Requiere RESEND_API_KEY en .env.local.
 * Si no está configurada, registra en consola y devuelve null (no lanza error),
 * para que el flujo de negocio no falle por falta de config de email.
 */

type SendEmailOptions = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado:', opts.subject)
    return { success: false, error: 'RESEND_API_KEY no configurada.' }
  }

  const from =
    opts.from ??
    process.env.RESEND_FROM_EMAIL ??
    'HAIO <noreply@haio.app>'

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  })

  if (error || !data) {
    console.error('[email] Error al enviar:', error)
    return { success: false, error: error?.message ?? 'Error desconocido.' }
  }

  return { success: true, id: data.id }
}
