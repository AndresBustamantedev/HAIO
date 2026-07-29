import {
  AlertTriangleIcon,
  BellIcon,
  CalendarClockIcon,
  DatabaseBackupIcon,
  LifeBuoyIcon,
  ListTodoIcon,
  ReceiptIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

import type { Database } from "@/types/database.types"

type NotificationType = Database["public"]["Enums"]["notification_type"]

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  system: { label: "Sistema", icon: BellIcon },
  renewal: { label: "Renovación", icon: CalendarClockIcon },
  payment: { label: "Pago", icon: WalletIcon },
  invoice: { label: "Factura", icon: ReceiptIcon },
  task: { label: "Tarea", icon: ListTodoIcon },
  ticket: { label: "Ticket", icon: LifeBuoyIcon },
  backup: { label: "Backup", icon: DatabaseBackupIcon },
  security: { label: "Seguridad", icon: AlertTriangleIcon },
  other: { label: "Otro", icon: BellIcon },
}

export function getNotificationTypeConfig(type: NotificationType) {
  return TYPE_CONFIG[type]
}
