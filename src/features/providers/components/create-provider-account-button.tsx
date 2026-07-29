"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProviderAccountFormDrawer } from "@/features/providers/components/provider-account-form-drawer"
import type { Provider } from "@/features/providers/types"

function CreateProviderAccountButton({ providers }: { providers: Pick<Provider, "id" | "name">[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva cuenta
      </Button>
      <ProviderAccountFormDrawer open={open} onOpenChange={setOpen} providers={providers} />
    </>
  )
}

export { CreateProviderAccountButton }
