import Link from "next/link"
import { MailIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { StatusBadge } from "@/components/common/status-badge"
import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getEmailAccountsByClient, type ClientEmailGroup } from "@/features/email-accounts/queries/get-email-accounts-by-client"
import { CreateEmailServiceButton } from "@/features/email-services/components/create-email-service-button"

type ClientSummaryRow = {
  client_id: string
  client_name: string
  service_count: number
  account_count: number
  status: "active" | "pending" | "suspended" | "expired" | "cancelled" | "none"
}

const STATUS_PRIORITY = ["expired", "suspended", "pending", "cancelled", "active"] as const

function aggregateStatus(group: ClientEmailGroup): ClientSummaryRow["status"] {
  if (group.services.length === 0) return "none"
  const statuses = new Set(group.services.map((s) => s.status))
  for (const s of STATUS_PRIORITY) {
    if (statuses.has(s)) return s
  }
  return "active"
}

const STATUS_LABEL: Record<ClientSummaryRow["status"], string> = {
  active: "Activo",
  pending: "Pendiente",
  suspended: "Suspendido",
  expired: "Expirado",
  cancelled: "Cancelado",
  none: "Sin servicios",
}

const STATUS_TONE: Record<ClientSummaryRow["status"], "success" | "warning" | "destructive" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  expired: "destructive",
  cancelled: "neutral",
  none: "neutral",
}

const COLUMNS: DataTableColumn<ClientSummaryRow>[] = [
  {
    key: "client_name",
    header: "Cliente",
    cell: (row) => (
      <Link href={`/correos/${row.client_id}`} className="font-medium text-foreground hover:underline">
        {row.client_name}
      </Link>
    ),
  },
  {
    key: "service_count",
    header: "Servicios",
    cell: (row) => <span className="text-muted-foreground">{row.service_count}</span>,
  },
  {
    key: "account_count",
    header: "Buzones",
    cell: (row) => <span className="text-muted-foreground">{row.account_count}</span>,
  },
  {
    key: "status",
    header: "Estado",
    cell: (row) =>
      row.status === "none" ? (
        <span className="text-xs text-muted-foreground">—</span>
      ) : (
        <StatusBadge tone={STATUS_TONE[row.status]} label={STATUS_LABEL[row.status]} />
      ),
  },
]

export default async function CorreosPage() {
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Buzones de correo de tus clientes." />
        <EmptyState
          icon={MailIcon}
          title="Sin organización"
          description="Necesitas pertenecer a una organización para gestionar correos."
        />
      </PageContainer>
    )
  }

  let clientGroups
  let clientOptions
  try {
    ;[clientGroups, clientOptions] = await Promise.all([
      getEmailAccountsByClient(organization.organizationId),
      getClientOptions(organization.organizationId),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Correos" description="Buzones de correo de tus clientes." />
        <ErrorState description="No se pudo cargar la información de correos." />
      </PageContainer>
    )
  }

  const rows: ClientSummaryRow[] = clientGroups.map((group) => ({
    client_id: group.client_id,
    client_name: group.client_name,
    service_count: group.services.length,
    account_count: group.services.reduce((n, s) => n + s.accounts.length, 0),
    status: aggregateStatus(group),
  }))

  return (
    <PageContainer>
      <PageHeader
        title="Correos"
        description="Buzones de correo organizados por cliente."
        actions={<CreateEmailServiceButton clientOptions={clientOptions} />}
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        getRowId={(row) => row.client_id}
        emptyTitle="Sin servicios de correo"
        emptyDescription="Añade un servicio de correo a un cliente para empezar."
      />
    </PageContainer>
  )
}
