"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, ChevronUpIcon, LinkIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createProjectNote } from "@/features/project-notes/actions/create-project-note"

type WikiType = "wiki" | "snippet"

const WIKI_TAGS = [
  "Arquitectura", "Runbook", "Configuración", "API", "Base de datos",
  "Seguridad", "Despliegue", "Frontend", "Backend", "Servidor",
  "DNS", "SSL", "Proceso", "Tutorial",
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type Props = { projectId: string; organizationId: string }

export function WikiAddForm({ projectId, organizationId: _ }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [type, setType] = React.useState<WikiType>("wiki")
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [entryDate, setEntryDate] = React.useState(todayISO)
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handleClose() {
    setExpanded(false)
    setType("wiki")
    setTitle("")
    setBody("")
    setUrl("")
    setLanguage("")
    setTags([])
    setEntryDate(todayISO())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const metadata: Record<string, unknown> = {}
      if (tags.length > 0) metadata.tags = tags
      if (url.trim()) metadata.url = url.trim()
      if (type === "snippet" && language.trim()) metadata.language = language.trim()

      const result = await createProjectNote({
        project_id: projectId,
        type,
        title: title.trim() || undefined,
        body: body.trim(),
        entry_date: entryDate || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata as Record<string, string> : undefined,
      })
      if (result.error) { toast.error(result.error); return }
      handleClose()
      toast.success("Entrada añadida.")
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
      {/* Type toggle */}
      <div className="flex gap-1">
        {(["wiki", "snippet"] as WikiType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
              type === t
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
              tags.includes(tag)
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
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm flex-1"
        />
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="text-sm w-40 shrink-0"
        />
      </div>

      {/* Language (only for snippet) */}
      {type === "snippet" && (
        <Input
          placeholder="Lenguaje (ej. javascript, bash, sql...)"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm"
        />
      )}

      {/* URL */}
      <div className="relative">
        <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          type="url"
          placeholder="Enlace de referencia (opcional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-sm pl-8"
        />
      </div>

      {/* Body */}
      {type === "snippet" ? (
        <textarea
          placeholder="Pega tu código aquí..."
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y"
          autoFocus
        />
      ) : (
        <Textarea
          placeholder="Documenta arquitectura, runbooks, configuraciones..."
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="text-sm"
          autoFocus
        />
      )}

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
