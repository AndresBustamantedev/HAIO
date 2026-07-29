"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { EmptyState } from "@/components/common/empty-state"
import { ticketMessageSchema, type TicketMessageInput } from "@/features/tickets/schemas/ticket-schema"
import { addTicketMessage } from "@/features/tickets/actions/add-ticket-message"
import type { TicketMessage } from "@/features/tickets/types"

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function TicketMessageThread({ ticketId, messages }: { ticketId: string; messages: TicketMessage[] }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const form = useForm<TicketMessageInput>({
    resolver: zodResolver(ticketMessageSchema),
    defaultValues: { body: "", is_internal: false },
  })

  function handleSubmit(values: TicketMessageInput) {
    startTransition(async () => {
      const result = await addTicketMessage(ticketId, values)
      if (result.error) {
        toast.error(result.error)
        return
      }
      form.reset({ body: "", is_internal: false })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-foreground">Conversación</p>

      {messages.length === 0 ? (
        <EmptyState title="Sin mensajes todavía" description="Escribe el primer mensaje del ticket." />
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.is_internal
                  ? "rounded-lg border border-dashed bg-muted/50 p-3"
                  : "rounded-lg border bg-card p-3"
              }
            >
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{message.is_internal ? "Nota interna" : "Mensaje"}</span>
                <span>{formatDateTime(message.created_at)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{message.body}</p>
            </li>
          ))}
        </ul>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-3 rounded-xl border p-4">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormControl render={<Textarea rows={3} placeholder="Escribe una respuesta..." {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="is_internal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  <span className="text-sm font-normal text-muted-foreground">Nota interna (no visible para el cliente)</span>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export { TicketMessageThread }
