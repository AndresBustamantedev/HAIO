import { WalletIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreatePaymentButton } from "@/features/payments/components/create-payment-button";
import { PaymentsTable } from "@/features/payments/components/payments-table";
import { PAYMENT_STATUSES } from "@/features/payments/schemas/payment-schema";
import { getPaymentStatusBadge } from "@/features/payments/utils/labels";
import { getPayments } from "@/features/payments/queries/get-payments";
import { getInvoiceOptions } from "@/features/payments/queries/get-invoice-options";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type PagosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PagosPage({ searchParams }: PagosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Pagos" description="Pagos recibidos de tus clientes." />
        <EmptyState
          icon={WalletIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar pagos."
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
  let invoiceOptions;
  try {
    [result, clientOptions, invoiceOptions] = await Promise.all([
      getPayments({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
      getInvoiceOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Pagos" description="Pagos recibidos de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de pagos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Pagos"
        description="Pagos recibidos de tus clientes."
        actions={<CreatePaymentButton clientOptions={clientOptions} invoiceOptions={invoiceOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por referencia..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: PAYMENT_STATUSES.map((value) => ({ value, label: getPaymentStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <PaymentsTable payments={result.payments} clientOptions={clientOptions} invoiceOptions={invoiceOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/pagos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
