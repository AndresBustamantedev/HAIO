"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { PlusIcon, Trash2Icon } from "lucide-react"

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
import { INVOICE_STATUSES, INVOICE_CURRENCIES, invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import type { ClientOption } from "@/features/invoices/types"

type InvoiceFormProps = {
  defaultValues?: Partial<InvoiceInput>
  clientOptions: ClientOption[]
  onSubmit: (values: InvoiceInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function InvoiceForm({ defaultValues, clientOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: InvoiceFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      currency_code: "EUR",
      status: "draft",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      notes: "",
      items: [{ description: "", quantity: "1", unit_price: "0", tax_rate: "21", discount_percent: "0" }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })
  const items = form.watch("items")
  const selectedCurrency = form.watch("currency_code") || "EUR"

  const estimatedTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    const discount = Number(item.discount_percent) || 0
    const tax = Number(item.tax_rate) || 0
    const subtotal = qty * price * (1 - discount / 100)
    return sum + subtotal * (1 + tax / 100)
  }, 0)

  function handleSubmit(values: InvoiceInput) {
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

          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
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
            <FormField
              control={form.control}
              name="currency_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(INVOICE_CURRENCIES.map((c) => [c.code, c.code]))}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
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
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de emisión *</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vencimiento</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(INVOICE_STATUSES.map((s) => [s, getInvoiceStatusBadge(s).label]))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getInvoiceStatusBadge(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-foreground">Líneas de la factura</legend>

          {fields.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl render={<Input placeholder="Descripción de la línea" {...field} />} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-1"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                  aria-label="Eliminar línea"
                >
                  <Trash2Icon />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cant.</FormLabel>
                      <FormControl render={<Input inputMode="decimal" {...field} />} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unit_price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Precio</FormLabel>
                      <FormControl render={<Input inputMode="decimal" {...field} />} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.tax_rate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">IVA %</FormLabel>
                      <FormControl render={<Input inputMode="decimal" {...field} />} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.discount_percent`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Dto. %</FormLabel>
                      <FormControl render={<Input inputMode="decimal" {...field} />} />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ description: "", quantity: "1", unit_price: "0", tax_rate: "21", discount_percent: "0" })
            }
          >
            <PlusIcon />
            Añadir línea
          </Button>

          <p className="text-right text-sm text-muted-foreground">
            Total estimado:{" "}
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("es-ES", { style: "currency", currency: selectedCurrency }).format(estimatedTotal)}
            </span>
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Notas</legend>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl render={<Textarea rows={2} {...field} />} />
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

export { InvoiceForm }
