import { notFound } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EditProjectButton } from "@/features/projects/components/edit-project-button"
import { getProjectDetail } from "@/features/projects/queries/get-project-detail"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { getProjectStatusBadge, getProjectTypeLabel } from "@/features/projects/utils/status"
import { createClient } from "@/lib/supabase/server"

import { TabNav } from "./_tabs/tab-nav"
import { TabResumen } from "./_tabs/tab-resumen"
import { TabInfrastructura } from "./_tabs/tab-infraestructura"
import { TabVault } from "./_tabs/tab-vault"
import { TabWordPress } from "./_tabs/tab-wordpress"
import { TabCostes } from "./_tabs/tab-costes"
import { TabWiki } from "./_tabs/tab-wiki"
import { TabDiario } from "./_tabs/tab-diario"
import { TabBackups } from "./_tabs/tab-backups"
import { TabAccesos } from "./_tabs/tab-accesos"

const VALID_TABS = [
  "resumen", "infraestructura", "vault", "wordpress",
  "costes", "wiki", "diario", "backups", "accesos",
] as const
type Tab = (typeof VALID_TABS)[number]

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProyectoDetailPage({ params, searchParams }: Props) {
  const [{ id }, { tab: rawTab }] = await Promise.all([params, searchParams])

  const activeTab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "resumen"

  const detail = await getProjectDetail(id)
  if (!detail) notFound()

  const { project } = detail
  const badge = getProjectStatusBadge(project.status)

  const clientId = project.client_id ?? ""

  const [clientOptions, supabase] = await Promise.all([
    getClientOptions(project.organization_id),
    createClient(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from("project_members")
    .select("id, name, email, role")
    .eq("project_id", id)
    .order("role")
    .order("name")

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Proyectos", href: "/proyectos" },
          { label: project.name },
        ]}
      />

      <PageHeader
        title={project.name}
        description={
          project.clients ? (
            <Link href={`/clientes/${project.clients.id}`} className="hover:underline">
              {project.clients.display_name}
            </Link>
          ) : (
            getProjectTypeLabel(project.type)
          )
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <EditProjectButton project={project} clientOptions={clientOptions} />
          </div>
        }
      />

      <TabNav projectId={id} />

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border bg-muted/30" />}>
        {activeTab === "resumen" && (
          <TabResumen detail={detail} members={members ?? []} />
        )}
        {activeTab === "infraestructura" && (
          <TabInfrastructura projectId={id} clientId={clientId} />
        )}
        {activeTab === "vault" && (
          <TabVault projectId={id} clientId={clientId} />
        )}
        {activeTab === "wordpress" && (
          <TabWordPress projectId={id} />
        )}
        {activeTab === "costes" && (
          <TabCostes
            projectId={id}
            clientId={clientId}
            budget={project.budget ?? null}
            currencyCode={project.currency_code ?? null}
          />
        )}
        {activeTab === "wiki" && (
          <TabWiki projectId={id} organizationId={project.organization_id} />
        )}
        {activeTab === "diario" && (
          <TabDiario projectId={id} organizationId={project.organization_id} />
        )}
        {activeTab === "backups" && (
          <TabBackups projectId={id} />
        )}
        {activeTab === "accesos" && (
          <TabAccesos projectId={id} organizationId={project.organization_id} />
        )}
      </Suspense>
    </PageContainer>
  )
}
