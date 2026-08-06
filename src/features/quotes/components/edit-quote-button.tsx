"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuoteFormDrawer } from "@/features/quotes/components/quote-form-drawer"
import type { ClientOption, QuoteDetail } from "@/features/quotes/types"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

function EditQuoteButton({ quoteDetail, clientOptions, projectOptions }: { quoteDetail: QuoteDetail; clientOptions: ClientOption[]; projectOptions?: ProjectOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PencilIcon />
        Editar
      </Button>
      <QuoteFormDrawer open={open} onOpenChange={setOpen} quoteDetail={quoteDetail} clientOptions={clientOptions} projectOptions={projectOptions} />
    </>
  )
}

export { EditQuoteButton }
