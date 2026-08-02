"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { updateProjectNote } from "@/features/project-notes/actions/update-project-note"
import { deleteProjectNote } from "@/features/project-notes/actions/delete-project-note"

type Props = {
  noteId: string
  projectId: string
  defaultValues: { title: string; body: string; pinned: boolean }
}

export function NoteActions({ noteId, projectId, defaultValues }: Props) {
  const [editing, setEditing] = React.useState(false)
  const [title, setTitle] = React.useState(defaultValues.title)
  const [body, setBody] = React.useState(defaultValues.body)
  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()
  const router = useRouter()

  function handleSave() {
    if (!body.trim()) return
    startTransition(async () => {
      const result = await updateProjectNote(noteId, projectId, {
        title: title.trim() || undefined,
        body: body.trim(),
        pinned: defaultValues.pinned,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setEditing(false)
      toast.success("Nota actualizada.")
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm("¿Eliminar esta nota?")) return
    startDelete(async () => {
      const result = await deleteProjectNote(noteId, projectId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Nota eliminada.")
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 w-full mt-2 border-t pt-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="text-sm"
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending || !body.trim()}>
            <CheckIcon className="mr-1 size-4" />
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(defaultValues.title); setBody(defaultValues.body) }}>
            <XIcon className="mr-1 size-4" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar">
        <PencilIcon className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Eliminar">
        <Trash2Icon className="size-4 text-destructive" />
      </Button>
    </div>
  )
}
