import { FolderKanbanIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateProjectButton } from "@/features/projects/components/create-project-button";
import { ProjectsTable } from "@/features/projects/components/projects-table";
import { PROJECT_STATUSES } from "@/features/projects/schemas/project-schema";
import { getProjectStatusBadge } from "@/features/projects/utils/status";
import { getProjects } from "@/features/projects/queries/get-projects";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type ProyectosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ProyectosPage({ searchParams }: ProyectosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Proyectos" description="Gestiona todos tus proyectos." />
        <EmptyState
          icon={FolderKanbanIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar proyectos."
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
      getProjects({
        organizationId: organization.organizationId,
        search,
        status,
        clientId,
        page,
        sort: typeof params.sort === "string" ? params.sort : undefined,
        dir: params.dir === "asc" ? "asc" : "desc",
      }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Proyectos" description="Gestiona todos tus proyectos." />
        <ErrorState description="No se pudo cargar la lista de proyectos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Proyectos"
        description="Gestiona todos tus proyectos."
        actions={<CreateProjectButton />}
      />

      <FilterBar
        searchPlaceholder="Buscar proyecto por nombre..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: PROJECT_STATUSES.map((value) => ({
              value,
              label: getProjectStatusBadge(value).label,
            })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({
              value: client.id,
              label: client.display_name,
            })),
          },
        ]}
      />

      <ProjectsTable projects={result.projects} clientOptions={clientOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/proyectos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
