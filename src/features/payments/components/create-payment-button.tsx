"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PaymentFormDrawer } from "@/features/payments/components/payment-form-drawer"
import type { ClientOption } from "@/features/payments/types"
import type { InvoiceOption } from "@/features/payments/queries/get-invoice-options"

function CreatePaymentButton({ clientOptions, invoiceOptions }: { clientOptions: ClientOption[]; invoiceOptions: InvoiceOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Registrar pago
      </Button>
      <PaymentFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} invoiceOptions={invoiceOptions} />
    </>
  )
}

export { CreatePaymentButton }
