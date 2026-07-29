"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ProviderAccountForm } from "@/features/providers/components/provider-account-form"
import { createProviderAccount } from "@/features/providers/actions/create-provider-account"
import { updateProviderAccount } from "@/features/providers/actions/update-provider-account"
import type { Provider, ProviderAccount } from "@/features/providers/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: Pick<Provider, "id" | "name">[]
  account?: ProviderAccount
}

function ProviderAccountFormDrawer({ open, onOpenChange, providers, account }: Props) {
  const router = useRouter()
  const isEdit = !!account

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar cuenta de proveedor" : "Nueva cuenta de proveedor"}
      description={isEdit ? account.label : "Añade una cuenta gestionada en un proveedor."}
    >
      <ProviderAccountForm
        providers={providers}
        defaultValues={
          account
            ? {
                provider_id: account.provider_id,
                label: account.label,
                account_reference: account.account_reference ?? "",
                notes: account.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateProviderAccount(account.id, values) : createProviderAccount(values))}
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

export { ProviderAccountFormDrawer }
