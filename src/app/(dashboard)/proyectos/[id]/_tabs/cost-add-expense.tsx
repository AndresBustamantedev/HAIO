"use client"

import * as React from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProjectExpense } from "@/features/project-expenses/actions/create-project-expense"

const CATEGORIES = [
  { value: "hosting",     label: "Hosting" },
  { value: "domain",      label: "Dominio" },
  { value: "license",     label: "Licencia" },
  { value: "tool",        label: "Herramienta" },
  { value: "design",      label: "Diseño" },
  { value: "development", label: "Desarrollo" },
  { value: "other",       label: "Otro" },
] as const

const today = () => new Date().toISOString().slice(0, 10)

export function CostAddExpense({ projectId, milestoneId, defaultCategory, onSuccess }: { projectId: string; milestoneId?: string; defaultCategory?: string; onSuccess?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const [description, setDescription] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [currency, setCurrency] = React.useState("EUR")
  const [category, setCategory] = React.useState<string>(defaultCategory ?? "other")
  const [date, setDate] = React.useState(today())
  const [notes, setNotes] = React.useState("")

  function reset() {
    setDescription("")
    setAmount("")
    setCurrency("EUR")
    setCategory("other")
    setDate(today())
    setNotes("")
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createProjectExpense(projectId, {
        description,
        amount: parseFloat(amount) || 0,
        currency_code: currency,
        category: category as Parameters<typeof createProjectExpense>[1]["category"],
        incurred_at: date,
        notes,
        milestone_id: milestoneId,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto añadido.")
        reset()
        onSuccess?.()
      }
    })
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-1.5 size-4" />
        Añadir gasto
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border bg-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Nuevo gasto</p>
        <button type="button" onClick={reset} className="text-muted-foreground hover:text-foreground">
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <Label htmlFor="exp-desc">Descripción *</Label>
          <Input
            id="exp-desc"
            placeholder="Renovación dominio, plugin premium..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-amount">Importe *</Label>
          <div className="flex gap-2">
            <Input
              id="exp-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-category">Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="exp-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-date">Fecha</Label>
          <Input
            id="exp-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-notes">Notas</Label>
          <Input
            id="exp-notes"
            placeholder="Opcional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={pending || !description || !amount}>
          {pending ? "Guardando..." : "Guardar gasto"}
        </Button>
      </div>
    </form>
  )
}
