"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { CredentialForm } from "@/features/credentials/components/credential-form"
import { createCredential } from "@/features/credentials/actions/create-credential"
import { updateCredential } from "@/features/credentials/actions/update-credential"
import type { ClientOption, CredentialSafeWithClient } from "@/features/credentials/types"

type CredentialFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  credential?: CredentialSafeWithClient
}

function CredentialFormDrawer({ open, onOpenChange, clientOptions, credential }: CredentialFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!credential

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar credencial" : "Nueva credencial"}
      description={isEdit ? (credential.label ?? "Editar credencial") : "Registra una credencial de acceso."}
    >
      <CredentialForm
        clientOptions={clientOptions}
        defaultValues={
          credential
            ? {
                label: credential.label ?? "",
                type: credential.type ?? "other",
                client_id: credential.client_id ?? "",
                username: credential.username ?? "",
                login_url: credential.login_url ?? "",
                secret_reference: credential.secret_reference ?? "",
                expires_at: credential.expires_at ?? "",
                is_shared_with_client: credential.is_shared_with_client ?? false,
                notes: credential.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateCredential(credential.id!, values) : createCredential(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Credencial actualizada." : "Credencial creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear credencial"}
      />
    </FormDrawer>
  )
}

export { CredentialFormDrawer }
