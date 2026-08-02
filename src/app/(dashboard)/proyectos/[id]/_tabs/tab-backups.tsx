import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { ShieldIcon } from "lucide-react"

type Props = { projectId: string }

function formatDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v))
}

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
  failed:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily:   "Diario",
  weekly:  "Semanal",
  monthly: "Mensual",
  manual:  "Manual",
}

export async function TabBackups({ projectId }: Props) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("backup_configurations")
    .select("id, name, provider_name, frequency, retention_days, status, last_run_at, next_run_at")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("name")

  const items = data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} configuraciones de backup</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Sin backups configurados"
          description="Configura backups para este proyecto desde la infraestructura."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((b) => (
            <li key={b.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{b.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[b.status] ?? "bg-muted text-muted-foreground"}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Proveedor: {b.provider_name}</span>
                    <span>Frecuencia: {FREQUENCY_LABEL[b.frequency] ?? b.frequency}</span>
                    <span>Retención: {b.retention_days} días</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Último: {formatDate(b.last_run_at)}</span>
                    <span>Próximo: {formatDate(b.next_run_at)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
