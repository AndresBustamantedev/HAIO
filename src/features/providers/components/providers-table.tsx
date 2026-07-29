import { GlobeIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { ProviderRowActions } from "@/features/providers/components/provider-row-actions"
import { getProviderCategoryLabel } from "@/features/providers/utils/labels"
import type { ProviderWithAccounts } from "@/features/providers/types"

const CATEGORY_TONE: Record<string, "info" | "neutral" | "warning" | "success"> = {
  registrar: "info",
  hosting: "success",
  email: "neutral",
  dns: "warning",
  cms: "neutral",
  cloud: "info",
  other: "neutral",
}

function buildColumns(): DataTableColumn<ProviderWithAccounts>[] {
  return [
    {
      key: "name",
      header: "Proveedor",
      cell: (p) => (
        <div className="flex items-center gap-1.5">
          <GlobeIcon className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">{p.name}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      cell: (p) => (
        <StatusBadge tone={CATEGORY_TONE[p.category] ?? "neutral"} label={getProviderCategoryLabel(p.category)} />
      ),
    },
    {
      key: "accounts",
      header: "Cuentas",
      cell: (p) => (
        <span className="text-muted-foreground">
          {p.provider_accounts.length} {p.provider_accounts.length === 1 ? "cuenta" : "cuentas"}
        </span>
      ),
    },
    {
      key: "website",
      header: "Web",
      cell: (p) =>
        p.website ? (
          <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline text-sm">
            {new URL(p.website).hostname}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]
}

function ProvidersTable({ providers }: { providers: ProviderWithAccounts[] }) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={providers}
      getRowId={(p) => p.id}
      rowActions={(p) => <ProviderRowActions provider={p} />}
      emptyTitle="Todavía no hay proveedores"
      emptyDescription="Añade el primer proveedor al catálogo."
    />
  )
}

export { ProvidersTable }
