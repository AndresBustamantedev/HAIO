import { UserIcon, CalendarIcon } from "lucide-react"

import { StatusBadge } from "@/components/common/status-badge"
import { EmailAccountRowActions } from "@/features/email-accounts/components/email-account-row-actions"
import { RevealPasswordButton } from "@/features/email-accounts/components/reveal-password-button"
import { PortalVisibilityToggle } from "@/features/email-services/components/portal-visibility-toggle"
import type { ClientEmailGroup } from "@/features/email-accounts/queries/get-email-accounts-by-client"
import type { EmailServiceOption } from "@/features/email-accounts/types"

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "destructive"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  cancelled: "neutral",
  expired: "destructive",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  suspended: "Suspendido",
  cancelled: "Cancelado",
  expired: "Expirado",
}

const ACCOUNT_STATUS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  suspended: "warning",
}

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  suspended: "Suspendida",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  )
}

export function ClientEmailsSection({
  group,
  serviceOptions,
}: {
  group: ClientEmailGroup
  serviceOptions: EmailServiceOption[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Client header */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
        <UserIcon className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">{group.client_name}</h2>
        <span className="text-xs text-muted-foreground">
          ({group.services.reduce((n, s) => n + s.accounts.length, 0)} buzones)
        </span>
      </div>

      {group.services.map((svc, si) => (
        <div key={svc.id} className={si > 0 ? "border-t" : undefined}>
          {/* Service subheader */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-muted/20 px-5 py-2.5">
            <span className="text-sm font-medium text-foreground">{svc.provider_name}</span>
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
            <div className="ml-auto">
              <PortalVisibilityToggle serviceId={svc.id} visible={svc.visible_in_portal} />
            </div>
          </div>

          {/* Accounts table */}
          {svc.accounts.length === 0 ? (
            <p className="px-5 py-3 text-sm text-muted-foreground">Sin buzones en este servicio.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-5 py-2 text-left font-medium">Dirección</th>
                  <th className="px-3 py-2 text-left font-medium">Contraseña</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="w-10 px-3 py-2" />
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
                      {account.has_password ? (
                        <RevealPasswordButton accountId={account.id} />
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        tone={ACCOUNT_STATUS_TONE[account.status] ?? "neutral"}
                        label={ACCOUNT_STATUS_LABEL[account.status] ?? account.status}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <EmailAccountRowActions
                        account={{
                          id: account.id,
                          address: account.address,
                          display_name: account.display_name,
                          status: account.status,
                          quota_mb: account.quota_mb,
                          forwards_to: account.forwards_to,
                          notes: account.notes,
                          email_service_id: svc.id,
                          organization_id: "",
                          deleted_at: null,
                          created_at: "",
                          updated_at: "",
                        }}
                        serviceOptions={serviceOptions}
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
  )
}
