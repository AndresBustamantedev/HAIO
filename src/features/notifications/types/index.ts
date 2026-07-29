import type { Database } from "@/types/database.types"

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationType = Database["public"]["Enums"]["notification_type"]
