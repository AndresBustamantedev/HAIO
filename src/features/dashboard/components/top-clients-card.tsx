import Link from "next/link"
import { ArrowRightIcon, TrophyIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import type { TopClient } from "@/features/dashboard/queries/get-dashboard-data"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value)
}

function TopClientsCard({ clients }: { clients: TopClient[] }) {
  const maxAmount = Math.max(...clients.map((c) => c.total_invoiced ?? 0), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Top clientes por facturación</CardTitle>
        <span className="text-xs text-muted-foreground">Este año</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {clients.length === 0 ? (
          <EmptyState
            icon={TrophyIcon}
            title="Sin datos de facturación"
            description="Los clientes con facturación aparecerán aquí."
          />
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-3">
              {clients.map((client, i) => {
                const amount = client.total_invoiced ?? 0
                const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0

                return (
                  <li key={client.client_id ?? i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground">
                          {i + 1}
                        </span>
                        <Link
                          href={client.client_id ? `/clientes/${client.client_id}` : "/clientes"}
                          className="truncate font-medium text-foreground hover:underline"
                        >
                          {client.display_name ?? "—"}
                        </Link>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t pt-3 mt-3">
              <Link
                href="/clientes"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Ver ranking completo
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { TopClientsCard }
