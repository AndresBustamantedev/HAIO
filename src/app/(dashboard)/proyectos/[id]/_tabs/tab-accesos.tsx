import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { MemberActions } from "./member-actions"
import { MemberAddForm } from "./member-add-form"

type Props = { projectId: string; organizationId: string }

type ProjectMember = {
  id: string
  name: string
  email: string | null
  role: "owner" | "developer" | "designer" | "marketing" | "client" | "seo" | "other"
  notes: string | null
}

const ROLE_LABELS: Record<string, string> = {
  owner:      "Propietario",
  developer:  "Desarrollador",
  designer:   "Diseñador",
  marketing:  "Marketing",
  client:     "Cliente",
  seo:        "SEO",
  other:      "Otro",
}

export async function TabAccesos({ projectId, organizationId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("project_members")
    .select("id, name, email, role, notes")
    .eq("project_id", projectId)
    .order("role")
    .order("name")

  const members = (data ?? []) as ProjectMember[]

  return (
    <div className="flex flex-col gap-4">
      <MemberAddForm projectId={projectId} organizationId={organizationId} />

      {members.length === 0 ? (
        <EmptyState
          title="Sin equipo registrado"
          description="Añade las personas que tienen acceso o forman parte del proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                  </div>
                  {m.email ? (
                    <a href={`mailto:${m.email}`} className="mt-0.5 block text-sm text-muted-foreground hover:underline">
                      {m.email}
                    </a>
                  ) : null}
                  {m.notes ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">{m.notes}</p>
                  ) : null}
                </div>
                <MemberActions
                  memberId={m.id}
                  projectId={projectId}
                  defaultValues={{ name: m.name, email: m.email ?? "", role: m.role, notes: m.notes ?? "" }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
