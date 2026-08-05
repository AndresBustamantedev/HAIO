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
import {
  milestoneSchema,
  type MilestoneInput,
  MILESTONE_CURRENCIES,
  MILESTONE_INTERVALS,
} from "@/features/billing-milestones/schemas/milestone-schema"

const TYPE_LABELS: Record<string, string> = {
  development:  "Desarrollo",
  maintenance:  "Mantenimiento",
  extra:        "Extra / Puntual",
  renewal:      "Renovación",
  other:        "Otro",
}

const WORK_STATUS_LABELS: Record<string, string> = {
  draft:       "Borrador",
  planned:     "Planificado",
  in_progress: "En progreso",
  in_review:   "En revisión",
  completed:   "Completado",
  cancelled:   "Cancelado",
}

const BILLING_STATUS_LABELS: Record<string, string> = {
  unbilled:        "Sin facturar",
  invoice_draft:   "Borrador de factura",
  invoiced:        "Facturado",
  partially_paid:  "Parcialmente cobrado",
  paid:            "Cobrado",
  credited:        "Abonado",
  cancelled:       "Cancelado",
}

const INTERVAL_LABELS: Record<string, string> = {
  weekly:    "Semanal",
  monthly:   "Mensual",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual:    "Anual",
  biennial:  "Bienal",
  custom:    "Personalizado",
}

type MilestoneFormProps = {
  defaultValues?: Partial<MilestoneInput>
  onSubmit: (values: MilestoneInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function MilestoneForm({ defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: MilestoneFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<MilestoneInput>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "development",
      work_status: "draft",
      billing_status: "unbilled",
      amount: "",
      currency_code: "EUR",
      internal_cost: "",
      billing_interval: "",
      planned_date: "",
      billed_at: "",
      notes: "",
      internal_notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: MilestoneInput) {
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
          <legend className="mb-1 text-sm font-medium text-foreground">Identificación</legend>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del hito *</FormLabel>
                <FormControl render={<Input placeholder="ej. Desarrollo web fase 1, Mantenimiento 2025..." {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
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
              name="work_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de trabajo *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WORK_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de facturación *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BILLING_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Importes</legend>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importe facturado al cliente *</FormLabel>
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
                      {MILESTONE_CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
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
            name="internal_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coste interno (opcional)</FormLabel>
                <FormControl render={<Input inputMode="decimal" placeholder="Lo que te costó a ti — para calcular margen" {...field} />} />
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
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pago único (sin repetición)" />
                  </SelectTrigger>
                  <SelectContent>
                    {MILESTONE_INTERVALS.map((i) => (
                      <SelectItem key={i} value={i}>{INTERVAL_LABELS[i]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Fechas</legend>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="planned_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha prevista de cobro</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billed_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facturado el</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl render={<Textarea rows={3} placeholder="Alcance, condiciones, observaciones..." {...field} />} />
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}

export { MilestoneForm }
