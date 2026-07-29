"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function deleteEmailAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("email_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo eliminar la cuenta de correo. " + error.message }
  }

  revalidatePath("/correos")

  return { error: null }
}
