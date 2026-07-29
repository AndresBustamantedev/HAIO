import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { getClientStatusBadge } from "@/features/clients/utils/status"
import type { Database } from "@/types/database.types"
type RecentClient = { id: string; display_name: string; status: Database["public"]["Enums"]["client_status"] | null; created_at: string }

function RecentClientsCard({ clients }: { clients: RecentClient[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clientes recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Todavía no hay clientes"
            description="Los clientes que crees aparecerán aquí."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {clients.map((client) => {
              const badge = client.status ? getClientStatusBadge(client.status) : null

              return (
                <li key={client.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link
                    href={`/clientes/${client.id}`}
                    className="truncate font-medium text-foreground hover:underline"
                  >
                    {client.display_name}
                  </Link>
                  {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export { RecentClientsCard }
