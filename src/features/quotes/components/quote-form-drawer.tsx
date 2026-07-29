"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { QuoteForm } from "@/features/quotes/components/quote-form"
import { createQuote } from "@/features/quotes/actions/create-quote"
import { updateQuote } from "@/features/quotes/actions/update-quote"
import type { ClientOption, QuoteDetail } from "@/features/quotes/types"

type QuoteFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  quoteDetail?: QuoteDetail
}

function QuoteFormDrawer({ open, onOpenChange, clientOptions, quoteDetail }: QuoteFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!quoteDetail

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar presupuesto" : "Nuevo presupuesto"}
      description={isEdit ? quoteDetail.quote.quote_number : "Crea un presupuesto para un cliente."}
    >
      <QuoteForm
        clientOptions={clientOptions}
        defaultValues={
          quoteDetail
            ? {
                client_id: quoteDetail.quote.client_id,
                status: quoteDetail.quote.status,
                issue_date: quoteDetail.quote.issue_date,
                valid_until: quoteDetail.quote.valid_until ?? "",
                terms: quoteDetail.quote.terms ?? "",
                notes: quoteDetail.quote.notes ?? "",
                items: quoteDetail.items.map((item) => ({
                  description: item.description,
                  quantity: String(item.quantity),
                  unit_price: String(item.unit_price),
                  tax_rate: String(item.tax_rate),
                  discount_percent: String(item.discount_percent),
                })),
              }
            : undefined
        }
        onSubmit={(values) => (isEdit ? updateQuote(quoteDetail.quote.id, values) : createQuote(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Presupuesto actualizado." : "Presupuesto creado.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear presupuesto"}
      />
    </FormDrawer>
  )
}

export { QuoteFormDrawer }
