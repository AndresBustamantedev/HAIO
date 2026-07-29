"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { InvoiceForm } from "@/features/invoices/components/invoice-form"
import { createInvoice } from "@/features/invoices/actions/create-invoice"
import { updateInvoice } from "@/features/invoices/actions/update-invoice"
import type { ClientOption, InvoiceDetail } from "@/features/invoices/types"

type InvoiceFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  invoiceDetail?: InvoiceDetail
}

function InvoiceFormDrawer({ open, onOpenChange, clientOptions, invoiceDetail }: InvoiceFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!invoiceDetail

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar factura" : "Nueva factura"}
      description={isEdit ? invoiceDetail.invoice.invoice_number : "Crea una factura para un cliente."}
    >
      <InvoiceForm
        clientOptions={clientOptions}
        defaultValues={
          invoiceDetail
            ? {
                client_id: invoiceDetail.invoice.client_id,
                status: invoiceDetail.invoice.status,
                issue_date: invoiceDetail.invoice.issue_date,
                due_date: invoiceDetail.invoice.due_date ?? "",
                notes: invoiceDetail.invoice.notes ?? "",
                items: invoiceDetail.items.map((item) => ({
                  description: item.description,
                  quantity: String(item.quantity),
                  unit_price: String(item.unit_price),
                  tax_rate: String(item.tax_rate),
                  discount_percent: String(item.discount_percent),
                })),
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateInvoice(invoiceDetail.invoice.id, values) : createInvoice(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Factura actualizada." : "Factura creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear factura"}
      />
    </FormDrawer>
  )
}

export { InvoiceFormDrawer }
