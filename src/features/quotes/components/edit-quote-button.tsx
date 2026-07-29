"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuoteFormDrawer } from "@/features/quotes/components/quote-form-drawer"
import type { ClientOption, QuoteDetail } from "@/features/quotes/types"

function EditQuoteButton({ quoteDetail, clientOptions }: { quoteDetail: QuoteDetail; clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <QuoteFormDrawer open={open} onOpenChange={setOpen} quoteDetail={quoteDetail} clientOptions={clientOptions} />
    </>
  )
}

export { EditQuoteButton }
