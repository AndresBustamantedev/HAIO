import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowRightIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HeadphonesIcon,
  ReceiptIcon,
} from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { getPortalOverview } from "@/features/portal/queries/get-portal-overview"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatusBadgeTone } from "@/components/common/status-badge"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(dateStr)
  )
}

function formatCurrency(amount: number | string | null): string {
  const n = Number(amount ?? 0)
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
}

function projectStatusTone(status: string | null): StatusBadgeTone {
  if (status === "active" || status === "in_progress") return "success"
  if (status === "on_hold" || status === "paused") return "warning"
  if (status === "completed" || status === "closed") return "neutral"
  if (status === "cancelled") return "destructive"
  return "neutral"
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  lead: "Lead", active: "Activo", in_progress: "En progreso",
  on_hold: "En pausa", paused: "Pausado",
  completed: "Completado", closed: "Cerrado", cancelled: "Cancelado",
}

function invoiceStatusTone(status: string | null): StatusBadgeTone {
  if (status === "paid") return "success"
  if (status === "overdue") return "destructive"
  if (status === "sent" || status === "viewed") return "info"
  if (status === "issued" || status === "partially_paid") return "warning"
  return "neutral"
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", issued: "Emitida", sent: "Enviada", viewed: "Vista",
  partially_paid: "Pago parcial", paid: "Pagada", overdue: "Vencida",
  void: "Anulada", refunded: "Reembolsada",
}

function ticketStatusTone(status: string | null): StatusBadgeTone {
  if (status === "open") return "warning"
  if (status === "in_progress") return "info"
  if (status === "resolved" || status === "closed") return "success"
  return "neutral"
}

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Abierto", in_progress: "En progreso", waiting_customer: "Esperando respuesta",
  resolved: "Resuelto", closed: "Cerrado",
}

export default async function PortalPage() {
  const session = await getPortalSession()
  if (!session) redirect("/login")

  const { access } = session
  const overview = await getPortalOverview(access.client_id)

  const UNPAID_STATUSES = ["issued", "sent", "viewed", "partially_paid", "overdue"]
  const pendingInvoices = overview.invoices.filter(
    (inv) => inv.status && (UNPAID_STATUSES as string[]).includes(inv.status)
  )
  const openTickets = overview.tickets.filter(
    (t) => t.status && !["resolved", "closed"].includes(t.status)
  )
  const activeProjects = overview.projects.filter(
    (p) => p.status && ["active", "in_progress"].includes(p.status)
  )

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Bienvenido/a de nuevo</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{access.client.display_name}</h1>
        {access.client.email ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{access.client.email}</p>
        ) : null}
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile
          icon={<FolderKanbanIcon className="size-5 text-blue-500" />}
          label="Proyectos activos"
          value={activeProjects.length}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <MetricTile
          icon={<ReceiptIcon className="size-5 text-amber-500" />}
          label="Facturas pendientes"
          value={pendingInvoices.length}
          bg="bg-amber-50 dark:bg-amber-950/30"
        />
        <MetricTile
          icon={<FileTextIcon className="size-5 text-emerald-500" />}
          label="Documentos"
          value={overview.documents.length}
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <MetricTile
          icon={<HeadphonesIcon className="size-5 text-violet-500" />}
          label="Tickets abiertos"
          value={openTickets.length}
          bg="bg-violet-50 dark:bg-violet-950/30"
        />
      </div>

      {/* Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {access.can_view_projects ? (
          <SectionCard
            title="Proyectos recientes"
            href="/portal/proyectos"
            empty={overview.projects.length === 0}
            emptyLabel="No hay proyectos todavía."
          >
            {overview.projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  {p.description ? (
                    <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                  ) : null}
                </div>
                <StatusBadge
                  tone={projectStatusTone(p.status)}
                  label={PROJECT_STATUS_LABEL[p.status] ?? p.status}
                />
              </div>
            ))}
          </SectionCard>
        ) : null}

        {access.can_view_invoices ? (
          <SectionCard
            title="Facturas recientes"
            href="/portal/facturas"
            empty={overview.invoices.length === 0}
            emptyLabel="No hay facturas todavía."
          >
            {overview.invoices.map((inv, i) => (
              <div key={inv.invoice_id ?? i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {inv.invoice_number ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.due_date)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(inv.total)}
                  </span>
                  <StatusBadge
                    tone={invoiceStatusTone(inv.status)}
                    label={INVOICE_STATUS_LABEL[inv.status ?? ""] ?? inv.status ?? "—"}
                  />
                </div>
              </div>
            ))}
          </SectionCard>
        ) : null}

        {access.can_view_documents ? (
          <SectionCard
            title="Documentos compartidos"
            href="/portal/documentos"
            empty={overview.documents.length === 0}
            emptyLabel="No hay documentos compartidos todavía."
          >
            {overview.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-2.5">
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                </div>
              </div>
            ))}
          </SectionCard>
        ) : null}

        {access.can_create_tickets ? (
          <SectionCard
            title="Tickets de soporte"
            href="/portal/soporte"
            empty={overview.tickets.length === 0}
            emptyLabel="No tienes tickets de soporte."
          >
            {overview.tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    Actualizado {formatDate(t.updated_at)}
                  </p>
                </div>
                <StatusBadge
                  tone={ticketStatusTone(t.status)}
                  label={TICKET_STATUS_LABEL[t.status ?? ""] ?? t.status ?? "—"}
                />
              </div>
            ))}
          </SectionCard>
        ) : null}
      </div>
    </div>
  )
}

function MetricTile({
  icon,
  label,
  value,
  bg,
}: {
  icon: ReactNode
  label: string
  value: number
  bg: string
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${bg}`}>
      {icon}
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  href,
  empty,
  emptyLabel,
  children,
}: {
  title: string
  href: string
  empty: boolean
  emptyLabel: string
  children?: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" render={<Link href={href} />} className="text-xs">
          Ver todo
          <ArrowRightIcon className="size-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="divide-y">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
