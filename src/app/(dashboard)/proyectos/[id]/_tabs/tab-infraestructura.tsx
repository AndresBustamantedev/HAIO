import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { ExternalLinkIcon, GlobeIcon, MailIcon, ServerIcon } from "lucide-react"

type Props = { projectId: string; clientId: string }

function formatDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive:  "bg-muted text-muted-foreground",
  expired:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  suspended: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

export async function TabInfrastructura({ projectId, clientId }: Props) {
  const supabase = await createClient()

  const [domainsRes, hostingRes, emailsRes, websitesRes] = await Promise.all([
    supabase
      .from("domains")
      .select("id, domain_name, status, expires_on, registrar_name, nameservers")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("domain_name"),
    supabase
      .from("hosting_accounts")
      .select("id, provider_name, plan_name, status, expires_on, server_ip, server_hostname, panel_url")
      .or(`project_id.eq.${projectId},client_id.eq.${clientId}`)
      .is("deleted_at", null),
    supabase
      .from("email_services")
      .select("id, provider_name, plan_name, status, expires_on")
      .eq("client_id", clientId)
      .is("deleted_at", null),
    supabase
      .from("website_installations")
      .select("id, name, public_url, admin_url, cms_type, cms_version, status")
      .eq("project_id", projectId)
      .is("deleted_at", null),
  ])

  const domains = domainsRes.data ?? []
  const hosting = hostingRes.data ?? []
  const emails = emailsRes.data ?? []
  const websites = websitesRes.data ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Dominios */}
      <Section title={`Dominios (${domains.length})`} icon={<GlobeIcon className="size-4" />}>
        {domains.length === 0 ? (
          <EmptyState title="Sin dominios" description="No hay dominios asignados a este proyecto. Edita un dominio del cliente para asignarlo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Dominio</th>
                  <th className="pb-2 text-left font-medium">Registrar</th>
                  <th className="pb-2 text-left font-medium">Vence</th>
                  <th className="pb-2 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{d.domain_name}</td>
                    <td className="py-2.5 text-muted-foreground">{d.registrar_name ?? "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(d.expires_on)}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[d.status] ?? "bg-muted text-muted-foreground"}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Hosting */}
      <Section title={`Hosting (${hosting.length})`} icon={<ServerIcon className="size-4" />}>
        {hosting.length === 0 ? (
          <EmptyState title="Sin hosting" description="No hay cuentas de hosting asociadas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Proveedor</th>
                  <th className="pb-2 text-left font-medium">Plan</th>
                  <th className="pb-2 text-left font-medium">Servidor</th>
                  <th className="pb-2 text-left font-medium">Vence</th>
                </tr>
              </thead>
              <tbody>
                {hosting.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-foreground">
                      {h.panel_url ? (
                        <a href={h.panel_url} target="_blank" rel="noreferrer" className="hover:underline">{h.provider_name}</a>
                      ) : h.provider_name}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{h.plan_name ?? "—"}</td>
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">
                      {h.server_hostname ?? (h.server_ip ? String(h.server_ip) : "—")}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(h.expires_on)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Email */}
      <Section title={`Email (${emails.length})`} icon={<MailIcon className="size-4" />}>
        {emails.length === 0 ? (
          <EmptyState title="Sin servicios de email" />
        ) : (
          <ul className="divide-y">
            {emails.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-foreground">{e.provider_name}</span>
                <span className="text-muted-foreground">{e.plan_name ?? "—"} · vence {formatDate(e.expires_on)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Instalaciones web */}
      <Section title={`Instalaciones web (${websites.length})`} icon={<ExternalLinkIcon className="size-4" />}>
        {websites.length === 0 ? (
          <EmptyState title="Sin instalaciones web" />
        ) : (
          <ul className="divide-y">
            {websites.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{w.name}</span>
                    {w.public_url ? (
                      <a href={w.public_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
                        {w.public_url}
                      </a>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.cms_type?.toUpperCase() ?? "—"} {w.cms_version ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {w.admin_url ? (
                    <a href={w.admin_url} target="_blank" rel="noreferrer"
                       className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted/50">
                      <ExternalLinkIcon className="size-3" /> Admin
                    </a>
                  ) : null}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[w.status] ?? "bg-muted text-muted-foreground"}`}>
                    {w.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-1.5">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      {children}
    </div>
  )
}
