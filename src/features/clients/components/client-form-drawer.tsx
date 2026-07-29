"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ClientForm } from "@/features/clients/components/client-form"
import { createClient } from "@/features/clients/actions/create-client"
import { updateClient } from "@/features/clients/actions/update-client"
import type { Client } from "@/features/clients/types"

type ClientFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit for create mode; pass the client being edited for edit mode. */
  client?: Client
  onSaved?: () => void
}

/** Single source of truth for the create/edit client drawer, used by the list toolbar, row actions, and the detail page. */
function ClientFormDrawer({ open, onOpenChange, client, onSaved }: ClientFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!client

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      description={isEdit ? client.display_name : "Crea una ficha de cliente."}
    >
      <ClientForm
        defaultValues={
          client
            ? {
                display_name: client.display_name,
                type: client.type,
                status: client.status,
                legal_name: client.legal_name ?? "",
                tax_id: client.tax_id ?? "",
                email: client.email ?? "",
                phone: client.phone ?? "",
                website: client.website ?? "",
                city: client.city ?? "",
                notes: client.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateClient(client.id, values) : createClient(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Cliente actualizado." : "Cliente creado.")
          onOpenChange(false)
          onSaved?.()
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear cliente"}
      />
    </FormDrawer>
  )
}

export { ClientFormDrawer }
