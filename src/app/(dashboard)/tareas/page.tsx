import { ListTodoIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateTaskButton } from "@/features/tasks/components/create-task-button";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/features/tasks/schemas/task-schema";
import { getTaskPriorityBadge, getTaskStatusBadge } from "@/features/tasks/utils/labels";
import { getTasks } from "@/features/tasks/queries/get-tasks";
import { getClientOptions, getProjectOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type TareasPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TareasPage({ searchParams }: TareasPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Tareas" description="Todas las tareas de tu equipo." />
        <EmptyState
          icon={ListTodoIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar tareas."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const priority = typeof params.priority === "string" ? params.priority : undefined;
  const projectId = typeof params.project === "string" ? params.project : undefined;

  let result;
  let clientOptions;
  let projectOptions;
  try {
    [result, clientOptions, projectOptions] = await Promise.all([
      getTasks({ organizationId: organization.organizationId, search, status, priority, projectId, page }),
      getClientOptions(organization.organizationId),
      getProjectOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Tareas" description="Todas las tareas de tu equipo." />
        <ErrorState description="No se pudo cargar la lista de tareas." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tareas"
        description="Todas las tareas de tu equipo."
        actions={<CreateTaskButton clientOptions={clientOptions} projectOptions={projectOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por título..."
        filters={[
          {
            key: "status",
            label: "Estado",
            options: TASK_STATUSES.map((value) => ({ value, label: getTaskStatusBadge(value).label })),
          },
          {
            key: "priority",
            label: "Prioridad",
            options: TASK_PRIORITIES.map((value) => ({ value, label: getTaskPriorityBadge(value).label })),
          },
          {
            key: "project",
            label: "Proyecto",
            options: projectOptions.map((project) => ({ value: project.id, label: project.name })),
          },
        ]}
      />

      <TasksTable tasks={result.tasks} clientOptions={clientOptions} projectOptions={projectOptions} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/tareas"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
