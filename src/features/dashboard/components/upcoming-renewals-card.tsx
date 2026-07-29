import Link from "next/link"
import { ArrowRightIcon, CalendarClockIcon, GlobeIcon, MailIcon, ServerIcon, ZapIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import type { UpcomingRenewal } from "@/features/dashboard/queries/get-dashboard-data"

const ENTITY_LABEL: Record<string, string> = {
  domain: "Dominio",
  hosting_account: "Hosting",
  email_service: "Correo",
  client_service: "Servicio",
}

const ENTITY_ICON: Record<string, React.ElementType> = {
  domain: GlobeIcon,
  hosting_account: ServerIcon,
  email_service: MailIcon,
  client_service: ZapIcon,
}

const ENTITY_COLOR: Record<string, string> = {
  domain: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  hosting_account: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  email_service: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  client_service: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function UpcomingRenewalsCard({ renewals }: { renewals: UpcomingRenewal[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Próximos vencimientos</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" render={<Link href="/dominios" />}>
          Ver calendario
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {renewals.length === 0 ? (
          <EmptyState
            icon={CalendarClockIcon}
            title="Sin vencimientos próximos"
            description="No hay renovaciones pendientes en el corto plazo."
          />
        ) : (
          <>
            <ul className="flex flex-1 flex-col divide-y">
              {renewals.map((renewal) => {
                const entityType = renewal.entity_type ?? "client_service"
                const Icon = ENTITY_ICON[entityType] ?? ZapIcon
                const colorClass = ENTITY_COLOR[entityType] ?? ENTITY_COLOR.client_service
                const days = renewal.expires_on ? daysUntil(renewal.expires_on) : null
                const urgent = days !== null && days <= 30

                return (
                  <li
                    key={`${renewal.entity_type}-${renewal.entity_id}`}
                    className="flex items-center gap-3 py-3 text-sm"
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {renewal.reference ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ENTITY_LABEL[entityType] ?? entityType}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {renewal.expires_on ? formatDate(renewal.expires_on) : "—"}
                      </span>
                      {days !== null ? (
                        <span
                          className={`text-xs font-medium ${urgent ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          en {days} día{days !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t pt-3">
              <Link
                href="/dominios"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver todos los vencimientos
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { UpcomingRenewalsCard }
