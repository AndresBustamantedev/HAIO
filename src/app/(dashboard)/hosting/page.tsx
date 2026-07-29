import { ServerIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateHostingButton } from "@/features/hosting/components/create-hosting-button";
import { HostingTable } from "@/features/hosting/components/hosting-table";
import { HOSTING_STATUSES } from "@/features/hosting/schemas/hosting-schema";
import { getHostingStatusBadge } from "@/features/hosting/utils/status";
import { getHostingAccounts } from "@/features/hosting/queries/get-hosting-accounts";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type HostingPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HostingPage({ searchParams }: HostingPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Hosting" description="Todas las cuentas de hosting de tus clientes." />
        <EmptyState
          icon={ServerIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar hosting."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  try {
    [result, clientOptions] = await Promise.all([
      getHostingAccounts({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Hosting" description="Todas las cuentas de hosting de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de hosting." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Hosting"
        description="Todas las cuentas de hosting de tus clientes."
        actions={<CreateHostingButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por proveedor, plan o servidor..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: HOSTING_STATUSES.map((value) => ({ value, label: getHostingStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <HostingTable hostingAccounts={result.hostingAccounts} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/hosting"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
