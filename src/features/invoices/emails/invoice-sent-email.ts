/**
 * Template HTML para el email de "Factura enviada".
 * Incluye resumen de la factura y botón CTA al link de pago.
 */
export function buildInvoiceSentEmail(opts: {
  clientName: string
  organizationName: string
  invoiceNumber: string
  total: string
  amountDue: string
  dueDate: string | null
  paymentUrl: string
}): { subject: string; html: string } {
  const { clientName, organizationName, invoiceNumber, total, amountDue, dueDate, paymentUrl } = opts

  const subject = `Factura ${invoiceNumber} de ${organizationName}`

  const dueLine = dueDate
    ? `<p style="margin:4px 0;color:#6b7280;font-size:14px;">Fecha de vencimiento: <strong>${dueDate}</strong></p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

          <!-- Cabecera -->
          <tr>
            <td style="background:#0f172a;padding:28px 32px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Factura de</p>
              <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${organizationName}</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hola, <strong>${clientName}</strong>:</p>
              <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">
                Te enviamos la factura <strong>${invoiceNumber}</strong> adjunta a este correo.
                Puedes revisarla y pagarla de forma segura haciendo clic en el botón de abajo.
              </p>

              <!-- Resumen de factura -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:4px 0;">
                    <p style="margin:4px 0;color:#6b7280;font-size:14px;">Número: <strong style="color:#111827;">${invoiceNumber}</strong></p>
                    <p style="margin:4px 0;color:#6b7280;font-size:14px;">Total: <strong style="color:#111827;">${total}</strong></p>
                    <p style="margin:4px 0;color:#6b7280;font-size:14px;">Pendiente: <strong style="color:#dc2626;">${amountDue}</strong></p>
                    ${dueLine}
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${paymentUrl}"
                       style="display:inline-block;background:#0f172a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Ver y pagar factura →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
                O copia este enlace en tu navegador:<br/>
                <a href="${paymentUrl}" style="color:#6366f1;word-break:break-all;">${paymentUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                Este email fue generado automáticamente por HAIO · No respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
