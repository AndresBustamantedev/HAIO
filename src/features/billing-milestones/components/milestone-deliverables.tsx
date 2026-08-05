"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Circle, CircleDot, CircleCheck,
  Trash2Icon, PencilIcon, ExternalLinkIcon, PlusIcon, XIcon, CheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { createDeliverable } from "@/features/billing-milestones/actions/create-deliverable"
import { updateDeliverable } from "@/features/billing-milestones/actions/update-deliverable"
import { updateDeliverableStatus } from "@/features/billing-milestones/actions/update-deliverable-status"
import { deleteDeliverable } from "@/features/billing-milestones/actions/delete-deliverable"
import type { MilestoneDeliverable } from "@/features/billing-milestones/queries/get-milestone-detail"

type Status = "pending" | "in_progress" | "done"

function nextStatus(s: Status): Status {
  if (s === "pending") return "in_progress"
  if (s === "in_progress") return "done"
  return "pending"
}

function fmtDate(v: string | null) {
  if (!v) return null
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(v))
}

function StatusIcon({ status, onClick, disabled }: { status: Status; onClick: () => void; disabled?: boolean }) {
  const base = "shrink-0 transition-opacity cursor-pointer"
  if (status === "done") {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={`${base} text-green-600 dark:text-green-400 ${disabled ? "opacity-50" : "hover:opacity-70"}`}>
        <CircleCheck className="size-5" />
      </button>
    )
  }
  if (status === "in_progress") {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={`${base} text-violet-600 dark:text-violet-400 ${disabled ? "opacity-50" : "hover:opacity-70"}`}>
        <CircleDot className="size-5" />
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} text-muted-foreground/50 ${disabled ? "opacity-50" : "hover:text-muted-foreground"}`}>
      <Circle className="size-5" />
    </button>
  )
}

type EditForm = {
  name: string
  description: string
  due_date: string
  external_url: string
}

type Props = {
  milestoneId: string
  projectId: string
  deliverables: MilestoneDeliverable[]
}

export function MilestoneDeliverables({ milestoneId, projectId, deliverables: initial }: Props) {
  const router = useRouter()
  const [items, setItems] = React.useState<MilestoneDeliverable[]>(initial)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())

  // Sync when server refreshes props
  React.useEffect(() => { setItems(initial) }, [initial])

  // Add form
  const [adding, setAdding] = React.useState(false)
  const [addName, setAddName] = React.useState("")
  const [addDueDate, setAddDueDate] = React.useState("")
  const [addPending, setAddPending] = React.useState(false)

  // Edit drawer
  const [editing, setEditing] = React.useState<MilestoneDeliverable | null>(null)
  const [editForm, setEditForm] = React.useState<EditForm>({ name: "", description: "", due_date: "", external_url: "" })
  const [editPending, setEditPending] = React.useState(false)

  function openEdit(d: MilestoneDeliverable) {
    setEditing(d)
    setEditForm({
      name: d.name,
      description: d.description ?? "",
      due_date: d.due_date ?? "",
      external_url: d.external_url ?? "",
    })
  }

  async function handleStatusToggle(d: MilestoneDeliverable) {
    if (pendingIds.has(d.id)) return
    const next = nextStatus(d.status)
    setItems(prev => prev.map(i => i.id === d.id ? { ...i, status: next, completed_at: next === "done" ? new Date().toISOString() : null } : i))
    setPendingIds(prev => new Set(prev).add(d.id))
    const result = await updateDeliverableStatus(d.id, milestoneId, projectId, next)
    setPendingIds(prev => { const s = new Set(prev); s.delete(d.id); return s })
    if (result.error) {
      setItems(prev => prev.map(i => i.id === d.id ? { ...i, status: d.status, completed_at: d.completed_at } : i))
      toast.error(result.error)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim()) return
    setAddPending(true)
    const result = await createDeliverable(milestoneId, projectId, {
      name: addName.trim(),
      due_date: addDueDate || undefined,
    })
    setAddPending(false)
    if (result.error) { toast.error(result.error); return }
    setAddName("")
    setAddDueDate("")
    setAdding(false)
    router.refresh()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setEditPending(true)
    const result = await updateDeliverable(editing.id, milestoneId, projectId, {
      name: editForm.name,
      description: editForm.description || undefined,
      due_date: editForm.due_date || undefined,
      external_url: editForm.external_url || undefined,
    })
    setEditPending(false)
    if (result.error) { toast.error(result.error); return }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(d: MilestoneDeliverable) {
    setItems(prev => prev.filter(i => i.id !== d.id))
    const result = await deleteDeliverable(d.id, milestoneId, projectId)
    if (result.error) {
      router.refresh()
      toast.error(result.error)
    }
  }

  const done = items.filter(i => i.status === "done").length

  return (
    <>
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b">
          <p className="text-sm font-medium text-foreground">
            Entregables
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {done}/{items.length}
            </span>
          </p>
          {!adding && (
            <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
              <PlusIcon className="size-3.5" />
              Añadir
            </Button>
          )}
        </div>

        {items.length === 0 && !adding ? (
          <div className="px-4 py-5 text-sm text-muted-foreground">
            Sin entregables. Añade los hitos de trabajo que componen este hito.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 group">
                <StatusIcon
                  status={d.status}
                  onClick={() => handleStatusToggle(d)}
                  disabled={pendingIds.has(d.id)}
                />
                <span className={`flex-1 text-sm min-w-0 ${d.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {d.name}
                </span>
                {d.due_date && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(d.due_date)}
                  </span>
                )}
                {d.external_url && (
                  <Link
                    href={d.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </Link>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(d)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="border-t px-4 py-3 flex items-center gap-2">
            <input
              autoFocus
              value={addName}
              onChange={e => setAddName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
              placeholder="Nombre del entregable..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={addPending}
            />
            <input
              type="date"
              value={addDueDate}
              onChange={e => setAddDueDate(e.target.value)}
              className="text-xs text-muted-foreground bg-transparent outline-none border rounded px-2 py-1"
              disabled={addPending}
            />
            <button
              type="submit"
              disabled={!addName.trim() || addPending}
              className="p-1 rounded text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              <CheckIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setAddName(""); setAddDueDate("") }}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <XIcon className="size-4" />
            </button>
          </form>
        )}
      </div>

      {/* Edit drawer */}
      <FormDrawer
        open={editing !== null}
        onOpenChange={(open) => { if (!open) setEditing(null) }}
        title="Editar entregable"
        description={editing?.name}
      >
        <form onSubmit={handleEdit} className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              required
              disabled={editPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
              disabled={editPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha límite</label>
              <input
                type="date"
                value={editForm.due_date}
                onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                disabled={editPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">URL externa</label>
              <input
                type="url"
                value={editForm.external_url}
                onChange={e => setEditForm(f => ({ ...f, external_url: e.target.value }))}
                placeholder="https://..."
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                disabled={editPending}
              />
            </div>
          </div>
          <Button type="submit" disabled={editPending || !editForm.name.trim()}>
            {editPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </FormDrawer>
    </>
  )
}
