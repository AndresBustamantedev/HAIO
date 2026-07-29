"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DomainFormDrawer } from "@/features/domains/components/domain-form-drawer"
import type { ClientOption } from "@/features/domains/types"

function CreateDomainButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo dominio
      </Button>
      <DomainFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateDomainButton }
