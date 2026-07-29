import { UsersIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateContactButton } from "@/features/contacts/components/create-contact-button";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import { getContacts } from "@/features/contacts/queries/get-contacts";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type ContactosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ContactosPage({ searchParams }: ContactosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Contactos" description="Todas las personas de contacto de tus clientes." />
        <EmptyState
          icon={UsersIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar contactos."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  try {
    [result, clientOptions] = await Promise.all([
      getContacts({ organizationId: organization.organizationId, search, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Contactos" description="Todas las personas de contacto de tus clientes." />
        <ErrorState description="No se pudo cargar la lista de contactos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contactos"
        description="Todas las personas de contacto de tus clientes."
        actions={<CreateContactButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre, email o cargo..."
        filters={[
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <ContactsTable contacts={result.contacts} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/contactos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
