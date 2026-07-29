"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProviderFormDrawer } from "@/features/providers/components/provider-form-drawer"

function CreateProviderButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo proveedor
      </Button>
      <ProviderFormDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}

export { CreateProviderButton }
