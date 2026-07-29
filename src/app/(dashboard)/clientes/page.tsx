import { BuildingIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateClientButton } from "@/features/clients/components/create-client-button";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { CLIENT_STATUSES } from "@/features/clients/schemas/client-schema";
import { getClientStatusBadge } from "@/features/clients/utils/status";
import { getClients } from "@/features/clients/queries/get-clients";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type ClientesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Clientes" description="Gestiona todos tus clientes." />
        <EmptyState
          icon={BuildingIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar clientes."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  let result;
  try {
    result = await getClients({
      organizationId: organization.organizationId,
      search,
      status,
      page,
      sort: typeof params.sort === "string" ? params.sort : undefined,
      dir: params.dir === "asc" ? "asc" : "desc",
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Clientes" description="Gestiona todos tus clientes." />
        <ErrorState description="No se pudo cargar la lista de clientes." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        description="Gestiona todos tus clientes."
        actions={<CreateClientButton />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre, NIF o email..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: CLIENT_STATUSES.map((value) => ({
              value,
              label: getClientStatusBadge(value).label,
            })),
          },
        ]}
      />

      <ClientsTable clients={result.clients} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/clientes"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
