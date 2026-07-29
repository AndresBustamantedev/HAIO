import { notFound } from "next/navigation"
import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EditClientButton } from "@/features/clients/components/edit-client-button"
import { ClientActionsMenu } from "@/features/clients/components/client-actions-menu"
import { ClientDetailTabs } from "@/features/clients/components/client-detail-tabs"
import { getClientDetail } from "@/features/clients/queries/get-client-detail"
import { getClientStatusBadge } from "@/features/clients/utils/status"

const AVATAR_PALETTE = [
  "bg-indigo-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-sky-600",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
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
  const avatarColor = getAvatarColor(client.display_name)
  const initials = getInitials(client.display_name)

  const locationParts = [client.city, client.region].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(", ") : null

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Clientes", href: "/clientes" }, { label: client.display_name }]} />

      {/* Client header card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className={`flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${avatarColor}`}
          >
            {initials}
          </div>

          {/* Name + contact info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground">{client.display_name}</h1>
              <StatusBadge tone={badge.tone} label={badge.label} />
            </div>
            {client.legal_name ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{client.legal_name}</p>
            ) : null}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {client.email ? (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <MailIcon className="size-3.5 shrink-0" />
                  <span>{client.email}</span>
                </a>
              ) : null}
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="size-3.5 shrink-0" />
                <span>{client.phone ?? "—"}</span>
              </span>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground"
                >
                  <GlobeIcon className="size-3.5 shrink-0" />
                  <span>{client.website.replace(/^https?:\/\//, "")}</span>
                </a>
              ) : null}
              {location ? (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 shrink-0" />
                  <span>{location}</span>
                </span>
              ) : null}
            </div>
            {client.notes ? (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{client.notes}</p>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <ClientActionsMenu client={client} />
            <EditClientButton client={client} />
          </div>
        </div>
      </div>

      <ClientDetailTabs detail={detail} />
    </PageContainer>
  )
}
