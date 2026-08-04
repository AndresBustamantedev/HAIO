import { redirect } from "next/navigation"
import { MailIcon, CalendarIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { getPortalEmails } from "@/features/email-accounts/queries/get-portal-emails"
import { StatusBadge } from "@/components/common/status-badge"

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "destructive"> = {
  active: "success", pending: "warning", suspended: "destructive",
  cancelled: "neutral", expired: "destructive",
}
const STATUS_LABEL: Record<string, string> = {
  active: "Activo", pending: "Pendiente", suspended: "Suspendido",
  cancelled: "Cancelado", expired: "Expirado",
}
const ACCOUNT_STATUS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  active: "success", inactive: "neutral", suspended: "warning",
}
const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  active: "Activa", inactive: "Inactiva", suspended: "Suspendida",
}

export default async function PortalCorreosPage() {
  const session = await getPortalSession()
  if (!session) redirect("/login")

  const services = await getPortalEmails(session.access.client_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Correos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cuentas de correo asociadas a tu servicio.</p>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
          <MailIcon className="size-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium text-foreground">Sin correos disponibles</p>
          <p className="mt-1 text-sm text-muted-foreground">Tu proveedor aún no ha compartido información de correos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((svc) => (
            <div key={svc.id} className="overflow-hidden rounded-xl border bg-card">
              {/* Service header */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/30 px-5 py-3">
                <span className="font-semibold text-foreground">{svc.provider_name}</span>
                {svc.plan_name && (
                  <span className="text-xs text-muted-foreground">{svc.plan_name}</span>
                )}
                <StatusBadge
                  tone={STATUS_TONE[svc.status] ?? "neutral"}
                  label={STATUS_LABEL[svc.status] ?? svc.status}
                />
                {svc.expires_on && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    Vence {formatDate(svc.expires_on)}
                  </span>
                )}
              </div>

              {/* Accounts */}
              {svc.accounts.length === 0 ? (
                <p className="px-5 py-3 text-sm text-muted-foreground">Sin buzones en este servicio.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-5 py-2 text-left font-medium">Dirección</th>
                      <th className="px-3 py-2 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {svc.accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-2.5">
                          <div>
                            <span className="font-medium text-foreground">{account.address}</span>
                            {account.display_name && (
                              <span className="ml-2 text-xs text-muted-foreground">{account.display_name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge
                            tone={ACCOUNT_STATUS_TONE[account.status] ?? "neutral"}
                            label={ACCOUNT_STATUS_LABEL[account.status] ?? account.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
