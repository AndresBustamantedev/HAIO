"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmailServiceFormDrawer } from "@/features/email-services/components/email-service-form-drawer"
import type { ClientOption } from "@/features/email-services/types"

function CreateEmailServiceButton({
  clientOptions,
  defaultClientId,
}: {
  clientOptions: ClientOption[]
  defaultClientId?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo servicio
      </Button>
      <EmailServiceFormDrawer
        open={open}
        onOpenChange={setOpen}
        clientOptions={clientOptions}
        defaultClientId={defaultClientId}
      />
    </>
  )
}

export { CreateEmailServiceButton }
