"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { deleteQuote } from "@/features/quotes/actions/delete-quote"
import type { QuoteWithClient } from "@/features/quotes/types"

function QuoteRowActions({ quote }: { quote: QuoteWithClient }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/presupuestos/${quote.id}`} />}>
            <EyeIcon />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={quote.quote_number}
        onConfirm={async () => {
          const result = await deleteQuote(quote.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Presupuesto eliminado.")
          router.refresh()
        }}
      />
    </>
  )
}

export { QuoteRowActions }
