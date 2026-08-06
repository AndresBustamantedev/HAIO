import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { WikiAddForm } from "./wiki-add-form"
import { WikiNoteCard } from "./wiki-note-card"

type Props = { projectId: string; organizationId: string }

type WikiMeta = { language?: string; url?: string; tags?: string[] }

type ProjectNote = {
  id: string
  type: string
  title: string | null
  body: string
  pinned: boolean
  metadata: WikiMeta | null
  created_at: string
  updated_at: string
  created_by: string | null
  entry_date: string | null
}

type Profile = { id: string; full_name: string | null; first_name: string | null }

function formatDate(v: string) {
  const [year, month, day] = v.split("-").map(Number)
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(year, month - 1, day))
}

function formatTimestamp(v: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v))
}

function getAuthorName(profile: Profile | undefined) {
  if (!profile) return "Desconocido"
  return profile.full_name?.trim() || profile.first_name?.trim() || "Usuario"
}

export async function TabWiki({ projectId, organizationId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("project_notes")
    .select("id, type, title, body, pinned, metadata, created_at, updated_at, created_by, entry_date")
    .eq("project_id", projectId)
    .in("type", ["wiki", "snippet"])
    .is("deleted_at", null)
    .order("pinned", { ascending: false })
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })

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
      <WikiAddForm projectId={projectId} organizationId={organizationId} />

      {notes.length === 0 ? (
        <EmptyState
          title="Wiki vacía"
          description="Documenta arquitectura, runbooks y notas técnicas del proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => {
            const profile = note.created_by ? profileMap.get(note.created_by) : undefined
            const name = getAuthorName(profile)
            const initial = name.charAt(0).toUpperCase()
            const displayDate = note.entry_date
              ? formatDate(note.entry_date)
              : formatTimestamp(note.updated_at)

            return (
              <WikiNoteCard
                key={note.id}
                noteId={note.id}
                projectId={projectId}
                type={note.type}
                title={note.title}
                body={note.body}
                pinned={note.pinned}
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
