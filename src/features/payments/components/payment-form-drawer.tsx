"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { PaymentForm } from "@/features/payments/components/payment-form"
import { createPayment } from "@/features/payments/actions/create-payment"
import { updatePayment } from "@/features/payments/actions/update-payment"
import type { ClientOption, PaymentWithRelations } from "@/features/payments/types"
import type { InvoiceOption } from "@/features/payments/queries/get-invoice-options"

type PaymentFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  invoiceOptions: InvoiceOption[]
  payment?: PaymentWithRelations
}

function PaymentFormDrawer({ open, onOpenChange, clientOptions, invoiceOptions, payment }: PaymentFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!payment

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar pago" : "Registrar pago"}
      description={isEdit ? payment.reference ?? "Pago" : "Registra un pago recibido de un cliente."}
    >
      <PaymentForm
        clientOptions={clientOptions}
        invoiceOptions={invoiceOptions}
        defaultValues={
          payment
            ? {
                client_id: payment.client_id,
                invoice_id: payment.invoice_id ?? "",
                amount: String(payment.amount),
                method: payment.method,
                status: payment.status,
                paid_at: payment.paid_at ?? "",
                reference: payment.reference ?? "",
                failure_reason: payment.failure_reason ?? "",
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updatePayment(payment.id, values) : createPayment(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Pago actualizado." : "Pago registrado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Registrar pago"}
      />
    </FormDrawer>
  )
}

export { PaymentFormDrawer }
