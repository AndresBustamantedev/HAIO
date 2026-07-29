import { BuildingIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { FilterBar } from "@/components/common/filter-bar"
import { TablePagination } from "@/components/common/table-pagination"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { CreateProviderButton } from "@/features/providers/components/create-provider-button"
import { CreateProviderAccountButton } from "@/features/providers/components/create-provider-account-button"
import { ProvidersTable } from "@/features/providers/components/providers-table"
import { ProviderAccountsTable } from "@/features/providers/components/provider-accounts-table"
import { PROVIDER_CATEGORIES, getProviderCategoryLabel } from "@/features/providers/utils/labels"
import { getProviders } from "@/features/providers/queries/get-providers"
import { getProviderAccounts } from "@/features/providers/queries/get-provider-accounts"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type ProveedoresPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProveedoresPage({ searchParams }: ProveedoresPageProps) {
  const params = await searchParams
  const organization = await getCurrentOrganization()

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Proveedores" description="Catálogo de proveedores y cuentas gestionadas." />
        <EmptyState
          icon={BuildingIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar proveedores."
        />
      </PageContainer>
    )
  }

  const page = Number(params.page ?? "1") || 1
  const search = typeof params.q === "string" ? params.q : undefined
  const category = typeof params.category === "string" ? params.category : undefined

  let providersResult
  let accounts
  try {
    ;[providersResult, accounts] = await Promise.all([
      getProviders({ organizationId: organization.organizationId, search, category, page }),
      getProviderAccounts({ organizationId: organization.organizationId, search }),
    ])
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Proveedores" description="Catálogo de proveedores y cuentas gestionadas." />
        <ErrorState description="No se pudo cargar la lista de proveedores." />
      </PageContainer>
    )
  }

  const providerOptions = providersResult.providers.map((p) => ({ id: p.id, name: p.name }))

  return (
    <PageContainer>
      <PageHeader
        title="Proveedores"
        description="Catálogo de proveedores y cuentas gestionadas."
        actions={<CreateProviderButton />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre..."
        filters={[
          {
            key: "category",
            label: "Categoría",
            options: PROVIDER_CATEGORIES.map((value) => ({
              value,
              label: getProviderCategoryLabel(value),
            })),
          },
        ]}
      />

      <ProvidersTable providers={providersResult.providers} />

      <TablePagination
        page={providersResult.page}
        pageSize={providersResult.pageSize}
        total={providersResult.total}
        basePath="/proveedores"
        searchParams={params as Record<string, string | undefined>}
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cuentas de proveedor</h2>
            <p className="text-sm text-muted-foreground">Accesos y contratos gestionados por proveedor.</p>
          </div>
          <CreateProviderAccountButton providers={providerOptions} />
        </div>
        <ProviderAccountsTable accounts={accounts} providers={providerOptions} />
      </div>
    </PageContainer>
  )
}
