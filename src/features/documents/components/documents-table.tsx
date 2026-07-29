import Link from "next/link"
import { FileIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { DocumentRowActions } from "@/features/documents/components/document-row-actions"
import { formatFileSize, getDocumentCategoryLabel } from "@/features/documents/utils/labels"
import type { DocumentWithClient } from "@/features/documents/types"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

const columns: DataTableColumn<DocumentWithClient>[] = [
  {
    key: "title",
    header: "Documento",
    cell: (document) => (
      <div className="flex items-center gap-2">
        <FileIcon className="size-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{document.title}</span>
          <span className="text-xs text-muted-foreground">
            {document.original_filename} · {formatFileSize(document.size_bytes)}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    header: "Categoría",
    cell: (document) => <span className="text-muted-foreground">{getDocumentCategoryLabel(document.category)}</span>,
  },
  {
    key: "client",
    header: "Cliente",
    cell: (document) =>
      document.clients ? (
        <Link href={`/clientes/${document.clients.id}`} className="text-muted-foreground hover:underline">
          {document.clients.display_name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "visibility",
    header: "Visibilidad",
    cell: (document) =>
      document.is_visible_to_client ? (
        <StatusBadge tone="info" label="Cliente" />
      ) : (
        <StatusBadge tone="neutral" label="Interno" />
      ),
  },
  {
    key: "created_at",
    header: "Subido",
    cell: (document) => <span className="text-muted-foreground">{formatDate(document.created_at)}</span>,
  },
]

function DocumentsTable({ documents }: { documents: DocumentWithClient[] }) {
  return (
    <DataTable
      columns={columns}
      rows={documents}
      getRowId={(document) => document.id}
      rowActions={(document) => <DocumentRowActions document={document} />}
      emptyTitle="Todavía no hay documentos"
      emptyDescription="Sube el primer documento."
    />
  )
}

export { DocumentsTable }
