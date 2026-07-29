import { notFound } from "next/navigation"
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EditClientButton } from "@/features/clients/components/edit-client-button"
import { ClientDetailTabs } from "@/features/clients/components/client-detail-tabs"
import { getClientDetail } from "@/features/clients/queries/get-client-detail"
import { getClientStatusBadge } from "@/features/clients/utils/status"

const CLIENT_TYPE_LABEL: Record<string, string> = {
  individual: "Particular",
  company: "Empresa",
}

type ClienteDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function ClienteDetailPage({ params }: ClienteDetailPageProps) {
  const { id } = await params
  const detail = await getClientDetail(id)

  if (!detail) {
    notFound()
  }

  const { client } = detail
  const badge = getClientStatusBadge(client.status)

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Clientes", href: "/clientes" }, { label: client.display_name }]} />

      <PageHeader
        title={client.display_name}
        description={client.legal_name ?? client.tax_id ?? CLIENT_TYPE_LABEL[client.type]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge tone={badge.tone} label={badge.label} />
            <EditClientButton client={client} />
          </div>
        }
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">Información general</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <MailIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-foreground">{client.email ?? "—"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <PhoneIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Teléfono</dt>
              <dd className="text-foreground">{client.phone ?? "—"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GlobeIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Sitio web</dt>
              <dd className="text-foreground">{client.website ?? "—"}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Ciudad</dt>
              <dd className="text-foreground">{client.city ?? "—"}</dd>
            </div>
          </div>
        </dl>
        {client.notes ? (
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{client.notes}</p>
        ) : null}
      </div>

      <ClientDetailTabs detail={detail} />
    </PageContainer>
  )
}
