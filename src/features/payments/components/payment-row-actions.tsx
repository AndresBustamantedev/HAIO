"use client"

import * as React from "react"
import { MoreHorizontalIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PaymentFormDrawer } from "@/features/payments/components/payment-form-drawer"
import type { ClientOption, PaymentWithRelations } from "@/features/payments/types"
import type { InvoiceOption } from "@/features/payments/queries/get-invoice-options"

function PaymentRowActions({
  payment,
  clientOptions,
  invoiceOptions,
}: {
  payment: PaymentWithRelations
  clientOptions: ClientOption[]
  invoiceOptions: InvoiceOption[]
}) {
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PaymentFormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        payment={payment}
        clientOptions={clientOptions}
        invoiceOptions={invoiceOptions}
      />
    </>
  )
}

export { PaymentRowActions }
