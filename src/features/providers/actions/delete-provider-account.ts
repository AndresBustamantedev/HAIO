"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type ActionResult = { error: string | null }

export async function deleteProviderAccount(id: string): Promise<ActionResult> {
  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

  const { error } = await supabase
    .from("provider_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: "No se pudo eliminar la cuenta de proveedor. " + error.message }

  revalidatePath("/proveedores")
  return { error: null }
}
