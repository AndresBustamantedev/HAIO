"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InvoiceFormDrawer } from "@/features/invoices/components/invoice-form-drawer"
import type { ClientOption, InvoiceDetail } from "@/features/invoices/types"

function EditInvoiceButton({ invoiceDetail, clientOptions }: { invoiceDetail: InvoiceDetail; clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <InvoiceFormDrawer open={open} onOpenChange={setOpen} invoiceDetail={invoiceDetail} clientOptions={clientOptions} />
    </>
  )
}

export { EditInvoiceButton }
