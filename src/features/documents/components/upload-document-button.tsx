"use client"

import * as React from "react"
import { UploadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DocumentUploadDrawer } from "@/features/documents/components/document-upload-drawer"
import type { ClientOption } from "@/features/documents/types"

function UploadDocumentButton({ organizationId, clientOptions }: { organizationId: string; clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UploadIcon />
        Subir documento
      </Button>
      <DocumentUploadDrawer open={open} onOpenChange={setOpen} organizationId={organizationId} clientOptions={clientOptions} />
    </>
  )
}

export { UploadDocumentButton }
