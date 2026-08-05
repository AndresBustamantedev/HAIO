import { notFound } from "next/navigation"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { getClientOptions } from "@/lib/supabase/queries/client-options"
import { CreateProjectWizard } from "@/features/projects/components/create-project-wizard"

export const metadata = { title: "Nuevo proyecto" }

export default async function NuevoProyectoPage() {
  const organization = await getCurrentOrganization()
  if (!organization) notFound()

  const clientOptions = await getClientOptions(organization.organizationId)

  return <CreateProjectWizard clientOptions={clientOptions} />
}
