import { RepeatIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateSubscriptionButton } from "@/features/subscriptions/components/create-subscription-button";
import { SubscriptionsTable } from "@/features/subscriptions/components/subscriptions-table";
import { SUBSCRIPTION_STATUSES } from "@/features/subscriptions/schemas/subscription-schema";
import { getSubscriptionStatusBadge } from "@/features/subscriptions/utils/status";
import { getSubscriptions } from "@/features/subscriptions/queries/get-subscriptions";
import { getServiceOptions } from "@/features/services/queries/get-service-options";
import { getClientOptions, getProjectOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type SuscripcionesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SuscripcionesPage({ searchParams }: SuscripcionesPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Suscripciones" description="Servicios recurrentes contratados por tus clientes." />
        <EmptyState
          icon={RepeatIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar suscripciones."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const status = typeof params.status === "string" ? params.status : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  let serviceOptions;
  let projectOptions;
  try {
    [result, clientOptions, serviceOptions, projectOptions] = await Promise.all([
      getSubscriptions({ organizationId: organization.organizationId, status, clientId, page }),
      getClientOptions(organization.organizationId),
      getServiceOptions(organization.organizationId),
      getProjectOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Suscripciones" description="Servicios recurrentes contratados por tus clientes." />
        <ErrorState description="No se pudo cargar la lista de suscripciones." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Suscripciones"
        description="Servicios recurrentes contratados por tus clientes."
        actions={<CreateSubscriptionButton clientOptions={clientOptions} serviceOptions={serviceOptions} projectOptions={projectOptions} />}
      />

      <FilterBar
        showSearch={false}
        filters={[
          {
            key: "status",
            label: "Estado",
            options: SUBSCRIPTION_STATUSES.map((value) => ({ value, label: getSubscriptionStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <SubscriptionsTable subscriptions={result.subscriptions} clientOptions={clientOptions} serviceOptions={serviceOptions} projectOptions={projectOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/suscripciones"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
