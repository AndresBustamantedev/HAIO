import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { NoteAddForm } from "./note-add-form"
import { DiarioNoteCard } from "./diario-note-card"

type Props = { projectId: string; organizationId: string }

type DiarioMeta = { tags?: string[] }

type ProjectNote = {
  id: string
  type: string
  title: string | null
  body: string
  pinned: boolean
  metadata: DiarioMeta | null
  created_at: string
  updated_at: string
  created_by: string | null
  entry_date: string | null
}

type Profile = { id: string; full_name: string | null; first_name: string | null }

function formatTimestamp(v: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(v))
}

function formatEntryDate(v: string) {
  const [year, month, day] = v.split("-").map(Number)
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(year, month - 1, day))
}

function getAuthorName(profile: Profile | undefined): string {
  if (!profile) return "Desconocido"
  return profile.full_name?.trim() || profile.first_name?.trim() || "Usuario"
}

export async function TabDiario({ projectId, organizationId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("project_notes")
    .select("id, type, title, body, pinned, metadata, created_at, updated_at, created_by, entry_date")
    .eq("project_id", projectId)
    .in("type", ["note", "changelog"])
    .is("deleted_at", null)
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  const notes = (data ?? []) as ProjectNote[]

  const authorIds = [...new Set(notes.map((n) => n.created_by).filter(Boolean))] as string[]
  const profileMap = new Map<string, Profile>()
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, first_name")
      .in("id", authorIds)
    ;(profiles ?? []).forEach((p) => profileMap.set(p.id, p as Profile))
  }

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
          {notes.map((note) => {
            const profile = note.created_by ? profileMap.get(note.created_by) : undefined
            const name = getAuthorName(profile)
            const initial = name.charAt(0).toUpperCase()
            const displayDate = note.entry_date
              ? formatEntryDate(note.entry_date)
              : formatTimestamp(note.created_at)

            return (
              <DiarioNoteCard
                key={note.id}
                noteId={note.id}
                projectId={projectId}
                type={note.type}
                title={note.title}
                body={note.body}
                metadata={note.metadata}
                entryDate={note.entry_date}
                displayDate={displayDate}
                authorName={name}
                authorInitial={initial}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}
