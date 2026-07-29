"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { profileSchema, type ProfileInput } from "@/features/settings/schemas/profile-schema"

type ActionResult = { error: string | null }

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No has iniciado sesión." }
  }

  const fullName = [parsed.data.first_name, parsed.data.last_name].filter(Boolean).join(" ").trim()

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name || null,
      last_name: parsed.data.last_name || null,
      full_name: fullName || null,
      phone: parsed.data.phone || null,
      timezone: parsed.data.timezone,
      locale: parsed.data.locale,
    })
    .eq("id", user.id)

  if (error) {
    return { error: "No se pudo actualizar tu perfil. " + error.message }
  }

  revalidatePath("/configuracion")

  return { error: null }
}
