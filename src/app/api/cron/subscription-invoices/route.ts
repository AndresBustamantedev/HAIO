import 'server-only'

import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nextDocumentNumber } from '@/lib/supabase/queries/sequences'
import { addBillingInterval } from '@/features/subscriptions/utils/billing'

/**
 * GET /api/cron/subscription-invoices
 *
 * Generates draft invoices for active subscriptions whose current_period_end
 * falls within the next 14 days. Idempotent: skips subscriptions that already
 * have a non-void invoice for the current period.
 *
 * Triggered daily by Vercel Cron (see vercel.json).
 * Secured with the same CRON_SECRET used by /api/cron/sync.
 */

const BILLING_LABEL: Record<string, string> = {
  daily:      'diario',
  weekly:     'semanal',
  monthly:    'mensual',
  quarterly:  'trimestral',
  semiannual: 'semestral',
  annual:     'anual',
  biennial:   'bienal',
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/subscription-invoices] CRON_SECRET no está configurado.')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 14)

  const todayISO = toISODate(today)
  const cutoffISO = toISODate(cutoff)

  const results: Array<{ subscriptionId: string; status: string; invoiceId?: string }> = []

  // ── Paso 1: Procesar cancelaciones programadas ────────────────────────────
  const { data: toCancel } = await supabase
    .from('subscriptions')
    .select('id')
    .in('status', ['active', 'trialing', 'paused'])
    .not('cancel_at', 'is', null)
    .lte('cancel_at', todayISO)

  for (const sub of toCancel ?? []) {
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', sub.id)
    console.log(`[cron/subscription-invoices] Suscripción ${sub.id} cancelada por cancel_at`)
    results.push({ subscriptionId: sub.id, status: 'cancelled' })
  }

  // ── Paso 2: Avanzar períodos expirados ────────────────────────────────────
  const { data: expired } = await supabase
    .from('subscriptions')
    .select('id, current_period_end, billing_interval')
    .in('status', ['active', 'trialing'])
    .not('current_period_end', 'is', null)
    .lte('current_period_end', todayISO)

  for (const sub of expired ?? []) {
    if (sub.billing_interval === 'custom') continue
    const newStart = sub.current_period_end as string
    const newEnd = addBillingInterval(newStart, sub.billing_interval)
    if (!newEnd) continue
    await supabase
      .from('subscriptions')
      .update({ current_period_start: newStart, current_period_end: newEnd })
      .eq('id', sub.id)
    console.log(`[cron/subscription-invoices] Período avanzado ${sub.id}: ${newStart} → ${newEnd}`)
  }

  // ── Paso 3: Generar facturas (14 días antes del fin de período) ───────────
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('id, organization_id, client_id, project_id, service_id, amount, currency_code, billing_interval, current_period_start, current_period_end, services(name)')
    .in('status', ['active', 'trialing'])
    .not('current_period_end', 'is', null)
    .gte('current_period_end', todayISO)
    .lte('current_period_end', cutoffISO)

  if (subsError) {
    console.error('[cron/subscription-invoices] Error al cargar suscripciones:', subsError.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  for (const sub of subscriptions ?? []) {
    // Comprobar si ya existe una factura no anulada para este período
    const periodStart = sub.current_period_start ?? toISODate(new Date(today.getFullYear(), today.getMonth(), 1))
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('subscription_id', sub.id)
      .not('status', 'in', '("void","refunded")')
      .gte('created_at', `${periodStart}T00:00:00.000Z`)
      .limit(1)

    if (existing?.length > 0) {
      results.push({ subscriptionId: sub.id, status: 'skipped' })
      continue
    }

    // Generar número de factura
    let invoiceNumber: string
    try {
      invoiceNumber = await nextDocumentNumber(supabase, sub.organization_id, 'invoice', 'FAC')
    } catch (err) {
      console.error(`[cron/subscription-invoices] Error al generar número para ${sub.id}:`, err instanceof Error ? err.message : err)
      results.push({ subscriptionId: sub.id, status: 'error' })
      continue
    }

    const serviceName = (sub.services as { name?: string } | null)?.name ?? 'Suscripción'
    const intervalLabel = BILLING_LABEL[sub.billing_interval as string] ?? sub.billing_interval

    // Crear la factura borrador
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: sub.organization_id,
        client_id: sub.client_id,
        project_id: sub.project_id ?? null,
        subscription_id: sub.id,
        invoice_number: invoiceNumber,
        status: 'draft',
        issue_date: todayISO,
        currency_code: sub.currency_code ?? 'EUR',
        notes: `Generada automáticamente por suscripción activa (${intervalLabel}). Renovación prevista: ${sub.current_period_end}. Revisa el IVA y emite antes de esa fecha.`,
      })
      .select('id')
      .single()

    if (invoiceError || !invoice) {
      console.error(`[cron/subscription-invoices] Error al crear factura para ${sub.id}:`, invoiceError?.message)
      results.push({ subscriptionId: sub.id, status: 'error' })
      continue
    }

    // Añadir línea de factura
    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        description: `${serviceName} — renovación ${intervalLabel}`,
        quantity: 1,
        unit_price: sub.amount,
        tax_rate: 0,
        discount_percent: 0,
        position: 0,
      })

    if (itemError) {
      console.error(`[cron/subscription-invoices] Error al crear línea para factura ${invoice.id}:`, itemError.message)
      results.push({ subscriptionId: sub.id, status: 'error' })
      continue
    }

    await supabase.rpc('recalculate_invoice_totals', { p_invoice_id: invoice.id })

    console.log(`[cron/subscription-invoices] Factura ${invoiceNumber} creada para suscripción ${sub.id}`)
    results.push({ subscriptionId: sub.id, status: 'created', invoiceId: invoice.id })
  }

  return NextResponse.json({ processed: results.length, results })
}
