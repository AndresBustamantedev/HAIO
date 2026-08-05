"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { FormDrawer } from "@/components/common/form-drawer"
import { ClientServiceForm } from "@/features/client-services/components/client-service-form"
import { deleteClientService } from "@/features/client-services/actions/delete-client-service"
import { updateClientService } from "@/features/client-services/actions/update-client-service"
import type { ServiceOption } from "@/features/services/queries/get-service-options"
import type { ClientServiceInput } from "@/features/client-services/schemas/client-service-schema"

type ServiceData = {
  service_id: string
  name_override: string | null
  unit_price: number
  quantity: number
  currency_code: string
  billing_interval: string | null
  starts_on: string | null
  ends_on: string | null
  notes: string | null
}

type ClientServiceActionsProps = {
  id: string
  clientId: string
  projectId?: string
  service?: ServiceData
  serviceOptions?: ServiceOption[]
  label?: string
}

function ClientServiceActions({ id, clientId, projectId, service, serviceOptions, label }: ClientServiceActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const canEdit = !!service && !!serviceOptions

  const editDefaultValues: Partial<ClientServiceInput> | undefined = service
    ? {
        service_id: service.service_id,
        name_override: service.name_override ?? "",
        unit_price: String(service.unit_price),
        quantity: String(service.quantity),
        currency_code: service.currency_code,
        billing_interval: (service.billing_interval as ClientServiceInput["billing_interval"]) ?? "",
        starts_on: service.starts_on ?? "",
        ends_on: service.ends_on ?? "",
        notes: service.notes ?? "",
      }
    : undefined

  if (!canEdit) {
    // Backward-compatible: solo delete inline
    return (
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={isPending}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        aria-label="Eliminar servicio"
      >
        <Trash2Icon className="size-3.5" />
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemLabel={label ?? "este servicio"}
          onConfirm={async () => {
            const result = await deleteClientService(id, clientId)
            if (result.error) { toast.error(result.error); return }
            toast.success("Servicio eliminado.")
            router.refresh()
          }}
        />
      </button>
    )
  }

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
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar servicio contratado"
        description={service.name_override ?? label ?? "Modifica los detalles del servicio."}
      >
        <ClientServiceForm
          serviceOptions={serviceOptions!}
          defaultValues={editDefaultValues}
          onSubmit={(values) => updateClientService(id, clientId, values, projectId)}
          onSuccess={() => {
            toast.success("Servicio actualizado.")
            setEditOpen(false)
            router.refresh()
          }}
          submitLabel="Guardar cambios"
        />
      </FormDrawer>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={label ?? "este servicio"}
        onConfirm={async () => {
          const result = await deleteClientService(id, clientId)
          if (result.error) { toast.error(result.error); return }
          toast.success("Servicio eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { ClientServiceActions }
