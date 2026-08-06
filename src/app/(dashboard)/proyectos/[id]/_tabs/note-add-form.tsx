"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, ChevronUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createProjectNote } from "@/features/project-notes/actions/create-project-note"

type NoteType = "note" | "wiki" | "changelog" | "snippet"

const DIARIO_TYPES: { value: NoteType; label: string }[] = [
  { value: "changelog", label: "Cambio" },
  { value: "note",      label: "Nota" },
]

const TYPE_ACTIVE_CLASS: Record<string, string> = {
  changelog: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  note:      "bg-muted text-foreground",
}

const DIARIO_TAGS = [
  "Incidencia", "Deploy", "Reunión", "Decisión", "Hotfix", "Mantenimiento",
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  projectId: string
  organizationId: string
  defaultType: NoteType
  placeholder?: string
}

export function NoteAddForm({ projectId, organizationId: _, defaultType, placeholder }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<NoteType>(defaultType)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [entryDate, setEntryDate] = React.useState(todayISO)
  const [tags, setTags] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  const showTypeSelector = defaultType === "changelog" || defaultType === "note"
  const showDate = showTypeSelector

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handleClose() {
    setExpanded(false)
    setSelectedType(defaultType)
    setTitle("")
    setBody("")
    setEntryDate(todayISO())
    setTags([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const metadata: Record<string, unknown> = {}
      if (tags.length > 0) metadata.tags = tags

      const result = await createProjectNote({
        project_id: projectId,
        type: selectedType,
        title: title.trim() || undefined,
        body: body.trim(),
        entry_date: showDate ? entryDate : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata as Record<string, string> : undefined,
      })
      if (result.error) { toast.error(result.error); return }
      handleClose()
      toast.success("Nota añadida.")
      router.refresh()
    })
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
        <PlusIcon className="mr-1.5 size-4" />
        Nueva entrada
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {showTypeSelector && (
        <>
          {/* Type toggle */}
          <div className="flex gap-1">
            {DIARIO_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedType(value)}
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selectedType === value
                    ? TYPE_ACTIVE_CLASS[value]
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {label}
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
                  tags.includes(tag)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {tag}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Input
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm flex-1"
        />
        {showDate && (
          <Input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="text-sm w-40 shrink-0"
          />
        )}
      </div>

      <Textarea
        placeholder={placeholder ?? "Escribe aquí..."}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="text-sm"
        autoFocus
      />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
          <ChevronUpIcon className="mr-1 size-4" />
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
