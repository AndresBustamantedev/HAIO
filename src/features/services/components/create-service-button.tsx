"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ServiceFormDrawer } from "@/features/services/components/service-form-drawer"

function CreateServiceButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo servicio
      </Button>
      <ServiceFormDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}

export { CreateServiceButton }
