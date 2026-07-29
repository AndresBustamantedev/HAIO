"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClientFormDrawer } from "@/features/clients/components/client-form-drawer"
import type { Client } from "@/features/clients/types"

function EditClientButton({ client }: { client: Client }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <ClientFormDrawer open={open} onOpenChange={setOpen} client={client} />
    </>
  )
}

export { EditClientButton }
