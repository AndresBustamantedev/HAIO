"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLinkIcon, FileTextIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { FormDrawer } from "@/components/common/form-drawer"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { MilestoneForm } from "@/features/billing-milestones/components/milestone-form"
import { updateMilestone } from "@/features/billing-milestones/actions/update-milestone"
import { deleteMilestone } from "@/features/billing-milestones/actions/delete-milestone"
import { generateInvoiceFromMilestone } from "@/features/billing-milestones/actions/generate-invoice-from-milestone"
import { CostAddExpense } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-add-expense"
import { CostExpenseActions } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-expense-actions"
import type { MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"
import type { ProjectMilestone } from "@/features/billing-milestones/queries/get-project-milestones"

type Expense = {
  id: string
  description: string
  amount: number
  currency_code: string
  category: string
  incurred_at: string
  notes: string | null
}

type Props = {
  milestone: ProjectMilestone
  expenses: Expense[]
  projectId: string
  clientId: string
  currencyCode: string
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

const TYPE_LABEL: Record<string, string> = {
  development: "Desarrollo",
  maintenance: "Mantenimiento",
  extra:       "Extra",
  renewal:     "Renovación",
  other:       "Otro",
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", issued: "Emitida", sent: "Enviada", viewed: "Vista",
  partially_paid: "Parcialmente cobrada", paid: "Cobrada", overdue: "Vencida",
  void: "Anulada", refunded: "Reembolsada",
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Hosting", domain: "Dominio", license: "Licencia",
  tool: "Herramienta", design: "Diseño", development: "Desarrollo", other: "Otro",
}

function fmt(v: number | null, cur: string) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(v)
}

function fmtDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function MilestoneDetailDrawer({ milestone, expenses, projectId, clientId, currencyCode }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)

  const margin = milestone.internal_cost != null ? milestone.amount - milestone.internal_cost : null
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0)

  const defaultValues: Partial<MilestoneInput> = {
    name: milestone.name,
    type: milestone.type,
    work_status: milestone.work_status,
    billing_status: milestone.billing_status,
    amount: String(milestone.amount),
    currency_code: milestone.currency_code,
    internal_cost: milestone.internal_cost != null ? String(milestone.internal_cost) : "",
    billing_interval: (milestone.billing_interval as MilestoneInput["billing_interval"]) ?? "",
    planned_date: milestone.planned_date ?? "",
    billed_at: milestone.billed_at ?? "",
    notes: milestone.notes ?? "",
    internal_notes: milestone.internal_notes ?? "",
  }

  async function handleGenerateInvoice() {
    setGenerating(true)
    const result = await generateInvoiceFromMilestone(milestone.id, projectId, clientId)
    setGenerating(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Factura ${result.invoiceNumber} creada como borrador.`)
    router.refresh()
  }

  return (
    <>
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="block max-w-[220px] truncate text-left font-medium text-foreground hover:underline hover:decoration-dotted"
            />
          }
        >
          {milestone.name}
        </SheetTrigger>

        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {/* Header */}
          <SheetHeader className="border-b px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base leading-snug">{milestone.name}</SheetTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {TYPE_LABEL[milestone.type] ?? milestone.type}
                  {milestone.planned_date ? ` · ${fmtDate(milestone.planned_date)}` : ""}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${WORK_STATUS_STYLE[milestone.work_status] ?? ""}`}>
                  {WORK_STATUS_LABEL[milestone.work_status] ?? milestone.work_status}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[milestone.billing_status] ?? ""}`}>
                  {BILLING_STATUS_LABEL[milestone.billing_status] ?? milestone.billing_status}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-6 py-5">

            {/* Financiero */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financiero</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Importe</p>
                  <p className="font-mono font-semibold text-sm">{fmt(milestone.amount, milestone.currency_code)}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Coste interno</p>
                  <p className="font-mono text-sm">{milestone.internal_cost != null ? fmt(milestone.internal_cost, milestone.currency_code) : "—"}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Margen</p>
                  <p className={`font-mono font-semibold text-sm ${margin != null && margin >= 0 ? "text-green-600 dark:text-green-400" : margin != null ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {margin != null ? fmt(margin, milestone.currency_code) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Factura */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Factura</p>
              {milestone.invoice_id ? (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium">{milestone.invoice_number}</span>
                  {milestone.invoice_status && (
                    <span className="text-xs text-muted-foreground">{INVOICE_STATUS_LABEL[milestone.invoice_status] ?? milestone.invoice_status}</span>
                  )}
                  <Button variant="outline" size="sm" className="ml-auto" render={<Link href={`/facturas/${milestone.invoice_id}`} />}>
                    <ExternalLinkIcon className="size-3.5" />
                    Ver factura
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateInvoice}
                  disabled={generating}
                >
                  <FileTextIcon className="size-3.5" />
                  {generating ? "Generando..." : "Generar factura borrador"}
                </Button>
              )}
            </div>

            {/* Gastos del hito */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gastos de este hito
              </p>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin gastos registrados para este hito.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden mb-3">
                  <table className="w-full text-sm">
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-b last:border-0 group">
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-foreground">{e.description}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm whitespace-nowrap">
                            {fmt(e.amount, e.currency_code)}
                          </td>
                          <td className="px-2 py-2.5 text-right w-8">
                            <CostExpenseActions expenseId={e.id} projectId={projectId} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {expenses.length > 1 && (
                      <tfoot>
                        <tr className="bg-muted/40">
                          <td className="px-3 py-2 text-xs text-muted-foreground">Total</td>
                          <td className="px-3 py-2 text-right font-mono text-sm font-semibold">
                            {fmt(expensesTotal, currencyCode)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
              <CostAddExpense projectId={projectId} milestoneId={milestone.id} />
            </div>

            {/* Notas */}
            {milestone.notes && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{milestone.notes}</p>
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="mt-auto border-t px-6 py-4 flex items-center gap-2">
            <SheetClose
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimeout(() => setEditOpen(true), 150)}
                />
              }
            >
              <PencilIcon className="size-3.5" />
              Editar hito
            </SheetClose>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive hover:text-destructive"
                  onClick={() => setTimeout(() => setDeleteOpen(true), 150)}
                />
              }
            >
              <Trash2Icon className="size-3.5" />
              Eliminar
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      <FormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar hito de facturación"
        description={milestone.name}
      >
        <MilestoneForm
          defaultValues={defaultValues}
          onSubmit={(values) => updateMilestone(milestone.id, projectId, values)}
          onSuccess={() => {
            toast.success("Hito actualizado.")
            setEditOpen(false)
            router.refresh()
          }}
          submitLabel="Guardar cambios"
        />
      </FormDrawer>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={milestone.name}
        onConfirm={async () => {
          const result = await deleteMilestone(milestone.id, projectId)
          if (result.error) { toast.error(result.error); return }
          toast.success("Hito eliminado.")
          setDeleteOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

export { MilestoneDetailDrawer }
