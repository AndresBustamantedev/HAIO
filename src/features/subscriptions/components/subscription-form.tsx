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
import { addBillingInterval } from "@/features/subscriptions/utils/billing"
import type { ClientOption, ServiceOption } from "@/features/subscriptions/types"

type ProjectOption = { id: string; name: string; client_id: string }

type SubscriptionFormProps = {
  defaultValues?: Partial<SubscriptionInput>
  clientOptions: ClientOption[]
  serviceOptions: ServiceOption[]
  projectOptions?: ProjectOption[]
  onSubmit: (values: SubscriptionInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function SubscriptionForm({
  defaultValues,
  clientOptions,
  serviceOptions,
  projectOptions,
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
      project_id: "",
      status: "active",
      billing_interval: "monthly",
      amount: "",
      current_period_start: "",
      current_period_end: "",
      cancel_at: "",
      ...defaultValues,
    },
  })

  const selectedClientId = form.watch("client_id")
  const periodStart = form.watch("current_period_start")
  const billingInterval = form.watch("billing_interval")
  const filteredProjects = (projectOptions ?? []).filter((p) => p.client_id === selectedClientId)

  const prevClientRef = React.useRef(selectedClientId)
  React.useEffect(() => {
    if (prevClientRef.current !== selectedClientId) {
      form.setValue("project_id", "")
      prevClientRef.current = selectedClientId
    }
  }, [selectedClientId, form])

  // Auto-calculate period end when start or interval changes
  React.useEffect(() => {
    if (!periodStart || billingInterval === "custom") return
    const computed = addBillingInterval(periodStart, billingInterval)
    if (computed) form.setValue("current_period_end", computed)
  }, [periodStart, billingInterval, form])

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

          {clientOptions.length > 0 && (
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(clientOptions.map((c) => [c.id, c.display_name]))}>
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
          )}

          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicio *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(serviceOptions.map((s) => [s.id, s.name]))}>
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

          {filteredProjects.length > 0 && (
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto (opcional)</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    items={{ "": "Sin proyecto", ...Object.fromEntries(filteredProjects.map((p) => [p.id, p.name])) }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin proyecto</SelectItem>
                      {filteredProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                  {billingInterval !== "custom" && (
                    <p className="text-xs text-muted-foreground">Calculado según la periodicidad</p>
                  )}
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
