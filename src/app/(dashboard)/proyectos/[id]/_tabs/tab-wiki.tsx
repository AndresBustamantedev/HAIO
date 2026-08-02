import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { NoteActions } from "./note-actions"
import { NoteAddForm } from "./note-add-form"

type Props = { projectId: string; organizationId: string }

type ProjectNote = {
  id: string
  type: string
  title: string | null
  body: string
  pinned: boolean
  metadata: Record<string, string> | null
  created_at: string
  updated_at: string
}

function formatDateTime(v: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v))
}

export async function TabWiki({ projectId, organizationId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("project_notes")
    .select("id, type, title, body, pinned, metadata, created_at, updated_at")
    .eq("project_id", projectId)
    .in("type", ["wiki", "snippet"])
    .is("deleted_at", null)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })

  const notes = (data ?? []) as ProjectNote[]

  return (
    <div className="flex flex-col gap-4">
      <NoteAddForm
        projectId={projectId}
        organizationId={organizationId}
        defaultType="wiki"
        placeholder="Añade documentación técnica, configuración o runbook..."
      />

      {notes.length === 0 ? (
        <EmptyState
          title="Wiki vacía"
          description="Documenta arquitectura, runbooks y notas técnicas del proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {note.pinned ? <span className="text-amber-500 text-xs">📌 Fijada</span> : null}
                    {note.type === "snippet" ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {note.metadata?.language ?? "snippet"}
                      </span>
                    ) : null}
                    {note.title ? (
                      <span className="font-semibold text-foreground">{note.title}</span>
                    ) : null}
                  </div>
                  {note.type === "snippet" ? (
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                      {note.body}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Actualizado {formatDateTime(note.updated_at)}
                  </p>
                </div>
                <NoteActions
                  noteId={note.id}
                  projectId={projectId}
                  defaultValues={{ title: note.title ?? "", body: note.body, pinned: note.pinned }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
