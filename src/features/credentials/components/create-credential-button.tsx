"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CredentialFormDrawer } from "@/features/credentials/components/credential-form-drawer"
import type { ClientOption } from "@/features/credentials/types"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

function CreateCredentialButton({
  clientOptions,
  projectOptions,
  defaultClientId,
}: {
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
  defaultClientId?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva credencial
      </Button>
      <CredentialFormDrawer
        open={open}
        onOpenChange={setOpen}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        defaultClientId={defaultClientId}
      />
    </>
  )
}

export { CreateCredentialButton }
