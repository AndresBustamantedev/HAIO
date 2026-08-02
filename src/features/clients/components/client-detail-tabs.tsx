"use client"

import Link from "next/link"
import {
  GlobeIcon,
  ServerIcon,
  MailIcon,
  MonitorIcon,
  KeyRoundIcon,
  DatabaseBackupIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ExternalLinkIcon,
  ArrowRightIcon,
} from "lucide-react"

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { RevealCredentialButton } from "@/features/credentials/components/reveal-credential-button"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import { AddClientServiceButton } from "@/features/client-services/components/add-client-service-button"
import { ClientServiceActions } from "@/features/client-services/components/client-service-actions"
import type { ClientDetail } from "@/features/clients/queries/get-client-detail"
import type { ServiceOption } from "@/features/services/queries/get-service-options"

// ----- Helpers -----

function fmt(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function fmtCurrency(value: number | null, currency?: string | null): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency ?? "EUR" }).format(value ?? 0)
}

function daysUntil(dateStr: string | null): { label: string; past: boolean } | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.round((target.getTime() - now.getTime()) / 86_400_000)
  if (diff >= 0) return { label: `en ${diff} días`, past: false }
  return { label: `hace ${Math.abs(diff)} días`, past: true }
}

function getOverallStatus(
  domains: ClientDetail["domains"],
  hostingAccounts: ClientDetail["hostingAccounts"]
): { label: string; description: string; tone: "success" | "warning" | "destructive" } {
  const allItems = [
    ...domains.map((d) => d.status),
    ...hostingAccounts.map((h) => h.status),
  ]
  if (allItems.some((s) => s === "expired" || s === "cancelled")) {
    return { label: "Crítico", description: "Recursos caducados", tone: "destructive" }
  }
  const WARN_DAYS = 30
  const now = Date.now()
  const nearExpiry = [
    ...domains.map((d) => d.expires_on),
    ...hostingAccounts.map((h) => h.expires_on),
  ].some((d) => d && new Date(d).getTime() - now < WARN_DAYS * 86_400_000)
  if (nearExpiry) return { label: "Atención", description: "Próximas renovaciones", tone: "warning" }
  return { label: "Óptimo", description: "Todo al día", tone: "success" }
}

function nearestRenewal(
  domains: ClientDetail["domains"],
  hostingAccounts: ClientDetail["hostingAccounts"]
): { date: string; label: string; past: boolean } | null {
  const now = Date.now()
  const dates = [
    ...domains.map((d) => d.expires_on),
    ...hostingAccounts.map((h) => h.expires_on),
  ]
    .filter((d): d is string => d !== null)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const next = dates.find((d) => new Date(d).getTime() > now) ?? dates[0]
  if (!next) return null
  const days = daysUntil(next)!
  return {
    date: new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(next)),
    label: days.label,
    past: days.past,
  }
}

// ----- Small display primitives -----

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  )
}

function SectionCard({
  title,
  count,
  href,
  hrefLabel = "Ver todos",
  children,
}: {
  title: string
  count?: number
  href: string
  hrefLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {title}
          {count != null ? ` (${count})` : ""}
        </h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {hrefLabel}
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
      <div className="flex-1 px-5 pb-5">{children}</div>
    </div>
  )
}

// ----- Resumen sub-sections -----

function InfraSummaryCard({ detail }: { detail: ClientDetail }) {
  const emailAccounts = detail.emailServices.flatMap((s) => s.email_accounts)
  const hasBackup = detail.backupConfigs.length > 0
  const autoBackup = detail.backupConfigs.some((b) => b.frequency === "daily" || b.frequency === "weekly")

  const rows: { icon: React.ReactNode; label: string; value: string; ok: boolean }[] = [
    {
      icon: <GlobeIcon className="size-3.5" />,
      label: "Dominios",
      value: detail.domains.length > 0 ? `${detail.domains.length} dominio${detail.domains.length !== 1 ? "s" : ""}` : "Sin dominios",
      ok: detail.domains.length > 0 && detail.domains.every((d) => d.status === "active"),
    },
    {
      icon: <ServerIcon className="size-3.5" />,
      label: "Hosting",
      value: detail.hostingAccounts.length > 0 ? `${detail.hostingAccounts.length} hosting` : "Sin hosting",
      ok: detail.hostingAccounts.length > 0 && detail.hostingAccounts.every((h) => h.status === "active"),
    },
    {
      icon: <MailIcon className="size-3.5" />,
      label: "Correos",
      value: emailAccounts.length > 0 ? `${emailAccounts.length} buzón${emailAccounts.length !== 1 ? "es" : ""}` : "Sin buzones",
      ok: emailAccounts.length > 0,
    },
    {
      icon: <MonitorIcon className="size-3.5" />,
      label: "Webs / CMS",
      value: detail.websiteInstallations.length > 0 ? `${detail.websiteInstallations.length} instalación${detail.websiteInstallations.length !== 1 ? "es" : ""}` : "Sin instalaciones",
      ok: detail.websiteInstallations.length > 0 && detail.websiteInstallations.every((w) => w.status === "active"),
    },
    {
      icon: <KeyRoundIcon className="size-3.5" />,
      label: "Credenciales",
      value: detail.credentials.length > 0 ? `${detail.credentials.length} acceso${detail.credentials.length !== 1 ? "s" : ""}` : "Sin credenciales",
      ok: detail.credentials.length > 0,
    },
    {
      icon: <DatabaseBackupIcon className="size-3.5" />,
      label: "Backups",
      value: hasBackup ? (autoBackup ? "Automático" : "Manual") : "Sin backups",
      ok: hasBackup,
    },
  ]

  const clientId = detail.client.id

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Infraestructura (resumen)</h3>
      </div>
      <div className="px-5 pb-2 divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="flex size-5 items-center justify-center text-muted-foreground">{row.icon}</span>
            <span className="flex-1 text-foreground">{row.label}</span>
            <span className="text-muted-foreground">{row.value}</span>
            {row.ok ? (
              <span className="size-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="size-2 rounded-full bg-muted" />
            )}
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 pt-2">
        <Link
          href={`/clientes/${clientId}?tab=infraestructura`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          Ver infraestructura completa
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}

function DomainCard({ detail }: { detail: ClientDetail }) {
  const domain = detail.domains[0]
  const clientId = detail.client.id

  return (
    <SectionCard title="Dominios" count={detail.domains.length} href={`/dominios?client=${clientId}`}>
      {!domain ? (
        <EmptyState title="Sin dominios" />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{domain.domain_name}</span>
              <StatusBadge tone={domain.status === "active" ? "success" : "neutral"} label={domain.status === "active" ? "Activo" : domain.status} />
            </div>
            {domain.registrar_account_reference ? (
              <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
            ) : null}
          </div>
          <div className="divide-y text-sm">
            {domain.registrar_name ? <Row label="Proveedor">{domain.provider_accounts?.providers?.name ?? domain.registrar_name}</Row> : null}
            {domain.provider_accounts ? <Row label="Cuenta">{domain.provider_accounts.label}</Row> : null}
            {domain.renewal_price != null ? (
              <Row label="Coste">{fmtCurrency(domain.renewal_price, domain.currency_code)} / año</Row>
            ) : null}
            {domain.expires_on ? (
              <Row label="Renovación">
                <span className={daysUntil(domain.expires_on)?.past === false && (daysUntil(domain.expires_on)?.label.includes("días") ? parseInt(daysUntil(domain.expires_on)!.label.match(/\d+/)?.[0] ?? "999") < 60 : false) ? "text-warning-foreground dark:text-warning" : ""}>
                  {fmt(domain.expires_on)}{" "}
                  {daysUntil(domain.expires_on) ? (
                    <span className="text-xs text-muted-foreground">({daysUntil(domain.expires_on)!.label})</span>
                  ) : null}
                </span>
              </Row>
            ) : null}
            <Row label="Auto-renovación">
              {domain.auto_renew ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2Icon className="size-3.5" /> Activada
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircleIcon className="size-3.5" /> No
                </span>
              )}
            </Row>
            {domain.nameservers.length > 0 ? (
              <Row label="Nameservers">
                <span className="font-mono text-xs">{domain.nameservers.slice(0, 2).join(", ")}</span>
              </Row>
            ) : null}
            <Row label="Estado">
              <span className="flex items-center gap-1">
                {domain.status === "active" ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircleIcon className="size-3.5 text-warning-foreground dark:text-warning" />
                )}
                {domain.status === "active" ? "Activo" : domain.status}
              </span>
            </Row>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function HostingCard({ detail }: { detail: ClientDetail }) {
  const hosting = detail.hostingAccounts[0]
  const clientId = detail.client.id

  return (
    <SectionCard title="Hosting" count={detail.hostingAccounts.length} href={`/hosting?client=${clientId}`}>
      {!hosting ? (
        <EmptyState title="Sin hosting" />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{hosting.provider_name}{hosting.plan_name ? ` - ${hosting.plan_name}` : ""}</span>
              <StatusBadge tone={hosting.status === "active" ? "success" : "neutral"} label={hosting.status === "active" ? "Activo" : hosting.status} />
            </div>
            {hosting.panel_url ? (
              <a href={hosting.panel_url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            ) : null}
          </div>
          <div className="divide-y text-sm">
            {hosting.provider_accounts?.providers ? <Row label="Proveedor">{hosting.provider_accounts.providers.name}</Row> : null}
            {hosting.provider_accounts ? <Row label="Cuenta / Plan">{hosting.provider_accounts.label}{hosting.plan_name ? ` / ${hosting.plan_name}` : ""}</Row> : null}
            <Row label="Tipo">
              <StatusBadge tone="info" label={hosting.is_shared ? "Compartido" : "Dedicado"} />
            </Row>
            {hosting.renewal_price != null ? (
              <Row label="Coste">{fmtCurrency(hosting.renewal_price, hosting.currency_code)} / año</Row>
            ) : null}
            {hosting.expires_on ? (
              <Row label="Renovación">
                {fmt(hosting.expires_on)}{" "}
                {daysUntil(hosting.expires_on) ? (
                  <span className="text-xs text-muted-foreground">({daysUntil(hosting.expires_on)!.label})</span>
                ) : null}
              </Row>
            ) : null}
            {hosting.panel_url ? (
              <Row label="Panel">
                <a href={hosting.panel_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {new URL(hosting.panel_url).hostname}
                  <ExternalLinkIcon className="size-3" />
                </a>
              </Row>
            ) : null}
            <Row label="Estado">
              <span className="flex items-center gap-1">
                {hosting.status === "active" ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircleIcon className="size-3.5 text-warning-foreground dark:text-warning" />
                )}
                {hosting.status === "active" ? "Activo" : hosting.status}
              </span>
            </Row>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function EmailAccountsPanel({ detail }: { detail: ClientDetail }) {
  const emailAccounts = detail.emailServices.flatMap((svc) =>
    svc.email_accounts.map((acc) => ({ ...acc, serviceName: svc.provider_name }))
  )
  const clientId = detail.client.id

  return (
    <SectionCard
      title="Correos"
      count={emailAccounts.length}
      href={`/correos?client=${clientId}`}
      hrefLabel="Ver todos"
    >
      {emailAccounts.length === 0 ? (
        <EmptyState title="Sin buzones" />
      ) : (
        <div className="divide-y">
          {emailAccounts.slice(0, 5).map((acc) => (
            <div key={acc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate">{acc.address}</span>
                <span className="text-xs text-muted-foreground">{acc.serviceName}</span>
              </div>
              <StatusBadge
                tone={acc.status === "active" ? "success" : "neutral"}
                label={acc.status === "active" ? "Activo" : acc.status}
              />
            </div>
          ))}
        </div>
      )}
      {emailAccounts.length > 0 ? (
        <Link
          href={`/correos?client=${clientId}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          Gestionar correos
          <ArrowRightIcon className="size-3" />
        </Link>
      ) : null}
    </SectionCard>
  )
}

const CMS_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  woocommerce: "WooCommerce",
  joomla: "Joomla",
  drupal: "Drupal",
  magento: "Magento",
  prestashop: "PrestaShop",
  shopify: "Shopify",
  custom: "A medida",
  other: "Otro",
}

function WebInstallationsPanel({ detail }: { detail: ClientDetail }) {
  const install = detail.websiteInstallations[0]
  const clientId = detail.client.id

  return (
    <SectionCard
      title="Webs / CMS"
      count={detail.websiteInstallations.length}
      href={`/sitios-web?client=${clientId}`}
    >
      {!install ? (
        <EmptyState title="Sin instalaciones" />
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium text-foreground">{install.name}</span>
            <StatusBadge
              tone={install.status === "active" ? "success" : "neutral"}
              label={install.status === "active" ? "Activo" : install.status}
            />
          </div>
          <div className="divide-y text-sm">
            {detail.domains[0] ? (
              <Row label="Dominio">
                <a href={`https://${detail.domains[0].domain_name}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {detail.domains[0].domain_name}
                  <ExternalLinkIcon className="size-3" />
                </a>
              </Row>
            ) : null}
            <Row label="CMS">
              {CMS_LABELS[install.cms_type] ?? install.cms_type}
              {install.cms_version ? ` ${install.cms_version}` : ""}
            </Row>
            {install.public_url ? (
              <Row label="URL pública">
                <a href={install.public_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {install.public_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ExternalLinkIcon className="size-3" />
                </a>
              </Row>
            ) : null}
            {install.admin_url ? (
              <Row label="Admin">
                <a href={install.admin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  {install.admin_url.replace(/^https?:\/\//, "")}
                  <ExternalLinkIcon className="size-3" />
                </a>
              </Row>
            ) : null}
            {install.hosting_sites ? (
              <Row label="Hosting">{install.hosting_sites.site_label}</Row>
            ) : null}
            <Row label="Estado">
              <span className="flex items-center gap-1">
                {install.status === "active" ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircleIcon className="size-3.5 text-muted-foreground" />
                )}
                {install.status === "active" ? "Activo" : install.status}
              </span>
            </Row>
          </div>
          <Link
            href={`/sitios-web?client=${clientId}`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Ver instalación completa
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      )}
    </SectionCard>
  )
}

const CRED_TYPE_LABELS: Record<string, string> = {
  website_admin: "WordPress / CMS",
  hosting_panel: "Panel hosting",
  domain_registrar: "Registrador dominio",
  ftp: "FTP",
  sftp: "SFTP",
  ssh: "SSH",
  database: "Base de datos",
  email: "Correo",
  api: "API",
  social_media: "Redes sociales",
  analytics: "Analytics",
  other: "Otro",
}

function CredentialsPanel({ detail }: { detail: ClientDetail }) {
  const creds = detail.credentials.slice(0, 4)
  const clientId = detail.client.id

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Accesos rápidos (credenciales)</h3>
        <Link
          href={`/credenciales?client=${clientId}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver todas
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
      <div className="px-5 pb-2">
        {creds.length === 0 ? (
          <EmptyState title="Sin credenciales" />
        ) : (
          <div className="divide-y">
            {creds.map((cred) => (
              <div key={cred.id} className="flex items-center gap-3 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cred.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {CRED_TYPE_LABELS[cred.type ?? "other"] ?? cred.type ?? "Acceso"}
                    {cred.username ? ` · ${cred.username}` : ""}
                  </p>
                </div>
                {cred.id && cred.credential_mode === "encrypted" ? (
                  <RevealCredentialButton credentialId={cred.id} />
                ) : (
                  <span className="text-xs text-muted-foreground">{cred.credential_mode === "external_reference" ? cred.secret_reference ?? "—" : "—"}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {creds.length > 0 ? (
        <div className="px-5 pb-5 pt-2">
          <Link
            href={`/credenciales?client=${clientId}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            Gestionar credenciales
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}

// ----- Resumen tab -----

function MetricTile({
  label,
  value,
  description,
  tone = "neutral",
}: {
  label: string
  value: React.ReactNode
  description?: React.ReactNode
  tone?: "neutral" | "success" | "warning" | "destructive"
}) {
  const valueClass = {
    neutral: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    destructive: "text-destructive",
  }[tone]

  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function ResumeTab({ detail }: { detail: ClientDetail }) {
  const { client, invoices, projects, services, domains, hostingAccounts } = detail

  // Metrics
  const currentYear = new Date().getFullYear()
  const annualBilling = invoices
    .filter((inv) => inv.due_date && new Date(inv.due_date).getFullYear() === currentYear)
    .reduce((sum, inv) => sum + (inv.total ?? 0), 0)

  const UNPAID_STATUSES = ["issued", "sent", "viewed", "partially_paid", "overdue"] as const
  const pending = invoices
    .filter((inv) => inv.status && (UNPAID_STATUSES as readonly string[]).includes(inv.status))
    .reduce((sum, inv) => sum + (inv.amount_due ?? 0), 0)
  const pendingCount = invoices.filter((inv) => inv.status && (UNPAID_STATUSES as readonly string[]).includes(inv.status)).length

  const renewal = nearestRenewal(domains, hostingAccounts)

  const activeProjects = projects.filter((p) => !["completed", "cancelled"].includes(p.status)).length
  const activeServices = services.length

  const overall = getOverallStatus(domains, hostingAccounts)

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Facturación anual" value={fmtCurrency(annualBilling)} description={`${currentYear}`} />
        <MetricTile
          label="Pendiente de cobro"
          value={fmtCurrency(pending)}
          description={`${pendingCount} factura${pendingCount !== 1 ? "s" : ""}`}
          tone={pending > 0 ? "warning" : "neutral"}
        />
        <MetricTile
          label="Próxima renovación"
          value={renewal ? renewal.date : "—"}
          description={renewal ? <span className={renewal.past ? "text-destructive" : "text-amber-600 dark:text-amber-400"}>{renewal.label}</span> : undefined}
          tone={renewal && !renewal.past ? "warning" : "neutral"}
        />
        <MetricTile
          label="Proyectos activos"
          value={activeProjects}
          description={projects.length > 0 ? projects.filter((p) => p.status === "active").map((p) => p.name).join(", ") : undefined}
        />
        <MetricTile label="Servicios activos" value={activeServices} description={`${activeServices} categoría${activeServices !== 1 ? "s" : ""}`} />
        <MetricTile
          label="Estado general"
          value={overall.label}
          description={overall.description}
          tone={overall.tone}
        />
      </div>

      {/* Infra overview + Domain + Hosting */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfraSummaryCard detail={detail} />
        <DomainCard detail={detail} />
        <HostingCard detail={detail} />
      </div>

      {/* Email + Web + Credentials */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EmailAccountsPanel detail={detail} />
        <WebInstallationsPanel detail={detail} />
        <CredentialsPanel detail={detail} />
      </div>
    </div>
  )
}

// ----- Infrastructure tab -----

function InfraTab({ detail }: { detail: ClientDetail }) {
  const { client, domains, hostingAccounts, emailServices, websiteInstallations, backupConfigs } = detail
  const emailAccounts = emailServices.flatMap((s) => s.email_accounts)

  return (
    <div className="flex flex-col gap-6">
      {/* Domains */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Dominios</h3>
          <Link href={`/dominios?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Gestionar dominios <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        {domains.length === 0 ? (
          <EmptyState title="Sin dominios" />
        ) : (
          <div className="rounded-xl border divide-y">
            {domains.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <GlobeIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{d.domain_name}</span>
                  <StatusBadge tone={d.status === "active" ? "success" : "neutral"} label={d.status === "active" ? "Activo" : d.status} />
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{d.registrar_name ?? "—"}</span>
                  <span>{fmt(d.expires_on)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hosting */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Hosting</h3>
          <Link href={`/hosting?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Gestionar hosting <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        {hostingAccounts.length === 0 ? (
          <EmptyState title="Sin hosting" />
        ) : (
          <div className="rounded-xl border divide-y">
            {hostingAccounts.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <ServerIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{h.provider_name}{h.plan_name ? ` / ${h.plan_name}` : ""}</span>
                  <StatusBadge tone={h.status === "active" ? "success" : "neutral"} label={h.status === "active" ? "Activo" : h.status} />
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  {h.panel_url ? (
                    <a href={h.panel_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  ) : null}
                  <span>{fmt(h.expires_on)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email accounts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Buzones de correo</h3>
          <Link href={`/correos?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Gestionar correos <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        {emailAccounts.length === 0 ? (
          <EmptyState title="Sin buzones" />
        ) : (
          <div className="rounded-xl border divide-y">
            {emailAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{acc.address}</span>
                  {acc.display_name ? <span className="text-muted-foreground">{acc.display_name}</span> : null}
                </div>
                <StatusBadge tone={acc.status === "active" ? "success" : "neutral"} label={acc.status === "active" ? "Activo" : acc.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Website installations */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Instalaciones web</h3>
          <Link href={`/sitios-web?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Gestionar sitios <ArrowRightIcon className="size-3" />
          </Link>
        </div>
        {websiteInstallations.length === 0 ? (
          <EmptyState title="Sin instalaciones" />
        ) : (
          <div className="rounded-xl border divide-y">
            {websiteInstallations.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <MonitorIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{w.name}</span>
                  <span className="text-muted-foreground">{CMS_LABELS[w.cms_type] ?? w.cms_type}{w.cms_version ? ` ${w.cms_version}` : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  {w.public_url ? (
                    <a href={w.public_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  ) : null}
                  <StatusBadge tone={w.status === "active" ? "success" : "neutral"} label={w.status === "active" ? "Activo" : w.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backups */}
      {backupConfigs.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Backups</h3>
            <Link href={`/backups?client=${client.id}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver todos <ArrowRightIcon className="size-3" />
            </Link>
          </div>
          <div className="rounded-xl border divide-y">
            {backupConfigs.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <DatabaseBackupIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{b.name}</span>
                  <span className="text-muted-foreground capitalize">{b.frequency}</span>
                </div>
                <StatusBadge tone={b.status === "successful" ? "success" : b.status === "failed" ? "destructive" : "neutral"} label={b.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ----- Main tabs component -----

function ClientDetailTabs({ detail, serviceOptions }: { detail: ClientDetail; serviceOptions: ServiceOption[] }) {
  const { client, contacts, projects, services, invoices, documents, activity, domains, hostingAccounts, emailServices, websiteInstallations, backupConfigs, credentials } = detail

  const emailAccounts = emailServices.flatMap((s) => s.email_accounts)
  const infraCount = domains.length + hostingAccounts.length + emailServices.length + websiteInstallations.length + backupConfigs.length

  return (
    <Tabs defaultValue="resumen">
      <TabsList className="flex-wrap">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="contacts">Contactos ({contacts.length})</TabsTrigger>
        <TabsTrigger value="projects">Proyectos ({projects.length})</TabsTrigger>
        <TabsTrigger value="infraestructura">Infraestructura {infraCount > 0 ? `${infraCount}` : ""}</TabsTrigger>
        <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
      </TabsList>

      <TabsPanel value="resumen">
        <ResumeTab detail={detail} />
      </TabsPanel>

      <TabsPanel value="contacts">
        {contacts.length === 0 ? (
          <EmptyState title="Sin contactos" description="Todavía no se ha registrado ningún contacto." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {contact.full_name} {contact.is_primary ? "· Principal" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contact.job_title ?? "—"} · {contact.email ?? "sin email"}
                  </span>
                </div>
                <span className="text-muted-foreground">{contact.phone ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="projects">
        {projects.length === 0 ? (
          <EmptyState title="Sin proyectos" description="Este cliente todavía no tiene proyectos." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/proyectos/${project.id}`} className="font-medium text-foreground hover:underline">
                  {project.name}
                </Link>
                <span className="text-muted-foreground">{project.status}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="infraestructura">
        <InfraTab detail={detail} />
      </TabsPanel>

      <TabsPanel value="facturacion">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-foreground">Servicios contratados</p>
              <AddClientServiceButton clientId={client.id} serviceOptions={serviceOptions} />
            </div>
            {services.length === 0 ? (
              <EmptyState title="Sin servicios" description="No hay servicios contratados todavía." />
            ) : (
              <ul className="divide-y rounded-xl border bg-card overflow-hidden">
                {services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-foreground">
                        {service.name_override ?? service.services?.name ?? "Servicio"}
                      </span>
                      {service.services?.category ? (
                        <span className="text-xs text-muted-foreground capitalize">{service.services.category}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {fmtCurrency(service.unit_price, service.currency_code)}
                        {service.billing_interval ? ` / ${service.billing_interval}` : ""}
                      </span>
                      <ClientServiceActions id={service.id} clientId={client.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-3 font-semibold text-foreground">Facturas</p>
            {invoices.length === 0 ? (
              <EmptyState title="Sin facturas" description="Este cliente todavía no tiene facturas." />
            ) : (
              <ul className="divide-y rounded-xl border bg-card overflow-hidden">
                {invoices.slice(0, 10).map((invoice) => {
                  const badge = invoice.status ? getInvoiceStatusBadge(invoice.status) : null
                  return (
                    <li key={invoice.invoice_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="font-medium text-foreground">{invoice.invoice_number}</span>
                      <div className="flex items-center gap-2">
                        {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
                        <span className="text-muted-foreground">{fmtCurrency(invoice.total, invoice.currency_code)}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </TabsPanel>

      <TabsPanel value="documents">
        {documents.length === 0 ? (
          <EmptyState title="Sin documentos" description="No hay documentos visibles todavía." />
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{document.title}</span>
                <span className="text-muted-foreground">{fmt(document.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="activity">
        {activity.length === 0 ? (
          <EmptyState title="Sin actividad reciente" />
        ) : (
          <ul className="divide-y rounded-xl border bg-card overflow-hidden">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-foreground">{entry.summary}</span>
                <span className="text-muted-foreground">{fmt(entry.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </TabsPanel>
    </Tabs>
  )
}

export { ClientDetailTabs }
