import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { ExternalLinkIcon, LayoutIcon } from "lucide-react"

type Props = { projectId: string }

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
}

export async function TabWordPress({ projectId }: Props) {
  const supabase = await createClient()

  const { data: installations } = await supabase
    .from("website_installations")
    .select("id, name, public_url, admin_url, cms_type, cms_version, status, notes, environment")
    .eq("project_id", projectId)
    .eq("cms_type", "wordpress")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const items = installations ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} instalaciones WordPress</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Sin instalaciones WordPress"
          description="No se encontraron instalaciones WordPress asociadas a este proyecto."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((inst) => (
            <li key={inst.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LayoutIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{inst.name}</span>
                    {inst.public_url ? (
                      <a href={inst.public_url} target="_blank" rel="noreferrer"
                         className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                        {inst.public_url}
                      </a>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[inst.status] ?? "bg-muted text-muted-foreground"}`}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {inst.cms_version ? <span>WP {inst.cms_version}</span> : null}
                    {inst.environment ? <span className="capitalize">{inst.environment}</span> : null}
                  </div>

                  {inst.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{inst.notes}</p>
                  ) : null}
                </div>

                {inst.admin_url ? (
                  <a href={inst.admin_url} target="_blank" rel="noreferrer"
                     className="flex items-center gap-1.5 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted/50">
                    <ExternalLinkIcon className="size-3.5" />
                    WP Admin
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
