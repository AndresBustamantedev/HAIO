"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon, LinkIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProjectNote } from "@/features/project-notes/actions/update-project-note"
import { deleteProjectNote } from "@/features/project-notes/actions/delete-project-note"

type WikiType = "wiki" | "snippet"

const WIKI_TAGS = [
  "Arquitectura", "Runbook", "Configuración", "API", "Base de datos",
  "Seguridad", "Despliegue", "Frontend", "Backend", "Servidor",
  "DNS", "SSL", "Proceso", "Tutorial",
]

type WikiMeta = {
  language?: string
  url?: string
  tags?: string[]
}

type Props = {
  noteId: string
  projectId: string
  type: string
  title: string | null
  body: string
  pinned: boolean
  metadata: WikiMeta | null
  entryDate: string | null
  displayDate: string
  authorName: string
  authorInitial: string
}

export function WikiNoteCard({
  noteId, projectId, type, title, body, pinned,
  metadata, entryDate, displayDate, authorName, authorInitial,
}: Props) {
  const [editing, setEditing] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const initType: WikiType = type === "snippet" ? "snippet" : "wiki"
  const [editType, setEditType] = React.useState<WikiType>(initType)
  const [editTitle, setEditTitle] = React.useState(title ?? "")
  const [editBody, setEditBody] = React.useState(body)
  const [editUrl, setEditUrl] = React.useState(metadata?.url ?? "")
  const [editLanguage, setEditLanguage] = React.useState(metadata?.language ?? "")
  const [editTags, setEditTags] = React.useState<string[]>(metadata?.tags ?? [])
  const [editDate, setEditDate] = React.useState(entryDate ?? "")

  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()
  const router = useRouter()

  function toggleTag(tag: string) {
    setEditTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handleCancel() {
    setEditing(false)
    setEditType(initType)
    setEditTitle(title ?? "")
    setEditBody(body)
    setEditUrl(metadata?.url ?? "")
    setEditLanguage(metadata?.language ?? "")
    setEditTags(metadata?.tags ?? [])
    setEditDate(entryDate ?? "")
  }

  function handleSave() {
    if (!editBody.trim()) return
    startTransition(async () => {
      const newMeta: Record<string, unknown> = {}
      if (editTags.length > 0) newMeta.tags = editTags
      if (editUrl.trim()) newMeta.url = editUrl.trim()
      if (editType === "snippet" && editLanguage.trim()) newMeta.language = editLanguage.trim()

      const result = await updateProjectNote(noteId, projectId, {
        type: editType,
        title: editTitle.trim() || undefined,
        body: editBody.trim(),
        entry_date: editDate || undefined,
        metadata: newMeta as Record<string, string>,
      })
      if (result.error) { toast.error(result.error); return }
      setEditing(false)
      toast.success("Entrada actualizada.")
      router.refresh()
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteProjectNote(noteId, projectId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Entrada eliminada.")
      router.refresh()
    })
  }

  const displayTags = metadata?.tags ?? []
  const displayUrl = metadata?.url
  const displayLanguage = metadata?.language

  // ── Edit mode ──────────────────────────────────────────────
  if (editing) {
    return (
      <li className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3">
          {/* Type toggle */}
          <div className="flex gap-1">
            {(["wiki", "snippet"] as WikiType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEditType(t)}
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  editType === t
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                ].join(" ")}
              >
                {t === "wiki" ? "Wiki" : "Snippet"}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {WIKI_TAGS.map((tag) => (
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

          {/* Language (snippet only) */}
          {editType === "snippet" && (
            <Input
              placeholder="Lenguaje (ej. javascript, bash, sql...)"
              value={editLanguage}
              onChange={(e) => setEditLanguage(e.target.value)}
              className="text-sm"
            />
          )}

          {/* URL */}
          <div className="relative">
            <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Enlace de referencia (opcional)"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="text-sm pl-8"
            />
          </div>

          {/* Body */}
          {editType === "snippet" ? (
            <textarea
              rows={6}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
            />
          ) : (
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={5}
              className="text-sm"
            />
          )}

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
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {pinned && <span className="text-amber-500 text-xs">📌</span>}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {type === "snippet"
                ? (displayLanguage ?? "Snippet")
                : "Wiki"}
            </span>
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/30 bg-primary/8 px-2 py-0.5 text-xs text-primary"
              >
                {tag}
              </span>
            ))}
            {title && <span className="font-semibold text-foreground">{title}</span>}
          </div>

          {/* Body */}
          {type === "snippet" ? (
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
              {body}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
          )}

          {/* Link */}
          {displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLinkIcon className="size-3" />
              {(() => { try { return new URL(displayUrl).hostname } catch { return displayUrl } })()}
            </a>
          )}

          {/* Footer */}
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

        {/* Actions */}
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
