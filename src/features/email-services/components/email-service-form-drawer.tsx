"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { EmailServiceForm } from "@/features/email-services/components/email-service-form"
import { createEmailService } from "@/features/email-services/actions/create-email-service"
import { updateEmailService } from "@/features/email-services/actions/update-email-service"
import type { ClientOption, EmailServiceWithClient } from "@/features/email-services/types"

type EmailServiceFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  emailService?: EmailServiceWithClient
}

function EmailServiceFormDrawer({ open, onOpenChange, clientOptions, emailService }: EmailServiceFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!emailService

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar servicio de correo" : "Nuevo servicio de correo"}
      description={isEdit ? emailService.provider_name : "Registra un servicio de correo para un cliente."}
    >
      <EmailServiceForm
        clientOptions={clientOptions}
        defaultValues={
          emailService
            ? {
                client_id: emailService.client_id,
                provider_name: emailService.provider_name,
                plan_name: emailService.plan_name ?? "",
                status: emailService.status,
                starts_on: emailService.starts_on ?? "",
                expires_on: emailService.expires_on ?? "",
                renewal_price: emailService.renewal_price != null ? String(emailService.renewal_price) : "",
                auto_renew: emailService.auto_renew,
                notes: emailService.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateEmailService(emailService.id, values) : createEmailService(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Servicio de correo actualizado." : "Servicio de correo creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear servicio"}
      />
    </FormDrawer>
  )
}

export { EmailServiceFormDrawer }
