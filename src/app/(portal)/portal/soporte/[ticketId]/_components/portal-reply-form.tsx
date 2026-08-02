"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { addPortalTicketMessage } from "@/features/tickets/actions/add-portal-ticket-message"

export function PortalReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [body, setBody] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setPending(true)
    try {
      const result = await addPortalTicketMessage(ticketId, body.trim())
      if (result.error) {
        toast.error(result.error)
        return
      }
      setBody("")
      toast.success("Mensaje enviado.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Responder</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Escribe tu mensaje..."
        className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Enviar mensaje"}
        </button>
      </div>
    </form>
  )
}
