"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { markNotificationRead } from "@/features/notifications/actions/mark-notification-read"
import { getNotificationTypeConfig } from "@/features/notifications/utils/labels"
import type { Notification } from "@/features/notifications/types"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter()

  async function handleOpen(notification: Notification) {
    if (!notification.read_at) {
      const result = await markNotificationRead(notification.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
    }
  }

  return (
    <ul className="flex flex-col divide-y rounded-xl border">
      {notifications.map((notification) => {
        const config = getNotificationTypeConfig(notification.type)
        const Icon = config.icon
        const isUnread = !notification.read_at

        const content = (
          <div className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className={cn("text-sm", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                  {notification.title}
                </p>
                {isUnread ? <CircleIcon className="size-2 fill-primary text-primary" /> : null}
              </div>
              {notification.body ? <p className="text-sm text-muted-foreground">{notification.body}</p> : null}
              <p className="text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
            </div>
          </div>
        )

        return (
          <li key={notification.id} onClick={() => handleOpen(notification)} className="cursor-pointer hover:bg-muted/40">
            {notification.url ? (
              <Link href={notification.url} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )
}

export { NotificationsList }
