"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  SERVICE_BILLING_TYPES,
  SERVICE_CATEGORIES,
  serviceSchema,
  type ServiceInput,
} from "@/features/services/schemas/service-schema"
import { getServiceBillingTypeBadge, getServiceCategoryLabel } from "@/features/services/utils/labels"

const INTERVAL_LABELS: Record<(typeof BILLING_INTERVALS)[number], string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  biennial: "Bienal",
  custom: "Personalizado",
}

type ServiceFormProps = {
  defaultValues?: Partial<ServiceInput>
  onSubmit: (values: ServiceInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function ServiceForm({ defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: ServiceFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "development",
      billing_type: "recurring",
      default_interval: "monthly",
      default_price: "",
      tax_rate: "",
      description: "",
      is_active: true,
      ...defaultValues,
    },
  })

  function handleSubmit(values: ServiceInput) {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input placeholder="Hosting básico" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl render={<Input placeholder="HOST-BASIC" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getServiceCategoryLabel(category)}
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
              name="billing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cobro</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_BILLING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getServiceBillingTypeBadge(type).label}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl render={<Textarea rows={3} {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Precio</legend>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="default_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por defecto</FormLabel>
                  <FormControl render={<Input inputMode="decimal" placeholder="0.00" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA (%)</FormLabel>
                  <FormControl render={<Input inputMode="decimal" placeholder="21" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="default_interval"
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
                        {INTERVAL_LABELS[interval]}
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Servicio activo</FormLabel>
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

export { ServiceForm }
