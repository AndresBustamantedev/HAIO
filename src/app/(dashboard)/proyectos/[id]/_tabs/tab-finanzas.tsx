import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { CostAddExpense } from "./cost-add-expense"
import { CostExpenseActions } from "./cost-expense-actions"
import { CostAddService } from "./cost-add-service"
import { CostAddMilestone } from "./cost-add-milestone"
import { CostAddSubscription } from "./cost-add-subscription"
import { ClientServiceActions } from "@/features/client-services/components/client-service-actions"
import { MilestoneRowActions } from "@/features/billing-milestones/components/milestone-row-actions"
import { MilestoneDetailSheet } from "@/features/billing-milestones/components/milestone-detail-sheet"
import { WorkStatusSelect, BillingStatusSelect } from "@/features/billing-milestones/components/milestone-status-select"
import { getServiceOptions } from "@/features/services/queries/get-service-options"
import { getProjectMilestones } from "@/features/billing-milestones/queries/get-project-milestones"
import { getProjectSubscriptions } from "@/features/subscriptions/queries/get-project-subscriptions"

type View = "resumen" | "hitos" | "recurrentes" | "costes"

type Props = {
  projectId: string
  clientId: string
  budget: number | null
  currencyCode: string | null
  organizationId: string
  view: View
}

type Expense = {
  id: string
  description: string
  amount: number
  currency_code: string
  category: string
  incurred_at: string
  notes: string | null
  milestone_id: string | null
}

const VIEWS: { id: View; label: string }[] = [
  { id: "resumen",     label: "Resumen" },
  { id: "hitos",       label: "Hitos" },
  { id: "recurrentes", label: "Recurrentes" },
  { id: "costes",      label: "Costes y rentabilidad" },
]

const BILLING_LABEL: Record<string, string> = {
  weekly: "Semanal", monthly: "Mensual", quarterly: "Trimestral",
  semiannual: "Semestral", annual: "Anual", biennial: "Bienal",
  custom: "Personalizado", one_time: "Único",
}

const BILLING_STATUS_STYLE: Record<string, string> = {
  unbilled:       "bg-muted text-muted-foreground",
  invoice_draft:  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  invoiced:       "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  partially_paid: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  paid:           "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  credited:       "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  cancelled:      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const BILLING_STATUS_LABEL: Record<string, string> = {
  unbilled:       "Sin facturar",
  invoice_draft:  "Borrador",
  invoiced:       "Facturado",
  partially_paid: "Parcial",
  paid:           "Cobrado",
  credited:       "Abonado",
  cancelled:      "Cancelado",
}

const WORK_STATUS_STYLE: Record<string, string> = {
  draft:       "bg-muted text-muted-foreground",
  planned:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  in_review:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const WORK_STATUS_LABEL: Record<string, string> = {
  draft:       "Borrador",
  planned:     "Planificado",
  in_progress: "En progreso",
  in_review:   "En revisión",
  completed:   "Completado",
  cancelled:   "Cancelado",
}

const TYPE_STYLE: Record<string, string> = {
  development: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  maintenance: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  extra:       "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  renewal:     "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  other:       "bg-muted text-muted-foreground",
}

const TYPE_LABEL: Record<string, string> = {
  development: "Desarrollo",
  maintenance: "Mantenimiento",
  extra:       "Extra",
  renewal:     "Renovación",
  other:       "Otro",
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Hosting", domain: "Dominio", license: "Licencia",
  tool: "Herramienta", design: "Diseño", development: "Desarrollo", other: "Otro",
}

function fmt(v: number | null, cur: string | null) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur ?? "EUR" }).format(v)
}

function fmtDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function toAnnual(amount: number, interval: string | null): number {
  switch (interval) {
    case "weekly":    return amount * 52
    case "monthly":   return amount * 12
    case "quarterly": return amount * 4
    case "semiannual": return amount * 2
    case "biannual":  return amount * 2
    case "annual":    return amount
    case "one_time":  return 0
    default:          return amount
  }
}

