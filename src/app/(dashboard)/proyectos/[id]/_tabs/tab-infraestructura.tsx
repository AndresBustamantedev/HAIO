import { createClient } from "@/lib/supabase/server"
import { ResourcesGrid, type Resource } from "./resources-grid-client"

type Props = { projectId: string; clientId: string }

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

export async function TabInfrastructura({ projectId, clientId }: Props) {
  const supabase = await createClient()

  const [domainsRes, hostingRes, emailsRes, websitesRes, reposRes, dbsRes, projectRes, clientRes] = await Promise.all([
    supabase
      .from("domains")
      .select("id, domain_name, status, expires_on, registrar_name")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("domain_name"),
    supabase
      .from("hosting_accounts")
      .select("id, provider_name, plan_name, status, expires_on, panel_url, server_hostname, server_ip")
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("repositories")
      .select("id, name, provider, url, visibility, status")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("databases")
      .select("id, name, engine, engine_version, provider, status")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    supabase.from("projects").select("id, name").eq("id", projectId).single(),
    supabase.from("clients").select("id, display_name").eq("id", clientId).single(),
  ])

  const projectName = projectRes.data?.name ?? ""
  const clientName = clientRes.data?.display_name ?? ""

  const resources: Resource[] = [
    ...(domainsRes.data ?? []).map((d): Resource => ({
      id: d.id,
      name: d.domain_name,
      type: "dominio",
      provider: d.registrar_name,
      status: d.status ?? "unknown",
      expires_on: d.expires_on,
      manageUrl: `/dominios?q=${encodeURIComponent(d.domain_name)}`,
      meta: [
        ...(d.registrar_name ? [{ label: "Proveedor", value: d.registrar_name }] : []),
        ...(d.expires_on ? [{ label: "Vencimiento", value: fmt(d.expires_on) }] : []),
      ],
    })),

    ...(hostingRes.data ?? []).map((h): Resource => ({
      id: h.id,
      name: h.plan_name ?? h.provider_name,
      type: "hosting",
      provider: h.provider_name,
      status: h.status ?? "unknown",
      expires_on: h.expires_on,
      url: h.panel_url,
      manageUrl: h.panel_url ?? "/hosting",
      meta: [
        ...(h.provider_name ? [{ label: "Proveedor", value: h.provider_name }] : []),
        ...(h.expires_on ? [{ label: "Vencimiento", value: fmt(h.expires_on) }] : []),
        ...(h.server_hostname ? [{ label: "Servidor", value: h.server_hostname }] : h.server_ip ? [{ label: "Servidor", value: String(h.server_ip) }] : []),
      ],
    })),

    ...(emailsRes.data ?? []).map((e): Resource => ({
      id: e.id,
      name: e.provider_name,
      type: "correo",
      provider: e.provider_name,
      status: e.status ?? "unknown",
      expires_on: e.expires_on,
      manageUrl: `/correos`,
      meta: [
        ...(e.provider_name ? [{ label: "Proveedor", value: e.provider_name }] : []),
        ...(e.plan_name ? [{ label: "Plan", value: e.plan_name }] : []),
        ...(e.expires_on ? [{ label: "Vencimiento", value: fmt(e.expires_on) }] : []),
      ],
    })),

    ...(websitesRes.data ?? []).map((w): Resource => ({
      id: w.id,
      name: w.name,
      type: "wordpress",
      provider: null,
      status: w.status ?? "unknown",
      expires_on: null,
      url: w.public_url,
      manageUrl: w.admin_url ?? w.public_url ?? "/sitios-web",
      meta: [
        ...(w.cms_version ? [{ label: "Versión", value: w.cms_version }] : []),
        ...(w.cms_type ? [{ label: "CMS", value: w.cms_type }] : []),
      ],
    })),

    ...(reposRes.data ?? []).map((r: { id: string; name: string; provider: string; url: string | null; visibility: string; status: string }): Resource => ({
      id: r.id,
      name: r.name,
      type: "repositorio",
      provider: r.provider || null,
      status: r.status ?? "active",
      expires_on: null,
      url: r.url,
      manageUrl: r.url ?? undefined,
      meta: [
        ...(r.provider ? [{ label: "Plataforma", value: r.provider }] : []),
        ...(r.visibility ? [{ label: "Visibilidad", value: r.visibility === "private" ? "Privado" : "Público" }] : []),
      ],
    })),

    ...(dbsRes.data ?? []).map((d: { id: string; name: string; engine: string; engine_version: string | null; provider: string | null; status: string }): Resource => ({
      id: d.id,
      name: d.name,
      type: "base_datos",
      provider: d.provider,
      status: d.status ?? "active",
      expires_on: null,
      meta: [
        ...(d.engine ? [{ label: "Motor", value: d.engine }] : []),
        ...(d.engine_version ? [{ label: "Versión", value: d.engine_version }] : []),
        ...(d.provider ? [{ label: "Proveedor", value: d.provider }] : []),
      ],
    })),
  ]

  return <ResourcesGrid resources={resources} clientId={clientId} clientName={clientName} projectId={projectId} projectName={projectName} />
}
