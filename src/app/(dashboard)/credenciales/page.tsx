import { KeyRoundIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateCredentialButton } from "@/features/credentials/components/create-credential-button";
import { CredentialsTable } from "@/features/credentials/components/credentials-table";
import { CREDENTIAL_TYPES } from "@/features/credentials/schemas/credential-schema";
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels";
import { getCredentials } from "@/features/credentials/queries/get-credentials";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type CredencialesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CredencialesPage({ searchParams }: CredencialesPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Credenciales" description="Accesos y credenciales gestionados por tu equipo." />
        <EmptyState
          icon={KeyRoundIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar credenciales."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  try {
    [result, clientOptions] = await Promise.all([
      getCredentials({ organizationId: organization.organizationId, search, type, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Credenciales" description="Accesos y credenciales gestionados por tu equipo." />
        <ErrorState description="No se pudo cargar la lista de credenciales." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Credenciales"
        description="Accesos y credenciales gestionados por tu equipo. Los secretos reales viven en un gestor externo — aquí solo se guarda una referencia."
        actions={<CreateCredentialButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre o usuario..."
        filters={[
          {
            key: "type",
            label: "Tipo",
            options: CREDENTIAL_TYPES.map((value) => ({ value, label: getCredentialTypeLabel(value) })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <CredentialsTable credentials={result.credentials} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/credenciales"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
