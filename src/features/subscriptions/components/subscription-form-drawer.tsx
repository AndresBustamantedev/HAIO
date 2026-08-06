"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { SubscriptionForm } from "@/features/subscriptions/components/subscription-form"
import { createSubscription } from "@/features/subscriptions/actions/create-subscription"
import { updateSubscription } from "@/features/subscriptions/actions/update-subscription"
import type { ClientOption, ProjectOption, ServiceOption, SubscriptionWithRelations } from "@/features/subscriptions/types"

type SubscriptionFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  serviceOptions: ServiceOption[]
  projectOptions?: ProjectOption[]
  subscription?: SubscriptionWithRelations
}

function SubscriptionFormDrawer({ open, onOpenChange, clientOptions, serviceOptions, projectOptions, subscription }: SubscriptionFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!subscription

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar suscripción" : "Nueva suscripción"}
      description={isEdit ? subscription.services?.name ?? "Suscripción" : "Crea una suscripción recurrente para un cliente."}
    >
      <SubscriptionForm
        clientOptions={clientOptions}
        serviceOptions={serviceOptions}
        projectOptions={projectOptions}
        defaultValues={
          subscription
            ? {
                client_id: subscription.client_id,
                service_id: subscription.service_id,
                project_id: subscription.project_id ?? "",
                status: subscription.status,
                billing_interval: subscription.billing_interval,
                amount: String(subscription.amount),
                current_period_start: subscription.current_period_start ?? "",
                current_period_end: subscription.current_period_end ?? "",
                cancel_at: subscription.cancel_at ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateSubscription(subscription.id, values) : createSubscription(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Suscripción actualizada." : "Suscripción creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear suscripción"}
      />
    </FormDrawer>
  )
}

export { SubscriptionFormDrawer }
