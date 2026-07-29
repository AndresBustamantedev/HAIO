import { DatabaseBackupIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateBackupConfigButton } from "@/features/backups/components/create-backup-config-button";
import { BackupConfigsTable } from "@/features/backups/components/backup-configs-table";
import { BACKUP_STATUSES } from "@/features/backups/schemas/backup-config-schema";
import { getBackupStatusBadge } from "@/features/backups/utils/status";
import { getBackupConfigs } from "@/features/backups/queries/get-backup-configs";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type BackupsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BackupsPage({ searchParams }: BackupsPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Backups" description="Configuraciones y ejecuciones de copias de seguridad." />
        <EmptyState
          icon={DatabaseBackupIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar backups."
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
      getBackupConfigs({ organizationId: organization.organizationId, search, status, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Backups" description="Configuraciones y ejecuciones de copias de seguridad." />
        <ErrorState description="No se pudo cargar la lista de backups." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Backups"
        description="Configuraciones y ejecuciones de copias de seguridad."
        actions={<CreateBackupConfigButton clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre o proveedor..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: BACKUP_STATUSES.map((value) => ({ value, label: getBackupStatusBadge(value).label })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <BackupConfigsTable configs={result.configs} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/backups"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
