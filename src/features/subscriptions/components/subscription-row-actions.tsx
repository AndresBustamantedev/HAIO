"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BanIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { SubscriptionFormDrawer } from "@/features/subscriptions/components/subscription-form-drawer"
import { cancelSubscription } from "@/features/subscriptions/actions/cancel-subscription"
import type { ClientOption, ProjectOption, ServiceOption, SubscriptionWithRelations } from "@/features/subscriptions/types"

function SubscriptionRowActions({
  subscription,
  clientOptions,
  serviceOptions,
  projectOptions,
}: {
  subscription: SubscriptionWithRelations
  clientOptions: ClientOption[]
  serviceOptions: ServiceOption[]
  projectOptions?: ProjectOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          {subscription.status !== "cancelled" ? (
            <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
              <BanIcon />
              Cancelar
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <SubscriptionFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        subscription={subscription}
        clientOptions={clientOptions}
        serviceOptions={serviceOptions}
        projectOptions={projectOptions}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar suscripción"
        description={`Se cancelará la suscripción a "${subscription.services?.name ?? "este servicio"}".`}
        confirmLabel="Cancelar suscripción"
        confirmVariant="destructive"
        onConfirm={async () => {
          const result = await cancelSubscription(subscription.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Suscripción cancelada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { SubscriptionRowActions }
