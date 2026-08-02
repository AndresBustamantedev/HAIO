"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { clientServiceSchema, type ClientServiceInput } from "@/features/client-services/schemas/client-service-schema"
import type { ServiceOption } from "@/features/services/queries/get-service-options"

const BILLING_INTERVAL_LABELS: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  biennial: "Bienal",
  custom: "Personalizado",
}

const BILLING_INTERVALS = ["weekly", "monthly", "quarterly", "semiannual", "annual", "biennial", "custom"] as const

type ClientServiceFormProps = {
  serviceOptions: ServiceOption[]
  onSubmit: (values: ClientServiceInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function ClientServiceForm({ serviceOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: ClientServiceFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<ClientServiceInput>({
    resolver: zodResolver(clientServiceSchema),
    defaultValues: {
      service_id: "",
      name_override: "",
      unit_price: "",
      quantity: "1",
      currency_code: "EUR",
      billing_interval: "",
      starts_on: "",
      ends_on: "",
      notes: "",
    },
  })

  const selectedServiceId = form.watch("service_id")

  React.useEffect(() => {
    if (!selectedServiceId) return
    const svc = serviceOptions.find((s) => s.id === selectedServiceId)
    if (!svc) return
    if (svc.default_price != null) {
      form.setValue("unit_price", String(svc.default_price))
    }
    if (svc.currency_code) {
      form.setValue("currency_code", svc.currency_code)
    }
  }, [selectedServiceId, serviceOptions, form])

  function handleSubmit(values: ClientServiceInput) {
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
          <legend className="mb-1 text-sm font-medium text-foreground">Servicio</legend>

          <FormField
            control={form.control}
            name="service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicio del catálogo *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={Object.fromEntries(serviceOptions.map((s) => [s.id, s.name]))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
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
            name="name_override"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre personalizado</FormLabel>
                <FormControl render={<Input placeholder="Deja vacío para usar el nombre del catálogo" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Precio y facturación</legend>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio unitario *</FormLabel>
                    <FormControl render={<Input inputMode="decimal" placeholder="0.00" {...field} />} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="currency_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["EUR", "USD", "GBP", "MXN", "COP"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl render={<Input inputMode="decimal" placeholder="1" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billing_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervalo</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_INTERVALS.map((interval) => (
                        <SelectItem key={interval} value={interval}>
                          {BILLING_INTERVAL_LABELS[interval]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="starts_on"
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
              name="ends_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Notas</legend>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl render={<Textarea rows={3} placeholder="Condiciones especiales, observaciones..." {...field} />} />
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

export { ClientServiceForm }
