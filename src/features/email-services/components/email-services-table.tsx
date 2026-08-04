import Link from "next/link"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { EmailServiceRowActions } from "@/features/email-services/components/email-service-row-actions"
import { getEmailServiceStatusBadge } from "@/features/email-services/utils/status"
import type { ClientOption, EmailServiceWithClient } from "@/features/email-services/types"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function buildColumns(): DataTableColumn<EmailServiceWithClient>[] {
  return [
    {
      key: "provider_name",
      header: "Proveedor",
      cell: (service) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{service.provider_name}</span>
          {service.plan_name ? <span className="text-xs text-muted-foreground">{service.plan_name}</span> : null}
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (service) =>
        service.clients ? (
          <Link href={`/correos/${service.clients.id}`} className="text-muted-foreground hover:underline">
            {service.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (service) => {
        const badge = getEmailServiceStatusBadge(service.status)
        return <StatusBadge tone={badge.tone} label={badge.label} />
      },
    },
    {
      key: "expires_on",
      header: "Expira",
      cell: (service) => <span className="text-muted-foreground">{formatDate(service.expires_on)}</span>,
    },
  ]
}

function EmailServicesTable({
  emailServices,
  clientOptions,
}: {
  emailServices: EmailServiceWithClient[]
  clientOptions: ClientOption[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={emailServices}
      getRowId={(service) => service.id}
      rowActions={(service) => <EmailServiceRowActions emailService={service} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay servicios de correo"
      emptyDescription="Registra el primer servicio de correo de un cliente."
    />
  )
}

export { EmailServicesTable }
