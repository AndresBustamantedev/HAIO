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
  created_at: string
  updated_at: string
}

function formatDateTime(v: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(v))
}

const TYPE_LABEL: Record<string, string> = {
  changelog: "Cambio",
  note:      "Nota",
}

const TYPE_COLOR: Record<string, string> = {
  changelog: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  note:      "bg-muted text-muted-foreground",
}

export async function TabDiario({ projectId, organizationId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("project_notes")
    .select("id, type, title, body, pinned, created_at, updated_at")
    .eq("project_id", projectId)
    .in("type", ["note", "changelog"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const notes = (data ?? []) as ProjectNote[]

  return (
    <div className="flex flex-col gap-4">
      <NoteAddForm
        projectId={projectId}
        organizationId={organizationId}
        defaultType="changelog"
        placeholder="¿Qué cambió hoy? Documenta despliegues, incidentes, decisiones..."
      />

      {notes.length === 0 ? (
        <EmptyState
          title="Diario vacío"
          description="Registra cambios, despliegues e incidencias del proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[note.type] ?? "bg-muted text-muted-foreground"}`}>
                      {TYPE_LABEL[note.type] ?? note.type}
                    </span>
                    {note.title ? (
                      <span className="font-semibold text-foreground">{note.title}</span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.body}</p>
                </div>
                <NoteActions
                  noteId={note.id}
                  projectId={projectId}
                  defaultValues={{ title: note.title ?? "", body: note.body, pinned: false }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
