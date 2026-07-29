"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { WebsiteInstallationForm } from "@/features/website-installations/components/website-installation-form"
import { createWebsiteInstallation } from "@/features/website-installations/actions/create-website-installation"
import { updateWebsiteInstallation } from "@/features/website-installations/actions/update-website-installation"
import type { WebsiteInstallation } from "@/features/website-installations/types"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  installation?: WebsiteInstallation
}

function WebsiteInstallationFormDrawer({ open, onOpenChange, clientOptions, installation }: Props) {
  const router = useRouter()
  const isEdit = !!installation

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar instalación web" : "Nueva instalación web"}
      description={isEdit ? installation.name : "Registra una instalación de CMS o aplicación web."}
    >
      <WebsiteInstallationForm
        clientOptions={clientOptions}
        defaultValues={
          installation
            ? {
                client_id: installation.client_id,
                name: installation.name,
                cms_type: installation.cms_type as never,
                cms_version: installation.cms_version ?? "",
                environment: installation.environment as never,
                status: installation.status as never,
                public_url: installation.public_url ?? "",
                admin_url: installation.admin_url ?? "",
                hosting_site_id: installation.hosting_site_id ?? "",
                domain_id: installation.domain_id ?? "",
                project_id: installation.project_id ?? "",
                notes: installation.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) =>
          isEdit ? updateWebsiteInstallation(installation.id, values) : createWebsiteInstallation(values)
        }
        onSuccess={() => {
          toast.success(isEdit ? "Instalación actualizada." : "Instalación creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear instalación"}
      />
    </FormDrawer>
  )
}

export { WebsiteInstallationFormDrawer }
