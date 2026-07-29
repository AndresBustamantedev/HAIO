"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InvoiceFormDrawer } from "@/features/invoices/components/invoice-form-drawer"
import type { ClientOption } from "@/features/invoices/types"

function CreateInvoiceButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva factura
      </Button>
      <InvoiceFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateInvoiceButton }
