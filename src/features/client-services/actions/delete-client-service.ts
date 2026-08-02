"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function deleteClientService(id: string, clientId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from("client_services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo eliminar el servicio. " + error.message }
  }

  revalidatePath(`/clientes/${clientId}`)
  return { error: null }
}
