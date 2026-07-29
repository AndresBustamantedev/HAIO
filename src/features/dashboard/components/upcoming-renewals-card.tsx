import { CalendarClockIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { Badge } from "@/components/ui/badge"
import type { UpcomingRenewal } from "@/features/dashboard/queries/get-dashboard-data"

const ENTITY_LABEL: Record<string, string> = {
  domain: "Dominio",
  hosting_account: "Hosting",
  email_service: "Correo",
  client_service: "Servicio",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function UpcomingRenewalsCard({ renewals }: { renewals: UpcomingRenewal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Próximos vencimientos</CardTitle>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <EmptyState
            icon={CalendarClockIcon}
            title="Sin vencimientos próximos"
            description="No hay dominios, hosting ni servicios por renovar en el corto plazo."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {renewals.map((renewal) => (
              <li
                key={`${renewal.entity_type}-${renewal.entity_id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {renewal.reference ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {renewal.entity_type ? ENTITY_LABEL[renewal.entity_type] ?? renewal.entity_type : "—"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">
                    {renewal.expires_on ? formatDate(renewal.expires_on) : "—"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { UpcomingRenewalsCard }
