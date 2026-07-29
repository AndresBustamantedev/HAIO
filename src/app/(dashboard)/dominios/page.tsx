import { GlobeIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateDomainButton } from "@/features/domains/components/create-domain-button";
import { DomainsTable } from "@/features/domains/components/domains-table";
import { DOMAIN_STATUSES } from "@/features/domains/schemas/domain-schema";
import { getDomainStatusBadge } from "@/features/domains/utils/status";
import { getDomains } from "@/features/domains/queries/get-domains";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type DominiosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DominiosPage({ searchParams }: DominiosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Dominios" description="Todos los dominios de tus clientes." />
        <EmptyState
          icon={GlobeIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar dominios."
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
      getDomains({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Dominios" description="Todos los dominios de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de dominios." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dominios"
        description="Todos los dominios de tus clientes."
        actions={<CreateDomainButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar dominio..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: DOMAIN_STATUSES.map((value) => ({ value, label: getDomainStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <DomainsTable domains={result.domains} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/dominios"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
