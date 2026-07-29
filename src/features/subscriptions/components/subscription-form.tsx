"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  BILLING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  subscriptionSchema,
  type SubscriptionInput,
} from "@/features/subscriptions/schemas/subscription-schema"
import { getBillingIntervalLabel, getSubscriptionStatusBadge } from "@/features/subscriptions/utils/status"
import type { ClientOption, ServiceOption } from "@/features/subscriptions/types"

type SubscriptionFormProps = {
  defaultValues?: Partial<SubscriptionInput>
  clientOptions: ClientOption[]
  serviceOptions: ServiceOption[]
  onSubmit: (values: SubscriptionInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function SubscriptionForm({
  defaultValues,
  clientOptions,
  serviceOptions,
  onSubmit,
  onSuccess,
  submitLabel = "Guardar",
}: SubscriptionFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      client_id: "",
      service_id: "",
      status: "active",
      billing_interval: "monthly",
      amount: "",
      current_period_start: "",
      current_period_end: "",
      cancel_at: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: SubscriptionInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await onSubmit(values)
      if (result.error) {
        setFormError(result.error)
        return
      }
      onSuccess()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Información general</legend>

          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicio *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getSubscriptionStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Periodicidad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_INTERVALS.map((interval) => (
                        <SelectItem key={interval} value={interval}>
                          {getBillingIntervalLabel(interval)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importe por periodo *</FormLabel>
                <FormControl render={<Input inputMode="decimal" placeholder="0.00" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Periodo actual</legend>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="current_period_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inicio</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="current_period_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cancel_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programar cancelación para</FormLabel>
                <FormControl render={<Input type="date" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}

export { SubscriptionForm }
