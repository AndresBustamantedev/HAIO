"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deleteProjectExpense } from "@/features/project-expenses/actions/delete-project-expense"

export function CostExpenseActions({ expenseId, projectId }: { expenseId: string; projectId: string }) {
  const [pending, startTransition] = React.useTransition()

  function handleDelete() {
    if (!confirm("¿Eliminar este gasto?")) return
    startTransition(async () => {
      const result = await deleteProjectExpense(expenseId, projectId)
      if (result.error) toast.error(result.error)
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      title="Eliminar gasto"
    >
      <Trash2Icon className="size-4" />
    </button>
  )
}
