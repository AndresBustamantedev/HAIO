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

type Props = {
  projectId: string
  organizationId: string
  defaultType: NoteType
  placeholder?: string
}

export function NoteAddForm({ projectId, organizationId: _, defaultType, placeholder }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    startTransition(async () => {
      const result = await createProjectNote({
        project_id: projectId,
        type: defaultType,
        title: title.trim() || undefined,
        body: body.trim(),
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setTitle("")
      setBody("")
      setExpanded(false)
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
      <Input
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-sm"
      />
      <Textarea
        placeholder={placeholder ?? "Escribe aquí..."}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
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
