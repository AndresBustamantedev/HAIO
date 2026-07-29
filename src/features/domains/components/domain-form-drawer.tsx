"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { DomainForm } from "@/features/domains/components/domain-form"
import { createDomain } from "@/features/domains/actions/create-domain"
import { updateDomain } from "@/features/domains/actions/update-domain"
import type { ClientOption, DomainWithClient } from "@/features/domains/types"

type DomainFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  domain?: DomainWithClient
}

function DomainFormDrawer({ open, onOpenChange, clientOptions, domain }: DomainFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!domain

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar dominio" : "Nuevo dominio"}
      description={isEdit ? domain.domain_name : "Registra un dominio para un cliente."}
    >
      <DomainForm
        clientOptions={clientOptions}
        defaultValues={
          domain
            ? {
                client_id: domain.client_id,
                domain_name: domain.domain_name,
                status: domain.status,
                registrar_name: domain.registrar_name ?? "",
                registered_on: domain.registered_on ?? "",
                expires_on: domain.expires_on ?? "",
                renewal_price: domain.renewal_price != null ? String(domain.renewal_price) : "",
                auto_renew: domain.auto_renew,
                managed_by_us: domain.managed_by_us,
                privacy_enabled: domain.privacy_enabled,
                notes: domain.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateDomain(domain.id, values) : createDomain(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Dominio actualizado." : "Dominio creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear dominio"}
      />
    </FormDrawer>
  )
}

export { DomainFormDrawer }
