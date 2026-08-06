"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { HostingForm } from "@/features/hosting/components/hosting-form"
import { createHosting } from "@/features/hosting/actions/create-hosting"
import { updateHosting } from "@/features/hosting/actions/update-hosting"
import type { ClientOption, HostingWithClient } from "@/features/hosting/types"

type ProjectOption = { id: string; name: string; client_id: string }

type HostingFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  projectOptions?: ProjectOption[]
  hosting?: HostingWithClient
  defaultClientId?: string
  defaultProjectId?: string
}

function HostingFormDrawer({ open, onOpenChange, clientOptions, projectOptions, hosting, defaultClientId, defaultProjectId }: HostingFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!hosting

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar hosting" : "Nuevo hosting"}
      description={isEdit ? hosting.provider_name : "Registra una cuenta de hosting para un cliente."}
    >
      <HostingForm
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        defaultValues={
          hosting
            ? {
                client_id: hosting.client_id,
                provider_name: hosting.provider_name,
                plan_name: hosting.plan_name ?? "",
                status: hosting.status,
                panel_url: hosting.panel_url ?? "",
                server_hostname: hosting.server_hostname ?? "",
                starts_on: hosting.starts_on ?? "",
                expires_on: hosting.expires_on ?? "",
                renewal_price: hosting.renewal_price != null ? String(hosting.renewal_price) : "",
                auto_renew: hosting.auto_renew,
                notes: hosting.notes ?? "",
              }
            : defaultClientId
              ? { client_id: defaultClientId, project_id: defaultProjectId ?? "" }
              : undefined
        }
        onSubmit={(values) => (isEdit ? updateHosting(hosting.id, values) : createHosting(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Hosting actualizado." : "Hosting creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear hosting"}
      />
    </FormDrawer>
  )
}

export { HostingFormDrawer }
