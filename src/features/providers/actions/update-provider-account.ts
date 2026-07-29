"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { providerAccountSchema, type ProviderAccountInput } from "@/features/providers/schemas/provider-schema"

type ActionResult = { error: string | null }

export async function updateProviderAccount(id: string, input: ProviderAccountInput): Promise<ActionResult> {
  const parsed = providerAccountSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

  const { error } = await supabase
    .from("provider_accounts")
    .update({
      provider_id: parsed.data.provider_id,
      label: parsed.data.label,
      account_reference: parsed.data.account_reference || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: "No se pudo actualizar la cuenta de proveedor. " + error.message }

  revalidatePath("/proveedores")
  return { error: null }
}
