import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { ProviderAccountRowActions } from "@/features/providers/components/provider-account-row-actions"
import { getProviderCategoryLabel } from "@/features/providers/utils/labels"
import type { Provider, ProviderAccountWithProvider } from "@/features/providers/types"

function buildColumns(): DataTableColumn<ProviderAccountWithProvider>[] {
  return [
    {
      key: "label",
      header: "Cuenta",
      cell: (a) => <span className="font-medium text-foreground">{a.label}</span>,
    },
    {
      key: "provider",
      header: "Proveedor",
      cell: (a) => (
        <span className="text-muted-foreground">
          {a.providers?.name ?? "—"}
          {a.providers?.category ? ` · ${getProviderCategoryLabel(a.providers.category)}` : ""}
        </span>
      ),
    },
    {
      key: "account_reference",
      header: "Referencia",
      cell: (a) => <span className="text-muted-foreground">{a.account_reference ?? "—"}</span>,
    },
  ]
}

function ProviderAccountsTable({
  accounts,
  providers,
}: {
  accounts: ProviderAccountWithProvider[]
  providers: Pick<Provider, "id" | "name">[]
}) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={accounts}
      getRowId={(a) => a.id}
      rowActions={(a) => <ProviderAccountRowActions account={a} providers={providers} />}
      emptyTitle="Sin cuentas de proveedor"
      emptyDescription="Añade la primera cuenta."
    />
  )
}

export { ProviderAccountsTable }
