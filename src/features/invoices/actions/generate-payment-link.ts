'use server'

import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getCurrentOrganization } from '@/lib/supabase/queries/organizations'
import { generatePaymentToken } from '@/lib/payment-token'

type Result = { success: true; url: string } | { success: false; error: string }

export async function generateInvoicePaymentLink(invoiceId: string): Promise<Result> {
  if (!invoiceId) return { success: false, error: 'ID de factura no válido.' }

  const organization = await getCurrentOrganization()
  if (!organization) return { success: false, error: 'No perteneces a ninguna organización.' }

  // Verificar que la factura pertenece a la organización del usuario
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: invoice } = await db
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .eq('organization_id', organization.organizationId)
    .maybeSingle()

  if (!invoice) return { success: false, error: 'Factura no encontrada.' }
  if (invoice.status === 'void') return { success: false, error: 'No se puede generar un link para una factura anulada.' }

  const token = generatePaymentToken(invoiceId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return { success: true, url: `${appUrl}/pagar/${token}` }
}
