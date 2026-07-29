"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ServiceForm } from "@/features/services/components/service-form"
import { createService } from "@/features/services/actions/create-service"
import { updateService } from "@/features/services/actions/update-service"
import type { Service } from "@/features/services/types"

type ServiceFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
}

function ServiceFormDrawer({ open, onOpenChange, service }: ServiceFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!service

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar servicio" : "Nuevo servicio"}
      description={isEdit ? service.name : "Añade un servicio al catálogo."}
    >
      <ServiceForm
        defaultValues={
          service
            ? {
                name: service.name,
                code: service.code,
                category: service.category,
                billing_type: service.billing_type,
                default_interval: service.default_interval ?? "",
                default_price: service.default_price != null ? String(service.default_price) : "",
                tax_rate: String(service.tax_rate),
                description: service.description ?? "",
                is_active: service.is_active,
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateService(service.id, values) : createService(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Servicio actualizado." : "Servicio creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear servicio"}
      />
    </FormDrawer>
  )
}

export { ServiceFormDrawer }
