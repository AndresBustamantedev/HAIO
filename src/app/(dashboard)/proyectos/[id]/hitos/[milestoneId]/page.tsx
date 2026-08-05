import { notFound } from "next/navigation"
import Link from "next/link"
import { ExternalLinkIcon, FileTextIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { getProjectDetail } from "@/features/projects/queries/get-project-detail"
import { getMilestoneDetail } from "@/features/billing-milestones/queries/get-milestone-detail"
import { WorkStatusSelect, BillingStatusSelect } from "@/features/billing-milestones/components/milestone-status-select"
import { MilestoneDeliverables } from "@/features/billing-milestones/components/milestone-deliverables"
import { MilestoneDetailActions } from "@/features/billing-milestones/components/milestone-detail-actions"
import { CostAddExpense } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-add-expense"
import { CostExpenseActions } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-expense-actions"
import { Button } from "@/components/ui/button"
import { generateInvoiceFromMilestone } from "@/features/billing-milestones/actions/generate-invoice-from-milestone"

type Props = {
  params: Promise<{ id: string; milestoneId: string }>
}

const TYPE_LABEL: Record<string, string> = {
  development: "Desarrollo",
  maintenance: "Mantenimiento",
  extra:       "Extra",
  renewal:     "Renovación",
  other:       "Otro",
}

const TYPE_STYLE: Record<string, string> = {
  development: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  maintenance: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  extra:       "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  renewal:     "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  other:       "bg-muted text-muted-foreground",
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Hosting", domain: "Dominio", license: "Licencia",
  tool: "Herramienta", design: "Diseño", development: "Desarrollo", other: "Otro",
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", issued: "Emitida", sent: "Enviada", viewed: "Vista",
  partially_paid: "Parcialmente cobrada", paid: "Cobrada", overdue: "Vencida",
  void: "Anulada", refunded: "Reembolsada",
}

function fmt(v: number | null, cur: string) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(v)
}

function fmtDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function StatCard({ label, value, highlight, subtitle }: {
  label: string; value: string; highlight?: "positive" | "negative"; subtitle?: string
}) {
  const color =
    highlight === "positive" ? "text-green-600 dark:text-green-400" :
    highlight === "negative" ? "text-red-600 dark:text-red-400" : "text-foreground"
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-semibold font-mono ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card">
      <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
        {title}
      </p>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

export default async function MilestoneDetailPage({ params }: Props) {
  const { id: projectId, milestoneId } = await params

  const [detail, milestone] = await Promise.all([
    getProjectDetail(projectId),
    getMilestoneDetail(milestoneId, projectId),
  ])

  if (!detail || !milestone) notFound()

  const { project } = detail
  const cur = milestone.currency_code
  const margin = milestone.internal_cost != null ? milestone.amount - milestone.internal_cost : null
  const expensesTotal = milestone.expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Proyectos", href: "/proyectos" },
          { label: project.name, href: `/proyectos/${projectId}` },
          { label: "Finanzas", href: `/proyectos/${projectId}?tab=finanzas&view=hitos` },
          { label: milestone.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[milestone.type] ?? ""}`}>
              {TYPE_LABEL[milestone.type] ?? milestone.type}
            </span>
            {milestone.planned_date && (
              <span className="text-sm text-muted-foreground">{fmtDate(milestone.planned_date)}</span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-foreground truncate">{milestone.name}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <WorkStatusSelect milestoneId={milestone.id} projectId={projectId} value={milestone.work_status} />
            <BillingStatusSelect milestoneId={milestone.id} projectId={projectId} value={milestone.billing_status} />
          </div>
        </div>
        <div className="shrink-0">
          <MilestoneDetailActions milestone={milestone} projectId={projectId} />
        </div>
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Importe" value={fmt(milestone.amount, cur)} />
        <StatCard
          label="Coste interno"
          value={milestone.internal_cost != null ? fmt(milestone.internal_cost, cur) : "—"}
          subtitle={milestone.internal_cost != null ? undefined : "no registrado"}
        />
        <StatCard
          label="Margen"
          value={margin != null ? fmt(margin, cur) : "—"}
          highlight={margin != null ? (margin >= 0 ? "positive" : "negative") : undefined}
        />
        <StatCard
          label="Gastos vinculados"
          value={expensesTotal > 0 ? fmt(expensesTotal, cur) : "—"}
          subtitle={milestone.expenses.length > 0 ? `${milestone.expenses.length} gastos` : "sin gastos"}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left: main content */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Descriptions */}
          {(milestone.description || milestone.client_description) && (
            <div className="rounded-xl border bg-card divide-y">
              {milestone.description && (
                <div className="px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descripción interna</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{milestone.description}</p>
                </div>
              )}
              {milestone.client_description && (
                <div className="px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descripción para el cliente</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{milestone.client_description}</p>
                </div>
              )}
            </div>
          )}

          {/* Deliverables */}
          <MilestoneDeliverables
            milestoneId={milestone.id}
            projectId={projectId}
            deliverables={milestone.deliverables}
          />

          {/* Expenses */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
              <p className="text-sm font-medium text-foreground">
                Gastos vinculados
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">({milestone.expenses.length})</span>
              </p>
              <CostAddExpense projectId={projectId} milestoneId={milestone.id} />
            </div>
            {milestone.expenses.length === 0 ? (
              <div className="px-4 py-5 text-sm text-muted-foreground">
                Sin gastos. Añade los costes directos de este hito (subcontratas, licencias, etc.).
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
                    {milestone.expenses.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 group">
                        <td className="py-2.5 pl-4 font-medium text-foreground">
                          {e.description}
                          {e.notes && <span className="ml-1.5 text-xs text-muted-foreground font-normal">— {e.notes}</span>}
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
                  {milestone.expenses.length > 1 && (
                    <tfoot>
                      <tr className="border-t bg-muted/30">
                        <td colSpan={3} className="py-2.5 pl-4 text-xs text-muted-foreground">Total</td>
                        <td className="py-2.5 text-right font-mono font-semibold">{fmt(expensesTotal, cur)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="flex flex-col gap-4">

          {/* Invoice */}
          <SideCard title="Factura">
            {milestone.invoice_id ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{milestone.invoice_number}</span>
                  {milestone.invoice_status && (
                    <span className="text-xs text-muted-foreground">
                      {INVOICE_STATUS_LABEL[milestone.invoice_status] ?? milestone.invoice_status}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" render={<Link href={`/facturas/${milestone.invoice_id}`} />}>
                  <ExternalLinkIcon className="size-3.5" />
                  Ver factura
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Sin factura vinculada.</p>
                <form action={async () => {
                  "use server"
                  await generateInvoiceFromMilestone(milestone.id, projectId, project.client_id ?? "")
                }}>
                  <Button type="submit" variant="outline" size="sm" className="w-full">
                    <FileTextIcon className="size-3.5" />
                    Generar borrador
                  </Button>
                </form>
              </div>
            )}
          </SideCard>

          {/* Client notes */}
          {milestone.notes && (
            <SideCard title="Notas para el cliente">
              <p className="text-sm text-foreground whitespace-pre-wrap">{milestone.notes}</p>
            </SideCard>
          )}

          {/* Internal notes */}
          {milestone.internal_notes && (
            <SideCard title="Notas internas">
              <p className="text-sm text-foreground whitespace-pre-wrap">{milestone.internal_notes}</p>
            </SideCard>
          )}

          {/* Billing info */}
          {(milestone.planned_invoice_date || milestone.billed_at || milestone.billing_interval) && (
            <SideCard title="Facturación">
              <div className="flex flex-col gap-1.5 text-sm">
                {milestone.planned_invoice_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha prevista</span>
                    <span>{fmtDate(milestone.planned_invoice_date)}</span>
                  </div>
                )}
                {milestone.billed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facturado el</span>
                    <span>{fmtDate(milestone.billed_at)}</span>
                  </div>
                )}
              </div>
            </SideCard>
          )}

          {/* Metadata */}
          <SideCard title="Información">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{fmtDate(milestone.created_at)}</span>
              </div>
              {milestone.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span>{fmtDate(milestone.updated_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proyecto</span>
                <Link
                  href={`/proyectos/${projectId}`}
                  className="text-foreground hover:underline"
                >
                  {project.name}
                </Link>
              </div>
            </div>
          </SideCard>

        </div>
      </div>
    </PageContainer>
  )
}
