"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteProjectExpense } from "@/features/project-expenses/actions/delete-project-expense"

export function CostExpenseActions({ expenseId, projectId }: { expenseId: string; projectId: string }) {
  const [confirming, setConfirming] = React.useState(false)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProjectExpense(expenseId, projectId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Gasto eliminado.")
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border bg-destructive/10 px-2 py-0.5">
        <span className="text-xs text-destructive">¿Eliminar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {pending ? "..." : "Sí"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
      title="Eliminar gasto"
    >
      <Trash2Icon className="size-4" />
    </button>
  )
}
