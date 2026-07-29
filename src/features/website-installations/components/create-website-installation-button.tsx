"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { WebsiteInstallationFormDrawer } from "@/features/website-installations/components/website-installation-form-drawer"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

function CreateWebsiteInstallationButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva instalación
      </Button>
      <WebsiteInstallationFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateWebsiteInstallationButton }
