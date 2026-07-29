"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { ContactForm } from "@/features/contacts/components/contact-form"
import { createContact } from "@/features/contacts/actions/create-contact"
import { updateContact } from "@/features/contacts/actions/update-contact"
import type { ClientOption, ContactWithClient } from "@/features/contacts/types"

type ContactFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  contact?: ContactWithClient
}

function ContactFormDrawer({ open, onOpenChange, clientOptions, contact }: ContactFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!contact

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar contacto" : "Nuevo contacto"}
      description={isEdit ? contact.full_name : "Añade un contacto a un cliente."}
    >
      <ContactForm
        clientOptions={clientOptions}
        defaultValues={
          contact
            ? {
                client_id: contact.client_id,
                full_name: contact.full_name,
                job_title: contact.job_title ?? "",
                department: contact.department ?? "",
                email: contact.email ?? "",
                phone: contact.phone ?? "",
                mobile: contact.mobile ?? "",
                is_primary: contact.is_primary,
                receives_billing: contact.receives_billing,
                receives_support: contact.receives_support,
                notes: contact.notes ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateContact(contact.id, values) : createContact(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Contacto actualizado." : "Contacto creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear contacto"}
      />
    </FormDrawer>
  )
}

export { ContactFormDrawer }
