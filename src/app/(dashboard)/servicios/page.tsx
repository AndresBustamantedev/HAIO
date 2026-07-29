import { PackageIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { CreateServiceButton } from "@/features/services/components/create-service-button";
import { ServicesTable } from "@/features/services/components/services-table";
import { SERVICE_CATEGORIES } from "@/features/services/schemas/service-schema";
import { getServiceCategoryLabel } from "@/features/services/utils/labels";
import { getServices } from "@/features/services/queries/get-services";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type ServiciosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ServiciosPage({ searchParams }: ServiciosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Servicios" description="Catálogo de servicios que ofreces." />
        <EmptyState
          icon={PackageIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar el catálogo."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;

  let result;
  try {
    result = await getServices({ organizationId: organization.organizationId, search, category, page });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Servicios" description="Catálogo de servicios que ofreces." />
        <ErrorState description="No se pudo cargar el catálogo de servicios." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Servicios"
        description="Catálogo de servicios que ofreces."
        actions={<CreateServiceButton />}
      />

      <FilterBar
        searchPlaceholder="Buscar por nombre o código..."
        filters={[
          {
            key: "category",
            label: "Categoría",
            options: SERVICE_CATEGORIES.map((value) => ({ value, label: getServiceCategoryLabel(value) })),
          },
        ]}
      />

      <ServicesTable services={result.services} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/servicios"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
