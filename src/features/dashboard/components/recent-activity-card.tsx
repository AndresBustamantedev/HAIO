import Link from "next/link"
import {
  ActivityIcon,
  ArrowRightIcon,
  CircleDollarSignIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GlobeIcon,
  ReceiptIcon,
  TicketIcon,
  UserPlusIcon,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import type { RecentActivityItem } from "@/features/dashboard/queries/get-dashboard-data"

const ENTITY_ICON: Record<string, React.ElementType> = {
  invoice: ReceiptIcon,
  client: UserPlusIcon,
  ticket: TicketIcon,
  payment: CircleDollarSignIcon,
  project: FolderKanbanIcon,
  domain: GlobeIcon,
  document: FileTextIcon,
}

const ENTITY_BG: Record<string, string> = {
  invoice: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  client: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  ticket: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  payment: "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  project: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  domain: "bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  document: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`
  if (diffDays === 1) {
    const time = new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    return `Ayer a las ${time}`
  }
  return `Hace ${diffDays} días`
}

function RecentActivityCard({ activity }: { activity: RecentActivityItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {activity.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="Sin actividad reciente"
            description="Los eventos aparecerán aquí cuando ocurran."
          />
        ) : (
          <>
            <ul className="flex flex-1 flex-col divide-y">
              {activity.map((item) => {
                const Icon = ENTITY_ICON[item.entity_type] ?? ActivityIcon
                const bg = ENTITY_BG[item.entity_type] ?? "bg-muted text-muted-foreground"

                return (
                  <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground line-clamp-2">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t pt-3">
              <Link
                href="/configuracion"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver toda la actividad
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { RecentActivityCard }
