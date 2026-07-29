import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { ServiceRowActions } from "@/features/services/components/service-row-actions"
import { getServiceBillingTypeBadge, getServiceCategoryLabel } from "@/features/services/utils/labels"
import type { Service } from "@/features/services/types"

function formatCurrency(value: number | null, currency: string) {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value)
}

const columns: DataTableColumn<Service>[] = [
  {
    key: "name",
    header: "Servicio",
    cell: (service) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{service.name}</span>
        <span className="text-xs text-muted-foreground">{service.code}</span>
      </div>
    ),
  },
  {
    key: "category",
    header: "Categoría",
    cell: (service) => <span className="text-muted-foreground">{getServiceCategoryLabel(service.category)}</span>,
  },
  {
    key: "billing_type",
    header: "Cobro",
    cell: (service) => {
      const badge = getServiceBillingTypeBadge(service.billing_type)
      return <StatusBadge tone={badge.tone} label={badge.label} />
    },
  },
  {
    key: "default_price",
    header: "Precio",
    cell: (service) => (
      <span className="text-muted-foreground">{formatCurrency(service.default_price, service.currency_code)}</span>
    ),
  },
  {
    key: "is_active",
    header: "Estado",
    cell: (service) => (
      <StatusBadge tone={service.is_active ? "success" : "neutral"} label={service.is_active ? "Activo" : "Inactivo"} />
    ),
  },
]

function ServicesTable({ services }: { services: Service[] }) {
  return (
    <DataTable
      columns={columns}
      rows={services}
      getRowId={(service) => service.id}
      rowActions={(service) => <ServiceRowActions service={service} />}
      emptyTitle="Todavía no hay servicios"
      emptyDescription="Crea el primer servicio de tu catálogo."
    />
  )
}

export { ServicesTable }
