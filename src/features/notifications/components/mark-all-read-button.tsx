"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { markAllNotificationsRead } from "@/features/notifications/actions/mark-notification-read"

function MarkAllReadButton() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Notificaciones marcadas como leídas.")
      router.refresh()
    })
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      <CheckCheckIcon />
      {isPending ? "Marcando..." : "Marcar todas como leídas"}
    </Button>
  )
}

export { MarkAllReadButton }
