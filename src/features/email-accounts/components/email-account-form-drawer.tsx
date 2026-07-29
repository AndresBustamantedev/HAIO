"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { EmailAccountForm } from "@/features/email-accounts/components/email-account-form"
import { createEmailAccount } from "@/features/email-accounts/actions/create-email-account"
import { updateEmailAccount } from "@/features/email-accounts/actions/update-email-account"
import type { EmailAccount, EmailServiceOption } from "@/features/email-accounts/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOptions: EmailServiceOption[]
  account?: EmailAccount
}

function EmailAccountFormDrawer({ open, onOpenChange, serviceOptions, account }: Props) {
  const router = useRouter()
  const isEdit = !!account

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar cuenta de correo" : "Nueva cuenta de correo"}
      description={isEdit ? account.address : "Registra un buzón de correo en un servicio."}
    >
      <EmailAccountForm
        serviceOptions={serviceOptions}
        defaultValues={
          account
            ? {
                email_service_id: account.email_service_id,
                address: account.address,
                display_name: account.display_name ?? "",
                status: account.status as "active" | "inactive" | "suspended",
                quota_mb: account.quota_mb != null ? String(account.quota_mb) : "",
                forwards_to: account.forwards_to.join(", "),
                notes: account.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateEmailAccount(account.id, values) : createEmailAccount(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Cuenta actualizada." : "Cuenta creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear cuenta"}
      />
    </FormDrawer>
  )
}

export { EmailAccountFormDrawer }
