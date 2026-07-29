"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { serviceSchema, type ServiceInput } from "@/features/services/schemas/service-schema"

type ActionResult = { error: string | null }

export async function updateService(serviceId: string, input: ServiceInput): Promise<ActionResult> {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      code: parsed.data.code,
      category: parsed.data.category,
      billing_type: parsed.data.billing_type,
      default_interval: parsed.data.default_interval || null,
      default_price: parsed.data.default_price ? Number(parsed.data.default_price) : null,
      tax_rate: parsed.data.tax_rate ? Number(parsed.data.tax_rate) : 0,
      description: parsed.data.description || null,
      is_active: parsed.data.is_active,
    })
    .eq("id", serviceId)

  if (error) {
    return { error: "No se pudo actualizar el servicio. " + error.message }
  }

  revalidatePath("/servicios")

  return { error: null }
}
