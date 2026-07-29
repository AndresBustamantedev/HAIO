import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/features/notifications/types"

export type GetNotificationsParams = {
  userId: string
  onlyUnread?: boolean
  page?: number
  pageSize?: number
}

export type GetNotificationsResult = {
  notifications: Notification[]
  total: number
  page: number
  pageSize: number
}

/** Paginated notification list for the signed-in user — RLS scopes everything to `user_id`. */
export async function getNotifications(params: GetNotificationsParams): Promise<GetNotificationsResult> {
  const supabase = await createClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", params.userId)

  if (params.onlyUnread) {
    query = query.is("read_at", null)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    notifications: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  }
}
