"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { providerSchema, type ProviderInput } from "@/features/providers/schemas/provider-schema"

type ActionResult = { error: string | null }

export async function updateProvider(id: string, input: ProviderInput): Promise<ActionResult> {
  const parsed = providerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

  const { error } = await supabase
    .from("providers")
    .update({
      name: parsed.data.name,
      category: parsed.data.category as import("@/types/database.types").Database["public"]["Enums"]["provider_category"],
      website: parsed.data.website || null,
      support_url: parsed.data.support_url || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("organization_id", organization.organizationId)

  if (error) return { error: "No se pudo actualizar el proveedor. " + error.message }

  revalidatePath("/proveedores")
  return { error: null }
}
