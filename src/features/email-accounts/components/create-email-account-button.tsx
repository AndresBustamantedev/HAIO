"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmailAccountFormDrawer } from "@/features/email-accounts/components/email-account-form-drawer"
import type { EmailServiceOption } from "@/features/email-accounts/types"

function CreateEmailAccountButton({ serviceOptions }: { serviceOptions: EmailServiceOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva cuenta
      </Button>
      <EmailAccountFormDrawer open={open} onOpenChange={setOpen} serviceOptions={serviceOptions} />
    </>
  )
}

export { CreateEmailAccountButton }
