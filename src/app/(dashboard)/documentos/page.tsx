import { FolderIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { UploadDocumentButton } from "@/features/documents/components/upload-document-button";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { DOCUMENT_CATEGORIES } from "@/features/documents/schemas/document-schema";
import { getDocumentCategoryLabel } from "@/features/documents/utils/labels";
import { getDocuments } from "@/features/documents/queries/get-documents";
import { getClientOptions } from "@/lib/supabase/queries/client-options";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type DocumentosPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DocumentosPage({ searchParams }: DocumentosPageProps) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) {
    return (
      <PageContainer>
        <PageHeader title="Documentos" description="Todos los archivos de tus clientes y proyectos." />
        <EmptyState
          icon={FolderIcon}
          title="Todavía no perteneces a ninguna organización"
          description="Necesitas ser miembro de una organización para gestionar documentos."
        />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const search = typeof params.q === "string" ? params.q : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const clientId = typeof params.client === "string" ? params.client : undefined;

  let result;
  let clientOptions;
  try {
    [result, clientOptions] = await Promise.all([
      getDocuments({ organizationId: organization.organizationId, search, category, clientId, page }),
      getClientOptions(organization.organizationId),
    ]);
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Documentos" description="Todos los archivos de tus clientes y proyectos." />
        <ErrorState description="No se pudo cargar la lista de documentos." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Documentos"
        description="Todos los archivos de tus clientes y proyectos."
        actions={<UploadDocumentButton organizationId={organization.organizationId} clientOptions={clientOptions} />}
      />

      <FilterBar
        searchPlaceholder="Buscar por título..."
        filters={[
          {
            key: "category",
            label: "Categoría",
            options: DOCUMENT_CATEGORIES.map((value) => ({ value, label: getDocumentCategoryLabel(value) })),
          },
          {
            key: "client",
            label: "Cliente",
            options: clientOptions.map((client) => ({ value: client.id, label: client.display_name })),
          },
        ]}
      />

      <DocumentsTable documents={result.documents} />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/documentos"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