function SubNav({ projectId, activeView }: { projectId: string; activeView: View }) {
  return (
    <nav className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
      {VIEWS.map((v) => {
        const isActive = v.id === activeView
        return (
          <Link
            key={v.id}
            href={`/proyectos/${projectId}?tab=finanzas&view=${v.id}`}
            className={[
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {v.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Stat({
  label, value, highlight, subtitle,
}: {
  label: string
  value: string
  highlight?: "positive" | "negative"
  subtitle?: string
}) {
  const colorClass =
    highlight === "positive" ? "text-green-600 dark:text-green-400"
    : highlight === "negative" ? "text-red-600 dark:text-red-400"
    : "text-foreground"
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-semibold ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

function SectionSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export async function TabFinanzas({ projectId, clientId, budget, currencyCode, organizationId, view }: Props) {
  const cur = currencyCode ?? "EUR"
  const supabase = await createClient()

  const [serviceOptions, milestones, subscriptions, servicesRes, hostingRes, domainsRes, expensesRes] = await Promise.all([
    getServiceOptions(organizationId),
    getProjectMilestones(projectId),
    getProjectSubscriptions(projectId),
    supabase
      .from("client_services")
      .select("id, service_id, name_override, quantity, unit_price, currency_code, billing_interval, starts_on, ends_on, notes, status, services(name, category)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("hosting_accounts")
      .select("id, provider_name, plan_name, renewal_price, internal_cost, currency_code, billing_interval, status, expires_on")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    supabase
      .from("domains")
      .select("id, domain_name, renewal_price, internal_cost, currency_code, expires_on")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("project_expenses")
      .select("id, description, amount, currency_code, category, incurred_at, notes, milestone_id")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("incurred_at", { ascending: false }),
  ])

  const services = servicesRes.data ?? []
  const hosting = hostingRes.data ?? []
  const domains = domainsRes.data ?? []
  const allExpenses = (expensesRes.data ?? []) as Expense[]

  const generalExpenses = allExpenses.filter(e => !e.milestone_id)
  const milestoneExpensesMap: Record<string, Expense[]> = {}
  for (const e of allExpenses) {
    if (e.milestone_id) {
      if (!milestoneExpensesMap[e.milestone_id]) milestoneExpensesMap[e.milestone_id] = []
      milestoneExpensesMap[e.milestone_id].push(e)
    }
  }

  const billedMilestones = milestones.filter(m =>
    m.billing_status === "invoiced" || m.billing_status === "partially_paid" || m.billing_status === "paid"
  )
  const pendingMilestones = milestones.filter(m =>
    m.billing_status === "unbilled" && m.work_status !== "cancelled"
  )
  const milestonesRevenue    = billedMilestones.reduce((acc, m) => acc + m.amount, 0)
  const milestonesPending    = pendingMilestones.reduce((acc, m) => acc + m.amount, 0)
  const milestonesInternalCost = milestones.reduce((acc, m) => acc + (m.internal_cost ?? 0), 0)

  const subscriptionsAnnual    = subscriptions.reduce((acc, s) => acc + toAnnual(s.amount, s.billing_interval), 0)
  const servicesAnnual         = services.reduce((acc, s) => acc + toAnnual(s.unit_price * s.quantity, s.billing_interval), 0)
  const domainsRenewalAnnual   = domains.reduce((acc, d) => acc + (d.renewal_price ?? 0), 0)
  const hostingRenewalAnnual   = hosting.reduce((acc, h) => acc + toAnnual(h.renewal_price ?? 0, h.billing_interval), 0)
  const totalAnnualRevenue     = subscriptionsAnnual + servicesAnnual + domainsRenewalAnnual + hostingRenewalAnnual

  const generalExpensesTotal   = generalExpenses.reduce((acc, e) => acc + e.amount, 0)
  const milestoneExpensesTotal = Object.values(milestoneExpensesMap).flat().reduce((acc, e) => acc + e.amount, 0)
  const expensesTotal          = generalExpensesTotal + milestoneExpensesTotal
  const domainsInternalAnnual  = domains.reduce((acc, d) => acc + (d.internal_cost ?? 0), 0)
  const hostingInternalAnnual  = hosting.reduce((acc, h) => acc + toAnnual(h.internal_cost ?? 0, h.billing_interval), 0)

  const devMargin      = milestonesRevenue > 0 ? milestonesRevenue - milestonesInternalCost - expensesTotal : null
  const recurringMargin = totalAnnualRevenue - (domainsInternalAnnual + hostingInternalAnnual)

  const hasInternalCosts = domains.some(d => d.internal_cost) || hosting.some(h => h.internal_cost)

  return (
    <div className="flex flex-col gap-5">
      <SubNav projectId={projectId} activeView={view} />

      {/* ── RESUMEN ─────────────────────────────────────────────────────────── */}
      {view === "resumen" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Facturado"
              value={milestonesRevenue > 0 ? fmt(milestonesRevenue, cur) : "—"}
              subtitle="hitos facturados y cobrados"
            />
            <Stat
              label="Por cobrar"
              value={milestonesPending > 0 ? fmt(milestonesPending, cur) : "—"}
              subtitle="hitos presupuestados"
            />
            <Stat
              label="Recurrente / año"
              value={totalAnnualRevenue > 0 ? fmt(totalAnnualRevenue, cur) : "—"}
              subtitle="servicios y renovaciones"
            />
            <Stat
              label="Margen desarrollo"
              value={devMargin != null ? fmt(devMargin, cur) : "—"}
              highlight={devMargin != null ? (devMargin >= 0 ? "positive" : "negative") : undefined}
              subtitle="ingresos − costes"
            />
          </div>

          {/* Mini-tabla de hitos */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
              <p className="text-sm font-medium text-foreground">
                Hitos
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({milestones.length})</span>
              </p>
              <Link
                href={`/proyectos/${projectId}?tab=finanzas&view=hitos`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            {milestones.length === 0 ? (
              <div className="px-4 py-6">
                <EmptyState title="Sin hitos" description="Añade hitos en la pestaña Hitos." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pt-3 pl-4 text-left font-medium">Hito</th>
                      <th className="pb-2 pt-3 text-left font-medium">Tipo</th>
                      <th className="pb-2 pt-3 text-left font-medium">Facturación</th>
                      <th className="pb-2 pt-3 text-right font-medium pr-4">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2.5 pl-4 font-medium text-foreground max-w-[200px] truncate">{m.name}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[m.type] ?? ""}`}>
                            {TYPE_LABEL[m.type] ?? m.type}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[m.billing_status] ?? ""}`}>
                            {BILLING_STATUS_LABEL[m.billing_status] ?? m.billing_status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold">{fmt(m.amount, m.currency_code)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {milestones.length > 1 && (
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={3} className="py-2.5 pl-4 text-xs text-muted-foreground">Total</td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold">{fmt(milestonesRevenue + milestonesPending, cur)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Viabilidad */}
          {(milestones.length > 0 || totalAnnualRevenue > 0) && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Resumen de viabilidad</p>
              <div className="flex flex-col gap-2 text-sm">
                {milestonesRevenue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Facturado (hitos)</span>
                    <span className="font-mono text-green-600 dark:text-green-400">+{fmt(milestonesRevenue, cur)}</span>
                  </div>
                )}
                {milestonesInternalCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coste interno de hitos</span>
                    <span className="font-mono text-red-600 dark:text-red-400">−{fmt(milestonesInternalCost, cur)}</span>
                  </div>
                )}
                {expensesTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gastos del proyecto</span>
                    <span className="font-mono text-red-600 dark:text-red-400">−{fmt(expensesTotal, cur)}</span>
                  </div>
                )}
                {devMargin != null && (
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-medium">Margen de desarrollo</span>
                    <span className={`font-mono font-semibold ${devMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {fmt(devMargin, cur)}
                    </span>
                  </div>
                )}
                {totalAnnualRevenue > 0 && (
                  <>
                    <div className="flex items-center justify-between border-t pt-2 mt-1">
                      <span className="text-muted-foreground">Ingresos recurrentes / año</span>
                      <span className="font-mono text-green-600 dark:text-green-400">+{fmt(totalAnnualRevenue, cur)}</span>
                    </div>
                    {(domainsInternalAnnual + hostingInternalAnnual) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Costes recurrentes / año</span>
                        <span className="font-mono text-red-600 dark:text-red-400">−{fmt(domainsInternalAnnual + hostingInternalAnnual, cur)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Margen recurrente / año</span>
                      <span className={`font-mono font-semibold ${recurringMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(recurringMargin, cur)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HITOS ───────────────────────────────────────────────────────────── */}
      {view === "hitos" && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
            <p className="text-sm font-medium text-foreground">
              Hitos de facturación
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">({milestones.length})</span>
            </p>
            <CostAddMilestone projectId={projectId} clientId={clientId} organizationId={organizationId} />
          </div>

          {milestones.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState
                title="Sin hitos"
                description="Añade hitos para registrar cobros de desarrollo, mantenimientos o trabajos extra."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 pt-3 pl-4 text-left font-medium">Hito</th>
                    <th className="pb-2 pt-3 text-left font-medium">Tipo</th>
                    <th className="pb-2 pt-3 text-left font-medium">Trabajo</th>
                    <th className="pb-2 pt-3 text-left font-medium">Facturación</th>
                    <th className="pb-2 pt-3 text-left font-medium">Fecha</th>
                    <th className="pb-2 pt-3 text-right font-medium">Importe</th>
                    <th className="pb-2 pt-3 text-right font-medium">Margen</th>
                    <th className="pb-2 pt-3 text-center font-medium">Factura</th>
                    <th className="pb-2 pt-3 pr-4 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m) => {
                    const milestoneExpenses = milestoneExpensesMap[m.id] ?? []
                    const milestoneExpensesSum = milestoneExpenses.reduce((s, e) => s + e.amount, 0)
                    const totalCost = (m.internal_cost ?? 0) + milestoneExpensesSum
                    const margin = totalCost > 0 || m.internal_cost != null ? m.amount - totalCost : null
                    return (
                      <tr key={m.id} className="border-b last:border-0 group">
                        <td className="py-3 pl-4">
                          <MilestoneDetailSheet milestone={m} projectId={projectId} clientId={clientId} />
                          {milestoneExpenses.length > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              {milestoneExpenses.length} gasto{milestoneExpenses.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[m.type] ?? ""}`}>
                            {TYPE_LABEL[m.type] ?? m.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <WorkStatusSelect
                            milestoneId={m.id}
                            projectId={projectId}
                            value={m.work_status}
                          />
                        </td>
                        <td className="py-3">
                          <BillingStatusSelect
                            milestoneId={m.id}
                            projectId={projectId}
                            value={m.billing_status}
                          />
                        </td>
                        <td className="py-3 text-muted-foreground whitespace-nowrap">{fmtDate(m.planned_date)}</td>
                        <td className="py-3 text-right font-mono font-semibold">{fmt(m.amount, m.currency_code)}</td>
                        <td className={`py-3 text-right font-mono text-sm ${margin != null && margin >= 0 ? "text-green-600 dark:text-green-400" : margin != null ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                          {margin != null ? fmt(margin, m.currency_code) : "—"}
                        </td>
                        <td className="py-3 text-center">
                          {m.invoice_number ? (
                            <span className="text-xs font-mono text-muted-foreground">{m.invoice_number}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <MilestoneRowActions milestone={m} projectId={projectId} clientId={clientId} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {milestones.length > 1 && (
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={5} className="py-2.5 pl-4 text-xs text-muted-foreground">Total facturado</td>
                      <td className="py-2.5 text-right font-mono font-semibold">{fmt(milestonesRevenue, cur)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RECURRENTES ─────────────────────────────────────────────────────── */}
      {view === "recurrentes" && (
        <div className="flex flex-col gap-4">
          {/* Suscripciones */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
              <p className="text-sm font-medium text-foreground">
                Suscripciones
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({subscriptions.length})</span>
              </p>
              <CostAddSubscription projectId={projectId} clientId={clientId} serviceOptions={serviceOptions} />
            </div>
            {subscriptions.length === 0 ? (
              <div className="px-4 py-5">
                <p className="text-sm text-muted-foreground">Sin suscripciones. Añade suscripciones recurrentes gestionadas por Stripe u otro proveedor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pt-3 pl-4 text-left font-medium">Servicio</th>
                      <th className="pb-2 pt-3 text-left font-medium">Estado</th>
                      <th className="pb-2 pt-3 text-left font-medium">Ciclo</th>
                      <th className="pb-2 pt-3 text-left font-medium">Próxima renovación</th>
                      <th className="pb-2 pt-3 text-right font-medium">Importe</th>
                      <th className="pb-2 pt-3 pr-4 text-right font-medium">Equiv. anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => {
                      const annual = toAnnual(s.amount, s.billing_interval)
                      const svcName = s.services?.name ?? "—"
                      const statusStyle: Record<string, string> = {
                        active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                        trialing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                        past_due: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                        paused: "bg-muted text-muted-foreground",
                      }
                      const statusLabel: Record<string, string> = {
                        active: "Activa", trialing: "Prueba", past_due: "Vencida", paused: "Pausada",
                      }
                      return (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="py-2.5 pl-4 font-medium text-foreground">{svcName}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[s.status] ?? "bg-muted text-muted-foreground"}`}>
                              {statusLabel[s.status] ?? s.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{BILLING_LABEL[s.billing_interval] ?? s.billing_interval}</td>
                          <td className="py-2.5 text-muted-foreground">{fmtDate(s.current_period_end)}</td>
                          <td className="py-2.5 text-right font-mono">{fmt(s.amount, cur)}</td>
                          <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{fmt(annual, cur)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {subscriptions.length > 1 && (
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={5} className="py-2.5 pl-4 text-xs text-muted-foreground">Total anual estimado</td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold">{fmt(subscriptionsAnnual, cur)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Servicios contratados */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
              <p className="text-sm font-medium text-foreground">
                Servicios contratados
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({services.length})</span>
              </p>
              <CostAddService clientId={clientId} projectId={projectId} serviceOptions={serviceOptions} />
            </div>
            {services.length === 0 ? (
              <div className="px-4 py-5">
                <p className="text-sm text-muted-foreground">Sin servicios contratados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pt-3 pl-4 text-left font-medium">Servicio</th>
                      <th className="pb-2 pt-3 text-left font-medium">Ciclo</th>
                      <th className="pb-2 pt-3 text-right font-medium">Precio</th>
                      <th className="pb-2 pt-3 text-right font-medium">Equiv. anual</th>
                      <th className="pb-2 pt-3 pr-4 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => {
                      const price = s.unit_price * s.quantity
                      const annual = toAnnual(price, s.billing_interval)
                      const serviceName = (s.services as { name?: string } | null)?.name ?? s.name_override ?? "—"
                      return (
                        <tr key={s.id} className="border-b last:border-0 group">
                          <td className="py-2.5 pl-4 font-medium text-foreground">{serviceName}</td>
                          <td className="py-2.5 text-muted-foreground capitalize">
                            {BILLING_LABEL[s.billing_interval ?? ""] ?? s.billing_interval ?? "—"}
                          </td>
                          <td className="py-2.5 text-right font-mono">{fmt(price, s.currency_code)}</td>
                          <td className="py-2.5 text-right font-mono text-muted-foreground">{fmt(annual, s.currency_code)}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <ClientServiceActions
                              id={s.id}
                              clientId={clientId}
                              projectId={projectId}
                              label={serviceName}
                              serviceOptions={serviceOptions}
                              service={{
                                service_id: s.service_id,
                                name_override: s.name_override,
                                unit_price: s.unit_price,
                                quantity: s.quantity,
                                currency_code: s.currency_code,
                                billing_interval: s.billing_interval,
                                starts_on: s.starts_on ?? null,
                                ends_on: s.ends_on ?? null,
                                notes: s.notes ?? null,
                              }}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {services.length > 1 && (
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={3} className="py-2.5 pl-4 text-xs text-muted-foreground">Total anual estimado</td>
                        <td className="py-2.5 text-right font-mono font-semibold">{fmt(servicesAnnual, cur)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Renovaciones facturadas al cliente */}
          {(domains.some(d => d.renewal_price != null) || hosting.some(h => h.renewal_price != null)) && (
            <div className="rounded-xl border bg-card">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-foreground">
                  Renovaciones facturadas al cliente
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({domains.filter(d => d.renewal_price != null).length + hosting.filter(h => h.renewal_price != null).length})
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="pb-2 pt-3 pl-4 text-left font-medium">Recurso</th>
                      <th className="pb-2 pt-3 text-left font-medium">Tipo</th>
                      <th className="pb-2 pt-3 text-left font-medium">Ciclo</th>
                      <th className="pb-2 pt-3 text-left font-medium">Vence</th>
                      <th className="pb-2 pt-3 pr-4 text-right font-medium">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.filter(d => d.renewal_price != null).map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-2.5 pl-4 font-medium text-foreground">{d.domain_name}</td>
                        <td className="py-2.5 text-muted-foreground">Dominio</td>
                        <td className="py-2.5 text-muted-foreground">Anual</td>
                        <td className="py-2.5 text-muted-foreground">{fmtDate(d.expires_on)}</td>
                        <td className="py-2.5 pr-4 text-right font-mono">{fmt(d.renewal_price, d.currency_code ?? cur)}</td>
                      </tr>
                    ))}
                    {hosting.filter(h => h.renewal_price != null).map((h) => (
                      <tr key={h.id} className="border-b last:border-0">
                        <td className="py-2.5 pl-4 font-medium text-foreground">{h.provider_name}{h.plan_name ? ` — ${h.plan_name}` : ""}</td>
                        <td className="py-2.5 text-muted-foreground">Hosting</td>
                        <td className="py-2.5 text-muted-foreground">{BILLING_LABEL[h.billing_interval ?? ""] ?? "—"}</td>
                        <td className="py-2.5 text-muted-foreground">{fmtDate(h.expires_on)}</td>
                        <td className="py-2.5 pr-4 text-right font-mono">{fmt(h.renewal_price, h.currency_code ?? cur)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {(domainsRenewalAnnual + hostingRenewalAnnual) > 0 && (
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={4} className="py-2.5 pl-4 text-xs text-muted-foreground">Total anual estimado</td>
                        <td className="py-2.5 pr-4 text-right font-mono font-semibold">{fmt(domainsRenewalAnnual + hostingRenewalAnnual, cur)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {subscriptions.length === 0 && services.length === 0 && !domains.some(d => d.renewal_price) && !hosting.some(h => h.renewal_price) && (
            <div className="rounded-xl border bg-card px-4 py-8">
              <EmptyState
                title="Sin servicios recurrentes"
                description="Añade suscripciones, servicios contratados o configura precios de renovación en los dominios y hosting del proyecto."
              />
            </div>
          )}
        </div>
      )}

      {/* ── COSTES Y RENTABILIDAD ───────────────────────────────────────────── */}
      {view === "costes" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <SectionSeparator label="Gastos del proyecto" />

            {/* Gastos generales */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
                <p className="text-sm font-medium text-foreground">
                  Gastos generales
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">({generalExpenses.length})</span>
                </p>
                <CostAddExpense projectId={projectId} />
              </div>
              {generalExpenses.length === 0 ? (
                <div className="px-4 py-5">
                  <p className="text-sm text-muted-foreground">
                    Sin gastos generales. Úsalos para licencias, plugins, diseño y otros costes no ligados a un hito concreto.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="pb-2 pt-3 pl-4 text-left font-medium">Descripción</th>
                        <th className="pb-2 pt-3 text-left font-medium">Categoría</th>
                        <th className="pb-2 pt-3 text-left font-medium">Fecha</th>
                        <th className="pb-2 pt-3 text-right font-medium">Importe</th>
                        <th className="pb-2 pt-3 pr-4 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {generalExpenses.map((e) => (
                        <tr key={e.id} className="border-b last:border-0 group">
                          <td className="py-2.5 pl-4 font-medium text-foreground">
                            {e.description}
                            {e.notes && (
                              <span className="ml-1.5 text-xs text-muted-foreground font-normal">— {e.notes}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-muted-foreground">{CATEGORY_LABEL[e.category] ?? e.category}</td>
                          <td className="py-2.5 text-muted-foreground">{fmtDate(e.incurred_at)}</td>
                          <td className="py-2.5 text-right font-mono">{fmt(e.amount, e.currency_code)}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <CostExpenseActions expenseId={e.id} projectId={projectId} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {generalExpenses.length > 1 && (
                      <tfoot>
                        <tr className="border-t bg-muted/30">
                          <td colSpan={3} className="py-2.5 pl-4 text-xs text-muted-foreground">Total gastos generales</td>
                          <td className="py-2.5 text-right font-mono font-semibold">{fmt(generalExpensesTotal, cur)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* Costes de proveedores */}
            {hasInternalCosts && (
              <details className="group rounded-xl border bg-card overflow-hidden">
                <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors [&::-webkit-details-marker]:hidden">
                  <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  Costes de proveedores
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {fmt(domainsInternalAnnual + hostingInternalAnnual, cur)}/año
                  </span>
                </summary>
                <div className="border-t px-4 py-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="pb-2 text-left font-medium">Recurso</th>
                          <th className="pb-2 text-left font-medium">Tipo</th>
                          <th className="pb-2 text-left font-medium">Ciclo</th>
                          <th className="pb-2 text-left font-medium">Vence</th>
                          <th className="pb-2 text-right font-medium">Coste</th>
                          <th className="pb-2 text-right font-medium">Equiv. anual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.filter(d => d.internal_cost != null).map((d) => (
                          <tr key={d.id} className="border-b last:border-0">
                            <td className="py-2.5 font-medium text-foreground">{d.domain_name}</td>
                            <td className="py-2.5 text-muted-foreground">Dominio</td>
                            <td className="py-2.5 text-muted-foreground">Anual</td>
                            <td className="py-2.5 text-muted-foreground">{fmtDate(d.expires_on)}</td>
                            <td className="py-2.5 text-right font-mono">{fmt(d.internal_cost, d.currency_code ?? cur)}</td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">{fmt(d.internal_cost, d.currency_code ?? cur)}</td>
                          </tr>
                        ))}
                        {hosting.filter(h => h.internal_cost != null).map((h) => (
                          <tr key={h.id} className="border-b last:border-0">
                            <td className="py-2.5 font-medium text-foreground">{h.provider_name}{h.plan_name ? ` — ${h.plan_name}` : ""}</td>
                            <td className="py-2.5 text-muted-foreground">Hosting</td>
                            <td className="py-2.5 text-muted-foreground">{BILLING_LABEL[h.billing_interval ?? ""] ?? "—"}</td>
                            <td className="py-2.5 text-muted-foreground">{fmtDate(h.expires_on)}</td>
                            <td className="py-2.5 text-right font-mono">{fmt(h.internal_cost, h.currency_code ?? cur)}</td>
                            <td className="py-2.5 text-right font-mono text-muted-foreground">
                              {fmt(toAnnual(h.internal_cost ?? 0, h.billing_interval), h.currency_code ?? cur)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/30">
                          <td colSpan={5} className="py-2.5 pl-0 text-xs text-muted-foreground">Total anual estimado</td>
                          <td className="py-2.5 text-right font-mono font-semibold">{fmt(domainsInternalAnnual + hostingInternalAnnual, cur)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </details>
            )}
          </div>

          {/* Rentabilidad */}
          {(milestones.length > 0 || totalAnnualRevenue > 0) && (
            <div className="flex flex-col gap-3">
              <SectionSeparator label="Rentabilidad" />
              <div className="rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-2 text-sm">
                  {milestonesRevenue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Facturado (hitos)</span>
                      <span className="font-mono text-green-600 dark:text-green-400">+{fmt(milestonesRevenue, cur)}</span>
                    </div>
                  )}
                  {milestonesInternalCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Coste interno de hitos</span>
                      <span className="font-mono text-red-600 dark:text-red-400">−{fmt(milestonesInternalCost, cur)}</span>
                    </div>
                  )}
                  {expensesTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gastos del proyecto</span>
                      <span className="font-mono text-red-600 dark:text-red-400">−{fmt(expensesTotal, cur)}</span>
                    </div>
                  )}
                  {devMargin != null && (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Margen de desarrollo</span>
                      <span className={`font-mono font-semibold ${devMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(devMargin, cur)}
                      </span>
                    </div>
                  )}
                  {totalAnnualRevenue > 0 && (
                    <>
                      <div className="flex items-center justify-between border-t pt-2 mt-1">
                        <span className="text-muted-foreground">Ingresos recurrentes / año</span>
                        <span className="font-mono text-green-600 dark:text-green-400">+{fmt(totalAnnualRevenue, cur)}</span>
                      </div>
                      {(domainsInternalAnnual + hostingInternalAnnual) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Costes recurrentes / año</span>
                          <span className="font-mono text-red-600 dark:text-red-400">−{fmt(domainsInternalAnnual + hostingInternalAnnual, cur)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="font-medium">Margen recurrente / año</span>
                        <span className={`font-mono font-semibold ${recurringMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {fmt(recurringMargin, cur)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
