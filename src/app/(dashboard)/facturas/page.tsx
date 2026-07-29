import { ReceiptIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateInvoiceButton } from "@/features/invoices/components/create-invoice-button";
import { InvoicesTable } from "@/features/invoices/components/invoices-table";
import { INVOICE_STATUSES } from "@/features/invoices/schemas/invoice-schema";
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status";
import { getInvoices } from "@/features/invoices/queries/get-invoices";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type FacturasPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FacturasPage({ searchParams }: FacturasPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Facturas" description="Facturas emitidas a tus clientes." />
        <EmptyState
          icon={ReceiptIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar facturas."
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
      getInvoices({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Facturas" description="Facturas emitidas a tus clientes." />
        <ErrorState description="No se pudo cargar la lista de facturas." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Facturas"
        description="Facturas emitidas a tus clientes."
        actions={<CreateInvoiceButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por número..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: INVOICE_STATUSES.map((value) => ({ value, label: getInvoiceStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <InvoicesTable invoices={result.invoices} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/facturas"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
