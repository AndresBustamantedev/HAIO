"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HostingFormDrawer } from "@/features/hosting/components/hosting-form-drawer"
import type { ClientOption } from "@/features/hosting/types"

function CreateHostingButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo hosting
      </Button>
      <HostingFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateHostingButton }
