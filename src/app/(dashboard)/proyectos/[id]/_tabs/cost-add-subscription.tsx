"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { SubscriptionForm } from "@/features/subscriptions/components/subscription-form"
import { createSubscription } from "@/features/subscriptions/actions/create-subscription"
import type { ServiceOption } from "@/features/services/queries/get-service-options"

type Props = {
  projectId: string
  clientId: string
  serviceOptions: ServiceOption[]
}

function CostAddSubscription({ projectId, clientId, serviceOptions }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon />
        Añadir suscripción
      </Button>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Nueva suscripción"
        description="Suscripción recurrente vinculada a este proyecto."
      >
        <SubscriptionForm
          clientOptions={[]}
          serviceOptions={serviceOptions}
          defaultValues={{
            client_id: clientId,
            project_id: projectId,
            status: "active",
            billing_interval: "monthly",
          }}
          onSubmit={(values) => createSubscription({ ...values, client_id: clientId, project_id: projectId })}
          onSuccess={() => {
            toast.success("Suscripción creada.")
            setOpen(false)
            router.refresh()
          }}
        />
      </FormDrawer>
    </>
  )
}

export { CostAddSubscription }
