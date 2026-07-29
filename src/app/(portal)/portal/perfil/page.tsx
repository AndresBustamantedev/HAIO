import { redirect } from "next/navigation"
import { MailIcon, PhoneIcon, GlobeIcon, MapPinIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

export default async function PortalPerfilPage() {
  const session = await getPortalSession()
  if (!session) redirect("/login")

  const { access } = session
  const client = access.client

  const locationParts = [client.city, client.region].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(", ") : null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Nombre" value={client.display_name} />
          <Row label="Razón social" value={client.legal_name} />
          <Row label="NIF / CIF" value={client.tax_id} />
          <Row label="Email" value={client.email} />
          <Row label="Teléfono" value={client.phone} />
          <Row label="Web" value={client.website} />
          <Row label="Localidad" value={location} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acceso al portal</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Email de acceso" value={session.userEmail ?? null} />
          <div className="flex flex-col gap-1 py-2.5">
            <p className="text-xs text-muted-foreground">Permisos activos</p>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-foreground">
              {access.can_view_projects && <span>Proyectos</span>}
              {access.can_view_invoices && <span>· Facturas</span>}
              {access.can_view_documents && <span>· Documentos</span>}
              {access.can_create_tickets && <span>· Soporte</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
