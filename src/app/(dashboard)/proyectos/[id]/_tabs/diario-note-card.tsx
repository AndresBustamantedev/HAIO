"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProjectNote } from "@/features/project-notes/actions/update-project-note"
import { deleteProjectNote } from "@/features/project-notes/actions/delete-project-note"

type DiarioType = "changelog" | "note"

const TYPE_LABEL: Record<DiarioType, string> = {
  changelog: "Cambio",
  note:      "Nota",
}

const TYPE_COLOR: Record<DiarioType, string> = {
  changelog: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  note:      "bg-muted text-muted-foreground",
}

const DIARIO_TAGS = [
  "Incidencia", "Deploy", "Reunión", "Decisión", "Hotfix", "Mantenimiento",
]

type DiarioMeta = { tags?: string[] }

type Props = {
  noteId: string
  projectId: string
  type: string
  title: string | null
  body: string
  metadata: DiarioMeta | null
  entryDate: string | null
  displayDate: string
  authorName: string
  authorInitial: string
}

export function DiarioNoteCard({
  noteId, projectId, type, title, body,
  metadata, entryDate, displayDate, authorName, authorInitial,
}: Props) {
  const [editing, setEditing] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const initType: DiarioType = type === "note" ? "note" : "changelog"
  const [editType, setEditType] = React.useState<DiarioType>(initType)
  const [editTitle, setEditTitle] = React.useState(title ?? "")
  const [editBody, setEditBody] = React.useState(body)
  const [editDate, setEditDate] = React.useState(entryDate ?? "")
  const [editTags, setEditTags] = React.useState<string[]>(metadata?.tags ?? [])

  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()
  const router = useRouter()

  const displayTags = metadata?.tags ?? []
  const noteType: DiarioType = type === "note" ? "note" : "changelog"

  function toggleTag(tag: string) {
    setEditTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handleCancel() {
    setEditing(false)
    setEditType(initType)
    setEditTitle(title ?? "")
    setEditBody(body)
    setEditDate(entryDate ?? "")
    setEditTags(metadata?.tags ?? [])
  }

  function handleSave() {
    if (!editBody.trim()) return
    startTransition(async () => {
      const newMeta: Record<string, unknown> = {}
      if (editTags.length > 0) newMeta.tags = editTags

      const result = await updateProjectNote(noteId, projectId, {
        type: editType,
        title: editTitle.trim() || undefined,
        body: editBody.trim(),
        entry_date: editDate || undefined,
        metadata: newMeta as Record<string, string>,
      })
      if (result.error) { toast.error(result.error); return }
      setEditing(false)
      toast.success("Nota actualizada.")
      router.refresh()
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteProjectNote(noteId, projectId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Nota eliminada.")
      router.refresh()
    })
  }

  // ── Edit mode ──────────────────────────────────────────────
  if (editing) {
    return (
      <li className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3">
          {/* Type toggle */}
          <div className="flex gap-1">
            {(["changelog", "note"] as DiarioType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEditType(t)}
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  editType === t
                    ? TYPE_COLOR[t]
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {DIARIO_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={[
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                  editTags.includes(tag)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Title + date */}
          <div className="flex gap-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título (opcional)"
              className="text-sm flex-1"
              autoFocus
            />
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="text-sm w-40 shrink-0"
            />
          </div>

          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={5}
            className="text-sm"
          />

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={isPending || !editBody.trim()}>
              <CheckIcon className="mr-1.5 size-4" />
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <XIcon className="mr-1.5 size-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </li>
    )
  }

  // ── Display mode ───────────────────────────────────────────
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[noteType]}`}>
              {TYPE_LABEL[noteType]}
            </span>
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-xs text-primary"
              >
                {tag}
              </span>
            ))}
            {title ? <span className="font-semibold text-foreground">{title}</span> : null}
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{body}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {authorInitial}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{authorName}</span>
              {" · "}
              {displayDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 rounded-lg border bg-destructive/10 px-2 py-1">
              <span className="text-xs text-destructive">¿Eliminar?</span>
              <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "..." : "Sí"}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar">
                <PencilIcon className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} title="Eliminar">
                <Trash2Icon className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
