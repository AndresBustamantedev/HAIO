"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ExternalLinkIcon, FileTextIcon, PencilIcon, Trash2Icon, MoreHorizontalIcon,
  PlusIcon, CheckIcon, XIcon, Circle, CircleDot, CircleCheck, ActivityIcon,
  RefreshCwIcon, PlusCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FormDrawer } from "@/components/common/form-drawer"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { MilestoneForm } from "@/features/billing-milestones/components/milestone-form"
import { WorkStatusSelect, BillingStatusSelect } from "@/features/billing-milestones/components/milestone-status-select"
import { CostAddExpense } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-add-expense"
import { CostExpenseActions } from "@/app/(dashboard)/proyectos/[id]/_tabs/cost-expense-actions"
import { getMilestoneDetailAction } from "@/features/billing-milestones/actions/get-milestone-detail-action"
import { updateMilestone } from "@/features/billing-milestones/actions/update-milestone"
import { deleteMilestone } from "@/features/billing-milestones/actions/delete-milestone"
import { generateInvoiceFromMilestone } from "@/features/billing-milestones/actions/generate-invoice-from-milestone"
import { updateMilestoneNotes } from "@/features/billing-milestones/actions/update-milestone-notes"
import { createDeliverable } from "@/features/billing-milestones/actions/create-deliverable"
import { updateDeliverable } from "@/features/billing-milestones/actions/update-deliverable"
import { updateDeliverableStatus } from "@/features/billing-milestones/actions/update-deliverable-status"
import { deleteDeliverable } from "@/features/billing-milestones/actions/delete-deliverable"
import type { MilestoneDetail, MilestoneDeliverable } from "@/features/billing-milestones/queries/get-milestone-detail"
import type { MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"
import type { ProjectMilestone } from "@/features/billing-milestones/queries/get-project-milestones"

// ─── Constants ──────────────────────────────────────────────────────────────

const WORK_STATUS_STYLE: Record<string, string> = {
  draft:       "bg-muted text-muted-foreground",
  planned:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  in_review:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const WORK_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", planned: "Planificado", in_progress: "En progreso",
  in_review: "En revisión", completed: "Completado", cancelled: "Cancelado",
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
  unbilled: "Sin facturar", invoice_draft: "Borrador", invoiced: "Facturado",
  partially_paid: "Parcial", paid: "Cobrado", credited: "Abonado", cancelled: "Cancelado",
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", issued: "Emitida", sent: "Enviada", viewed: "Vista",
  partially_paid: "Pag. parcial", paid: "Cobrada", overdue: "Vencida",
  void: "Anulada", refunded: "Reembolsada",
}

const TYPE_LABEL: Record<string, string> = {
  development: "Desarrollo", maintenance: "Mantenimiento",
  extra: "Extra", renewal: "Renovación", other: "Otro",
}

const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual", project_created: "Al crear proyecto",
  scheduled_date: "Fecha programada", milestone_completed: "Al completar",
  client_approved: "Aprobación cliente",
}

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Transferencia", card: "Tarjeta", cash: "Efectivo",
  stripe: "Stripe", paypal: "PayPal", other: "Otro",
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Hosting", domain: "Dominio", license: "Licencia",
  tool: "Herramienta", design: "Diseño", development: "Desarrollo", other: "Otro",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, cur: string) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(v)
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function fmtDateTime(v: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(v))
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function InfoRow({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 min-h-[32px]">
      <span className="text-sm text-muted-foreground shrink-0 w-40">{label}</span>
      <span className={`text-sm text-right flex-1 min-w-0 ${mono ? "font-mono" : ""}`}>{children}</span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5 px-6 py-5 animate-pulse">
      {[40, 60, 50, 70, 45].map((w, i) => (
        <div key={i} className="h-4 rounded bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen({ detail, projectId, onRefresh }: { detail: MilestoneDetail; projectId: string; onRefresh: () => void }) {
  const cur = detail.currency_code
  const taxAmt = detail.tax_rate != null ? detail.amount * detail.tax_rate / 100 : null
  const total = taxAmt != null ? detail.amount + taxAmt : detail.amount
  const margin = detail.internal_cost != null ? detail.amount - detail.internal_cost : null

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      <div>
        <SectionTitle>Información general</SectionTitle>
        <div className="divide-y divide-border/50">
          <InfoRow label="Tipo">{TYPE_LABEL[detail.type] ?? detail.type}</InfoRow>
          {detail.description && (
            <InfoRow label="Descripción">
              <span className="whitespace-pre-wrap text-left">{detail.description}</span>
            </InfoRow>
          )}
          <InfoRow label="Fecha prevista">{fmtDate(detail.planned_date)}</InfoRow>
          {detail.completed_at && (
            <InfoRow label="Completado el">{fmtDate(detail.completed_at)}</InfoRow>
          )}
          {detail.billing_trigger && (
            <InfoRow label="Trigger de facturación">
              {TRIGGER_LABEL[detail.billing_trigger] ?? detail.billing_trigger}
            </InfoRow>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Estado</SectionTitle>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between gap-4 py-1.5 min-h-[32px]">
            <span className="text-sm text-muted-foreground shrink-0 w-40">Estado del trabajo</span>
            <WorkStatusSelect milestoneId={detail.id} projectId={projectId} value={detail.work_status} />
          </div>
          <div className="flex items-center justify-between gap-4 py-1.5 min-h-[32px]">
            <span className="text-sm text-muted-foreground shrink-0 w-40">Estado de facturación</span>
            <BillingStatusSelect milestoneId={detail.id} projectId={projectId} value={detail.billing_status} />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Importes</SectionTitle>
        <div className="divide-y divide-border/50">
          <InfoRow label="Importe base" mono>{fmt(detail.amount, cur)}</InfoRow>
          {detail.tax_rate != null && (
            <InfoRow label={`Impuestos (${detail.tax_rate}%)`} mono>{fmt(taxAmt, cur)}</InfoRow>
          )}
          <InfoRow label="Total" mono>
            <span className="font-semibold">{fmt(total, cur)}</span>
          </InfoRow>
        </div>
      </div>

      {detail.invoice_id && (
        <div>
          <SectionTitle>Facturación</SectionTitle>
          <div className="divide-y divide-border/50">
            <InfoRow label="Factura">
              <Link
                href={`/facturas/${detail.invoice_id}`}
                className="font-mono text-foreground hover:underline hover:decoration-dotted flex items-center gap-1 justify-end"
              >
                {detail.invoice_number}
                <ExternalLinkIcon className="size-3 shrink-0 text-muted-foreground" />
              </Link>
            </InfoRow>
            {detail.invoice_status && (
              <InfoRow label="Estado factura">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[detail.invoice_status] ?? ""}`}>
                  {INVOICE_STATUS_LABEL[detail.invoice_status] ?? detail.invoice_status}
                </span>
              </InfoRow>
            )}
            {detail.billed_at && <InfoRow label="Fecha de cobro">{fmtDate(detail.billed_at)}</InfoRow>}
          </div>
        </div>
      )}

      {(detail.internal_cost != null || detail.estimated_cost != null) && (
        <div>
          <SectionTitle>Costes y margen</SectionTitle>
          <div className="divide-y divide-border/50">
            {detail.internal_cost != null && (
              <InfoRow label="Coste interno" mono>{fmt(detail.internal_cost, cur)}</InfoRow>
            )}
            {detail.estimated_cost != null && (
              <InfoRow label="Coste estimado" mono>{fmt(detail.estimated_cost, cur)}</InfoRow>
            )}
            {detail.actual_cost != null && (
              <InfoRow label="Coste real" mono>{fmt(detail.actual_cost, cur)}</InfoRow>
            )}
            {margin != null && (
              <InfoRow label="Margen estimado" mono>
                <span className={margin >= 0 ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400 font-semibold"}>
                  {fmt(margin, cur)}
                </span>
              </InfoRow>
            )}
          </div>
        </div>
      )}

      {(detail.estimated_hours != null || detail.actual_hours != null) && (
        <div>
          <SectionTitle>Horas</SectionTitle>
          <div className="divide-y divide-border/50">
            {detail.estimated_hours != null && <InfoRow label="Horas estimadas">{detail.estimated_hours} h</InfoRow>}
            {detail.actual_hours != null && <InfoRow label="Horas reales">{detail.actual_hours} h</InfoRow>}
          </div>
        </div>
      )}

      {detail.notes && (
        <div>
          <SectionTitle>Notas</SectionTitle>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Entregables ─────────────────────────────────────────────────────────

type DelStatus = "pending" | "in_progress" | "done"

function nextStatus(s: DelStatus): DelStatus {
  if (s === "pending") return "in_progress"
  if (s === "in_progress") return "done"
  return "pending"
}

const DEL_STATUS_STYLE: Record<string, string> = {
  done:        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  pending:     "bg-muted text-muted-foreground",
}
const DEL_STATUS_LABEL: Record<string, string> = {
  done: "Completado", in_progress: "En progreso", pending: "Pendiente",
}

function StatusIcon({ status, onClick, disabled }: { status: DelStatus; onClick: () => void; disabled?: boolean }) {
  const base = "shrink-0 transition-opacity cursor-pointer"
  if (status === "done") {
    return (
      <button type="button" onClick={onClick} disabled={disabled}
        className={`${base} text-green-600 dark:text-green-400 ${disabled ? "opacity-50" : "hover:opacity-70"}`}>
        <CircleCheck className="size-4.5" />
      </button>
    )
  }
  if (status === "in_progress") {
    return (
      <button type="button" onClick={onClick} disabled={disabled}
        className={`${base} text-violet-600 dark:text-violet-400 ${disabled ? "opacity-50" : "hover:opacity-70"}`}>
        <CircleDot className="size-4.5" />
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`${base} text-muted-foreground/40 ${disabled ? "opacity-50" : "hover:text-muted-foreground"}`}>
      <Circle className="size-4.5" />
    </button>
  )
}

function TabEntregables({
  detail, projectId, onRefresh,
}: { detail: MilestoneDetail; projectId: string; onRefresh: () => Promise<void> }) {
  const milestoneId = detail.id
  const [items, setItems] = React.useState<MilestoneDeliverable[]>(detail.deliverables)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => { setItems(detail.deliverables) }, [detail.deliverables])

  const [adding, setAdding] = React.useState(false)
  const [addName, setAddName] = React.useState("")
  const [addDueDate, setAddDueDate] = React.useState("")
  const [addPending, setAddPending] = React.useState(false)

  const [editing, setEditing] = React.useState<MilestoneDeliverable | null>(null)
  const [editForm, setEditForm] = React.useState({ name: "", description: "", due_date: "", external_url: "" })
  const [editPending, setEditPending] = React.useState(false)

  const [editingNotes, setEditingNotes] = React.useState(false)
  const [notesValue, setNotesValue] = React.useState(detail.internal_notes ?? "")
  const [notesPending, setNotesPending] = React.useState(false)

  const done = items.filter(i => i.status === "done").length
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0

  async function handleStatusToggle(d: MilestoneDeliverable) {
    if (pendingIds.has(d.id)) return
    const next = nextStatus(d.status as DelStatus)
    setItems(prev => prev.map(i => i.id === d.id ? { ...i, status: next } : i))
    setPendingIds(prev => new Set(prev).add(d.id))
    const result = await updateDeliverableStatus(d.id, milestoneId, projectId, next, d.name)
    setPendingIds(prev => { const s = new Set(prev); s.delete(d.id); return s })
    if (result.error) {
      setItems(prev => prev.map(i => i.id === d.id ? { ...i, status: d.status } : i))
      toast.error(result.error)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim()) return
    setAddPending(true)
    const result = await createDeliverable(milestoneId, projectId, {
      name: addName.trim(),
      due_date: addDueDate || undefined,
    })
    setAddPending(false)
    if (result.error) { toast.error(result.error); return }
    setAddName(""); setAddDueDate(""); setAdding(false)
    await onRefresh()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setEditPending(true)
    const result = await updateDeliverable(editing.id, milestoneId, projectId, {
      name: editForm.name,
      description: editForm.description || undefined,
      due_date: editForm.due_date || undefined,
      external_url: editForm.external_url || undefined,
    })
    setEditPending(false)
    if (result.error) { toast.error(result.error); return }
    setEditing(null)
    await onRefresh()
  }

  async function handleDelete(d: MilestoneDeliverable) {
    setItems(prev => prev.filter(i => i.id !== d.id))
    const result = await deleteDeliverable(d.id, milestoneId, projectId, d.name)
    if (result.error) { toast.error(result.error); await onRefresh() }
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault()
    setNotesPending(true)
    const result = await updateMilestoneNotes(milestoneId, projectId, notesValue || null)
    setNotesPending(false)
    if (result.error) { toast.error(result.error); return }
    setEditingNotes(false)
    await onRefresh()
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "Sin entregables aún." : `${done} de ${items.length} completados`}
          </p>
          {!adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <PlusIcon className="size-3.5" />
              Añadir entregable
            </Button>
          )}
        </div>

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pl-4 w-8" />
                  <th className="pb-2 pt-3 text-left font-medium">Entregable</th>
                  <th className="pb-2 pt-3 text-left font-medium">Estado</th>
                  <th className="pb-2 pt-3 text-left font-medium">Fecha</th>
                  <th className="pb-2 pt-3 pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 group">
                    <td className="pl-4 py-3">
                      <StatusIcon
                        status={d.status as DelStatus}
                        onClick={() => handleStatusToggle(d)}
                        disabled={pendingIds.has(d.id)}
                      />
                    </td>
                    <td className="py-3 pr-2">
                      <p className={`font-medium leading-snug ${d.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {d.name}
                      </p>
                      {d.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DEL_STATUS_STYLE[d.status] ?? ""}`}>
                        {DEL_STATUS_LABEL[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {d.due_date
                        ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(d.due_date))
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button type="button"
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all" />
                          }
                        >
                          <MoreHorizontalIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(d)
                              setEditForm({ name: d.name, description: d.description ?? "", due_date: d.due_date ?? "", external_url: d.external_url ?? "" })
                            }}
                          >
                            <PencilIcon className="size-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {d.external_url && (
                            <DropdownMenuItem render={<Link href={d.external_url} target="_blank" rel="noopener noreferrer" />}>
                              <ExternalLinkIcon className="size-3.5 mr-2" />
                              Ver enlace
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(d)}>
                            <Trash2Icon className="size-3.5 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adding && (
          <form onSubmit={handleAdd} className="border-t px-4 py-3 flex items-center gap-2">
            <input
              autoFocus value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="Nombre del entregable..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={addPending}
            />
            <input
              type="date" value={addDueDate}
              onChange={e => setAddDueDate(e.target.value)}
              className="text-xs text-muted-foreground bg-transparent outline-none border rounded px-2 py-1"
              disabled={addPending}
            />
            <button type="submit" disabled={!addName.trim() || addPending}
              className="p-1 rounded text-foreground hover:bg-muted disabled:opacity-40">
              <CheckIcon className="size-4" />
            </button>
            <button type="button" onClick={() => { setAdding(false); setAddName(""); setAddDueDate("") }}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <XIcon className="size-4" />
            </button>
          </form>
        )}

        {items.length > 0 && (
          <div className="border-t px-6 py-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{pct}% completado</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
          </div>
        )}

        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas internas</p>
            {!editingNotes && (
              <button type="button"
                onClick={() => { setEditingNotes(true); setNotesValue(detail.internal_notes ?? "") }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Editar
              </button>
            )}
          </div>
          {editingNotes ? (
            <form onSubmit={handleSaveNotes} className="flex flex-col gap-2">
              <textarea
                autoFocus value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                rows={4}
                placeholder="Notas internas sobre este hito..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
                disabled={notesPending}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={notesPending}>
                  {notesPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : detail.internal_notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.internal_notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">Sin notas internas.</p>
          )}
        </div>
      </div>

      <FormDrawer
        open={editing !== null}
        onOpenChange={(open) => { if (!open) setEditing(null) }}
        title="Editar entregable"
        description={editing?.name}
      >
        <form onSubmit={handleEdit} className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              required disabled={editPending} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              disabled={editPending} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha límite</label>
              <input type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                disabled={editPending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">URL externa</label>
              <input type="url" value={editForm.external_url} onChange={e => setEditForm(f => ({ ...f, external_url: e.target.value }))}
                placeholder="https://..."
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                disabled={editPending} />
            </div>
          </div>
          <Button type="submit" disabled={editPending || !editForm.name.trim()}>
            {editPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </FormDrawer>
    </>
  )
}

// ─── Tab: Facturación ─────────────────────────────────────────────────────────

function TabFacturacion({
  detail, projectId, clientId, onGenerateInvoice,
}: { detail: MilestoneDetail; projectId: string; clientId: string; onGenerateInvoice: () => Promise<void> }) {
  const cur = detail.invoice_currency_code ?? detail.currency_code

  if (!detail.invoice_id) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <div className="rounded-full bg-muted p-3">
          <FileTextIcon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Sin factura asociada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Genera una factura borrador para este hito cuando esté listo para facturar.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onGenerateInvoice}>
          <FileTextIcon className="size-3.5" />
          Generar factura borrador
        </Button>
      </div>
    )
  }

  const amountDue = detail.invoice_amount_due ?? 0
  const amountPaid = detail.invoice_amount_paid ?? 0

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      {/* Invoice summary card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-foreground">{detail.invoice_number}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[detail.invoice_status ?? ""] ?? ""}`}>
              {INVOICE_STATUS_LABEL[detail.invoice_status ?? ""] ?? detail.invoice_status}
            </span>
          </div>
          <Button variant="ghost" size="sm" render={<Link href={`/facturas/${detail.invoice_id}`} />}>
            <ExternalLinkIcon className="size-3.5" />
            Ver factura
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          {[
            { label: "Emitida", value: fmtDate(detail.invoice_issue_date) },
            { label: "Vencimiento", value: fmtDate(detail.invoice_due_date) },
            { label: "Subtotal", value: fmt(detail.invoice_subtotal, cur) },
            { label: "Impuestos", value: fmt(detail.invoice_tax_amount, cur) },
            { label: "Total", value: fmt(detail.invoice_total, cur), bold: true },
            {
              label: "Pendiente",
              value: fmt(amountDue, cur),
              color: amountDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400",
            },
          ].map((cell) => (
            <div key={cell.label} className="bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">{cell.label}</p>
              <p className={`text-sm font-mono ${cell.bold ? "font-semibold" : ""} ${cell.color ?? ""}`}>
                {cell.value}
              </p>
            </div>
          ))}
        </div>
        {amountPaid > 0 && (
          <div className="px-4 py-2.5 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cobrado</span>
            <span className="font-mono font-semibold text-green-600 dark:text-green-400">{fmt(amountPaid, cur)}</span>
          </div>
        )}
      </div>

      {/* Payments */}
      <div>
        <SectionTitle>Cobros recibidos ({detail.payments.length})</SectionTitle>
        {detail.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin cobros registrados para esta factura.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pl-4 text-left font-medium">Método</th>
                  <th className="pb-2 pt-3 text-left font-medium">Referencia</th>
                  <th className="pb-2 pt-3 text-left font-medium">Fecha</th>
                  <th className="pb-2 pt-3 pr-4 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="pl-4 py-2.5 text-foreground">{METHOD_LABEL[p.method] ?? p.method}</td>
                    <td className="py-2.5 text-muted-foreground text-xs font-mono">{p.reference ?? "—"}</td>
                    <td className="py-2.5 text-muted-foreground whitespace-nowrap text-xs">{fmtDate(p.paid_at)}</td>
                    <td className="pr-4 py-2.5 text-right font-mono font-semibold">{fmt(p.amount, p.currency_code)}</td>
                  </tr>
                ))}
              </tbody>
              {detail.payments.length > 1 && (
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={3} className="py-2 pl-4 text-xs text-muted-foreground">Total cobrado</td>
                    <td className="py-2 pr-4 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                      {fmt(detail.payments.reduce((s, p) => s + p.amount, 0), cur)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Costes ──────────────────────────────────────────────────────────────

function TabCostes({
  detail, projectId, onRefresh,
}: { detail: MilestoneDetail; projectId: string; onRefresh: () => Promise<void> }) {
  const cur = detail.currency_code
  const expensesTotal = detail.expenses.reduce((s, e) => s + e.amount, 0)
  const totalCost = (detail.internal_cost ?? 0) + expensesTotal
  const margin = (detail.internal_cost != null || expensesTotal > 0)
    ? detail.amount - totalCost
    : null
  const marginPct = margin != null && detail.amount > 0
    ? Math.round((margin / detail.amount) * 100)
    : null

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Importe</p>
          <p className="font-mono font-semibold text-sm">{fmt(detail.amount, cur)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Coste total</p>
          <p className="font-mono text-sm">{totalCost > 0 ? fmt(totalCost, cur) : "—"}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Margen</p>
          <p className={`font-mono font-semibold text-sm ${margin != null && margin >= 0 ? "text-green-600 dark:text-green-400" : margin != null ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            {margin != null ? fmt(margin, cur) : "—"}
            {marginPct != null && <span className="text-xs font-normal ml-1">({marginPct}%)</span>}
          </p>
        </div>
      </div>

      {/* Desglose de costes */}
      {(detail.internal_cost != null || expensesTotal > 0) && (
        <div className="rounded-lg border bg-card divide-y text-sm">
          {detail.internal_cost != null && (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Coste interno</span>
              <span className="font-mono">{fmt(detail.internal_cost, cur)}</span>
            </div>
          )}
          {expensesTotal > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Gastos del hito</span>
              <span className="font-mono">{fmt(expensesTotal, cur)}</span>
            </div>
          )}
          {(detail.internal_cost != null && expensesTotal > 0) && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
              <span className="text-xs text-muted-foreground font-medium">Total costes</span>
              <span className="font-mono font-semibold text-sm">{fmt(totalCost, cur)}</span>
            </div>
          )}
        </div>
      )}

      {/* Expenses table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Gastos del hito ({detail.expenses.length})</SectionTitle>
          <CostAddExpense
            projectId={projectId}
            milestoneId={detail.id}
            onSuccess={onRefresh}
          />
        </div>
        {detail.expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin gastos registrados para este hito.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pl-4 text-left font-medium">Descripción</th>
                  <th className="pb-2 pt-3 text-left font-medium">Cat.</th>
                  <th className="pb-2 pt-3 text-left font-medium">Fecha</th>
                  <th className="pb-2 pt-3 text-right font-medium">Importe</th>
                  <th className="pb-2 pt-3 pr-4 w-8" />
                </tr>
              </thead>
              <tbody>
                {detail.expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 group">
                    <td className="pl-4 py-2.5 font-medium text-foreground max-w-[140px] truncate">
                      {e.description}
                      {e.notes && <span className="ml-1 text-xs text-muted-foreground font-normal">— {e.notes}</span>}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {CATEGORY_LABEL[e.category] ?? e.category}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(e.incurred_at))}
                    </td>
                    <td className="py-2.5 text-right font-mono">{fmt(e.amount, e.currency_code)}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <CostExpenseActions expenseId={e.id} projectId={projectId} />
                    </td>
                  </tr>
                ))}
              </tbody>
              {detail.expenses.length > 1 && (
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={3} className="py-2 pl-4 text-xs text-muted-foreground">Total</td>
                    <td className="py-2 text-right font-mono font-semibold">{fmt(expensesTotal, cur)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Actividad ───────────────────────────────────────────────────────────

type ActivityFilterId = "todos" | "estado" | "entregables" | "hito" | "facturacion"

const ACTIVITY_FILTERS: { id: ActivityFilterId; label: string }[] = [
  { id: "todos",       label: "Todos" },
  { id: "estado",      label: "Estado" },
  { id: "entregables", label: "Entregables" },
  { id: "hito",        label: "Hito" },
  { id: "facturacion", label: "Facturación" },
]

const ACTION_TO_FILTER: Record<string, ActivityFilterId> = {
  work_status_changed:        "estado",
  billing_status_changed:     "estado",
  deliverable_created:        "entregables",
  deliverable_updated:        "entregables",
  deliverable_status_changed: "entregables",
  deliverable_deleted:        "entregables",
  milestone_updated:          "hito",
  notes_updated:              "hito",
  invoice_generated:          "facturacion",
}

function ActivityEntryIcon({ action }: { action: string }) {
  if (action === "work_status_changed" || action === "billing_status_changed") {
    return <RefreshCwIcon className="size-3.5 text-blue-500" />
  }
  if (action === "deliverable_created")        return <PlusCircleIcon className="size-3.5 text-green-500" />
  if (action === "deliverable_updated")        return <PencilIcon className="size-3.5 text-amber-500" />
  if (action === "deliverable_status_changed") return <CircleCheck className="size-3.5 text-violet-500" />
  if (action === "deliverable_deleted")        return <Trash2Icon className="size-3.5 text-red-500" />
  if (action === "milestone_updated")          return <PencilIcon className="size-3.5 text-foreground" />
  if (action === "notes_updated")              return <FileTextIcon className="size-3.5 text-foreground" />
  if (action === "invoice_generated")          return <FileTextIcon className="size-3.5 text-blue-500" />
  return <ActivityIcon className="size-3.5 text-muted-foreground" />
}

function TabActividad({ detail }: { detail: MilestoneDetail }) {
  const [activeFilter, setActiveFilter] = React.useState<ActivityFilterId>("todos")

  const filtered = activeFilter === "todos"
    ? detail.activity
    : detail.activity.filter(a => (ACTION_TO_FILTER[a.action] ?? "hito") === activeFilter)

  const countFor = (id: ActivityFilterId) =>
    id === "todos"
      ? detail.activity.length
      : detail.activity.filter(a => (ACTION_TO_FILTER[a.action] ?? "hito") === id).length

  return (
    <div className="flex flex-col">
      {/* Filter chips */}
      <div className="flex gap-1.5 px-6 py-3 border-b overflow-x-auto">
        {ACTIVITY_FILTERS.map((f) => {
          const count = countFor(f.id)
          if (f.id !== "todos" && count === 0) return null
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={[
                "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === f.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
              ].join(" ")}
            >
              {f.label}
              {f.id !== "todos" && (
                <span className={`rounded-full px-1 text-[10px] font-semibold ${activeFilter === f.id ? "bg-background/20" : "bg-background"}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      {detail.activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <ActivityIcon className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No hay actividad registrada para este hito.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Sin eventos en esta categoría.</p>
        </div>
      ) : (
        <div className="px-6 py-5">
          <div className="flex flex-col gap-0">
            {filtered.map((a, i) => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-7 shrink-0 rounded-full bg-muted flex items-center justify-center">
                    <ActivityEntryIcon action={a.action} />
                  </div>
                  {i < filtered.length - 1 && (
                    <div className="w-px flex-1 bg-border/60 my-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <p className="text-sm text-foreground leading-snug">{a.summary}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {a.user_name && (
                      <>
                        <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted border text-[9px] font-semibold text-muted-foreground uppercase">
                          {a.user_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.user_name}</span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">{fmtDateTime(a.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

type TabId = "resumen" | "entregables" | "facturacion" | "costes" | "actividad"

const TABS: { id: TabId; label: string }[] = [
  { id: "resumen",     label: "Resumen" },
  { id: "entregables", label: "Entregables" },
  { id: "facturacion", label: "Facturación" },
  { id: "costes",      label: "Costes" },
  { id: "actividad",   label: "Actividad" },
]

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  milestone: ProjectMilestone
  projectId: string
  clientId: string
}

function MilestoneDetailSheet({ milestone, projectId, clientId }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabId>("resumen")
  const [detail, setDetail] = React.useState<MilestoneDetail | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)

  async function loadDetail() {
    setLoading(true)
    const data = await getMilestoneDetailAction(milestone.id, projectId)
    setDetail(data)
    setLoading(false)
  }

  async function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setActiveTab("resumen")
      await loadDetail()
    }
  }

  async function handleRefresh() {
    const data = await getMilestoneDetailAction(milestone.id, projectId)
    setDetail(data)
    router.refresh()
  }

  async function handleGenerateInvoice() {
    setGenerating(true)
    const result = await generateInvoiceFromMilestone(milestone.id, projectId, clientId)
    setGenerating(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Factura ${result.invoiceNumber} creada como borrador.`)
    await handleRefresh()
  }

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

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger
          render={
            <button
              type="button"
              className="block max-w-[220px] truncate text-left text-sm font-medium text-foreground hover:underline hover:decoration-dotted"
            />
          }
        >
          {milestone.name}
        </SheetTrigger>

        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 overflow-hidden">
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4">
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[milestone.type] ?? milestone.type}
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold leading-snug truncate">{milestone.name}</h2>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${WORK_STATUS_STYLE[milestone.work_status] ?? ""}`}>
                    {WORK_STATUS_LABEL[milestone.work_status] ?? milestone.work_status}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[milestone.billing_status] ?? ""}`}>
                    {BILLING_STATUS_LABEL[milestone.billing_status] ?? milestone.billing_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="shrink-0 border-b">
            <nav className="flex px-6 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                  className={[
                    "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === t.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  ].join(" ")}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && <Skeleton />}
            {!loading && !detail && (
              <div className="px-6 py-8 text-sm text-muted-foreground">No se pudo cargar el hito.</div>
            )}
            {!loading && detail && (
              <>
                {activeTab === "resumen" && (
                  <TabResumen detail={detail} projectId={projectId} onRefresh={handleRefresh} />
                )}
                {activeTab === "entregables" && (
                  <TabEntregables detail={detail} projectId={projectId} onRefresh={handleRefresh} />
                )}
                {activeTab === "facturacion" && (
                  <TabFacturacion
                    detail={detail} projectId={projectId} clientId={clientId}
                    onGenerateInvoice={handleGenerateInvoice}
                  />
                )}
                {activeTab === "costes" && (
                  <TabCostes detail={detail} projectId={projectId} onRefresh={handleRefresh} />
                )}
                {activeTab === "actividad" && (
                  <TabActividad detail={detail} />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t px-6 py-4 flex items-center gap-2">
            <SheetClose
              render={
                <Button variant="outline" size="sm"
                  onClick={() => setTimeout(() => setEditOpen(true), 150)} />
              }
            >
              <PencilIcon className="size-3.5" />
              Editar hito
            </SheetClose>

            {!milestone.invoice_id ? (
              <Button variant="outline" size="sm" onClick={handleGenerateInvoice} disabled={generating}>
                <FileTextIcon className="size-3.5" />
                {generating ? "Generando..." : "Crear factura"}
              </Button>
            ) : (
              <Button variant="outline" size="sm" render={<Link href={`/facturas/${milestone.invoice_id}`} />}>
                <ExternalLinkIcon className="size-3.5" />
                Ver factura
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Más acciones" />}
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem render={<Link href={`/proyectos/${projectId}/hitos/${milestone.id}`} />}>
                  <ExternalLinkIcon className="size-3.5 mr-2" />
                  Ver página completa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => { setOpen(false); setTimeout(() => setDeleteOpen(true), 150) }}
                >
                  <Trash2Icon className="size-3.5 mr-2" />
                  Eliminar hito
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

export { MilestoneDetailSheet }
