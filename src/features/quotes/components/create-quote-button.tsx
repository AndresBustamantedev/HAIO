"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuoteFormDrawer } from "@/features/quotes/components/quote-form-drawer"
import type { ClientOption } from "@/features/quotes/types"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

function CreateQuoteButton({ clientOptions, projectOptions }: { clientOptions: ClientOption[]; projectOptions?: ProjectOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuevo presupuesto
      </Button>
      <QuoteFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} projectOptions={projectOptions} />
    </>
  )
}

export { CreateQuoteButton }
