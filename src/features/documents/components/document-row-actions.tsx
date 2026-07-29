"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DownloadIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { deleteDocument } from "@/features/documents/actions/delete-document"
import { getDocumentUrl } from "@/features/documents/actions/get-document-url"
import type { DocumentWithClient } from "@/features/documents/types"

function DocumentRowActions({ document }: { document: DocumentWithClient }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  async function handleDownload() {
    const result = await getDocumentUrl(document.storage_path)
    if (result.error || !result.url) {
      toast.error(result.error ?? "No se pudo descargar el documento.")
      return
    }
    window.open(result.url, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <DownloadIcon />
            Descargar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={document.title}
        onConfirm={async () => {
          const result = await deleteDocument(document.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Documento eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { DocumentRowActions }
