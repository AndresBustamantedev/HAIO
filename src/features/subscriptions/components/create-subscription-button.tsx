"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SubscriptionFormDrawer } from "@/features/subscriptions/components/subscription-form-drawer"
import type { ClientOption, ProjectOption, ServiceOption } from "@/features/subscriptions/types"

function CreateSubscriptionButton({ clientOptions, serviceOptions, projectOptions }: { clientOptions: ClientOption[]; serviceOptions: ServiceOption[]; projectOptions?: ProjectOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva suscripción
      </Button>
      <SubscriptionFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} serviceOptions={serviceOptions} projectOptions={projectOptions} />
    </>
  )
}

export { CreateSubscriptionButton }
