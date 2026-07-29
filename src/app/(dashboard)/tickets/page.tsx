import { LifeBuoyIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateTicketButton } from "@/features/tickets/components/create-ticket-button";
import { TicketsTable } from "@/features/tickets/components/tickets-table";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/features/tickets/schemas/ticket-schema";
import { getTicketPriorityBadge, getTicketStatusBadge } from "@/features/tickets/utils/labels";
import { getTickets } from "@/features/tickets/queries/get-tickets";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type TicketsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Tickets" description="Solicitudes de soporte de tus clientes." />
        <EmptyState
          icon={LifeBuoyIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar tickets."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const priority = typeof params.priority === "string" ? params.priority : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  try {
    [result, clientOptions] = await Promise.all([
      getTickets({ organizationId: organization.organizationId, search, status, priority, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Tickets" description="Solicitudes de soporte de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de tickets." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tickets"
        description="Solicitudes de soporte de tus clientes."
        actions={<CreateTicketButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por número o asunto..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: TICKET_STATUSES.map((value) => ({ value, label: getTicketStatusBadge(value).label })),
          },
          {
            key: "priority",
            label: "Prioridad",
            options: TICKET_PRIORITIES.map((value) => ({ value, label: getTicketPriorityBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <TicketsTable tickets={result.tickets} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/tickets"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
