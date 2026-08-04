import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"

import { verifyPaymentToken } from "@/lib/payment-token"
import { getInvoicePDFData } from "@/features/invoices/pdf/get-invoice-pdf-data"
import { InvoicePDF } from "@/features/invoices/pdf/invoice-pdf"

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invoiceId = verifyPaymentToken(token)
  if (!invoiceId) return new Response("Invalid token", { status: 400 })

  const data = await getInvoicePDFData(invoiceId)
  if (!data) return new Response("Not Found", { status: 404 })

  // Only allow download if invoice is in a terminal/paid state
  const allowedStatuses = ["paid", "partially_paid", "void", "refunded", "overdue", "sent", "issued"]
  if (!allowedStatuses.includes(data.invoice.status)) {
    return new Response("PDF not available for this invoice status", { status: 403 })
  }

  const buffer = await renderToBuffer(createElement(InvoicePDF, data))
  const filename = `${data.invoice.number}.pdf`

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
