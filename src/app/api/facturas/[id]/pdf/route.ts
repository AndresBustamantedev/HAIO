import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getInvoicePDFData } from "@/features/invoices/pdf/get-invoice-pdf-data"
import { InvoicePDF } from "@/features/invoices/pdf/invoice-pdf"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Auth: require logged-in session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // Check user belongs to the invoice's organization
  const admin = createAdminClient()
  const { data: inv } = await admin
    .from("invoices")
    .select("organization_id")
    .eq("id", id)
    .maybeSingle()

  if (!inv) return new Response("Not Found", { status: 404 })

  const { data: member } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", inv.organization_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!member) return new Response("Forbidden", { status: 403 })

  const data = await getInvoicePDFData(id)
  if (!data) return new Response("Not Found", { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(InvoicePDF, data) as any)
  const filename = `${data.invoice.number}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
