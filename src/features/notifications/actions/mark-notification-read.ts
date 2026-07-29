"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult = { error: string | null }

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)

  if (error) {
    return { error: "No se pudo marcar la notificación como leída. " + error.message }
  }

  revalidatePath("/notificaciones")

  return { error: null }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "No has iniciado sesión." }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) {
    return { error: "No se pudieron marcar las notificaciones como leídas. " + error.message }
  }

  revalidatePath("/notificaciones")

  return { error: null }
}
