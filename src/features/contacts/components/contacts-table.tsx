import Link from "next/link"
import { StarIcon } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/tables/data-table"
import { ContactRowActions } from "@/features/contacts/components/contact-row-actions"
import type { ClientOption, ContactWithClient } from "@/features/contacts/types"

function buildColumns(): DataTableColumn<ContactWithClient>[] {
  return [
    {
      key: "full_name",
      header: "Contacto",
      cell: (contact) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{contact.full_name}</span>
          {contact.is_primary ? <StarIcon className="size-3.5 fill-warning text-warning" /> : null}
        </div>
      ),
    },
    {
      key: "client",
      header: "Cliente",
      cell: (contact) =>
        contact.clients ? (
          <Link href={`/clientes/${contact.clients.id}`} className="text-muted-foreground hover:underline">
            {contact.clients.display_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "job_title",
      header: "Cargo",
      cell: (contact) => <span className="text-muted-foreground">{contact.job_title ?? "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      cell: (contact) => <span className="text-muted-foreground">{contact.email ?? "—"}</span>,
    },
    {
      key: "phone",
      header: "Teléfono",
      cell: (contact) => <span className="text-muted-foreground">{contact.phone ?? contact.mobile ?? "—"}</span>,
    },
  ]
}

function ContactsTable({ contacts, clientOptions }: { contacts: ContactWithClient[]; clientOptions: ClientOption[] }) {
  return (
    <DataTable
      columns={buildColumns()}
      rows={contacts}
      getRowId={(contact) => contact.id}
      rowActions={(contact) => <ContactRowActions contact={contact} clientOptions={clientOptions} />}
      emptyTitle="Todavía no hay contactos"
      emptyDescription="Añade contactos desde aquí o desde la ficha de cada cliente."
    />
  )
}

export { ContactsTable }
