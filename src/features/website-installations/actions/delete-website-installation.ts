"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function deleteWebsiteInstallation(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("website_installations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo eliminar la instalación. " + error.message }
  }

  revalidatePath("/sitios-web")

  return { error: null }
}
