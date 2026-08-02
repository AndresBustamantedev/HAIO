"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteClientService } from "@/features/client-services/actions/delete-client-service"

type ClientServiceActionsProps = {
  id: string
  clientId: string
}

function ClientServiceActions({ id, clientId }: ClientServiceActionsProps) {
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm("¿Eliminar este servicio contratado?")) return
    startTransition(async () => {
      const result = await deleteClientService(id, clientId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Servicio eliminado.")
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
      aria-label="Eliminar servicio"
    >
      <Trash2Icon className="size-3.5" />
    </button>
  )
}

export { ClientServiceActions }
