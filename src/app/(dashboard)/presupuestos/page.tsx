import { FileTextIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateQuoteButton } from "@/features/quotes/components/create-quote-button";
import { QuotesTable } from "@/features/quotes/components/quotes-table";
import { QUOTE_STATUSES } from "@/features/quotes/schemas/quote-schema";
import { getQuoteStatusBadge } from "@/features/quotes/utils/status";
import { getQuotes } from "@/features/quotes/queries/get-quotes";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type PresupuestosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PresupuestosPage({ searchParams }: PresupuestosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Presupuestos" description="Presupuestos enviados a tus clientes." />
        <EmptyState
          icon={FileTextIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar presupuestos."
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
      getQuotes({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Presupuestos" description="Presupuestos enviados a tus clientes." />
        <ErrorState description="No se pudo cargar la lista de presupuestos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Presupuestos"
        description="Presupuestos enviados a tus clientes."
        actions={<CreateQuoteButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por número..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: QUOTE_STATUSES.map((value) => ({ value, label: getQuoteStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <QuotesTable quotes={result.quotes} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/presupuestos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
