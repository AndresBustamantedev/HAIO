"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CredentialFormDrawer } from "@/features/credentials/components/credential-form-drawer"
import type { ClientOption } from "@/features/credentials/types"

function CreateCredentialButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva credencial
      </Button>
      <CredentialFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateCredentialButton }
