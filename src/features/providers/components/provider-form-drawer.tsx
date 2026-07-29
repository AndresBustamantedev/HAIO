"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ProviderForm } from "@/features/providers/components/provider-form"
import { createProvider } from "@/features/providers/actions/create-provider"
import { updateProvider } from "@/features/providers/actions/update-provider"
import type { Provider } from "@/features/providers/types"

type ProviderFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: Provider
}

function ProviderFormDrawer({ open, onOpenChange, provider }: ProviderFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!provider

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      description={isEdit ? provider.name : "Añade una empresa proveedora al catálogo."}
    >
      <ProviderForm
        defaultValues={
          provider
            ? {
                name: provider.name,
                category: provider.category,
                website: provider.website ?? "",
                support_url: provider.support_url ?? "",
                notes: provider.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateProvider(provider.id, values) : createProvider(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Proveedor actualizado." : "Proveedor creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear proveedor"}
      />
    </FormDrawer>
  )
}

export { ProviderFormDrawer }
