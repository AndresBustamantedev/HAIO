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
import { providerSchema, type ProviderInput } from "@/features/providers/schemas/provider-schema"
import { PROVIDER_CATEGORIES, getProviderCategoryLabel } from "@/features/providers/utils/labels"

type ProviderFormProps = {
  defaultValues?: Partial<ProviderInput>
  onSubmit: (values: ProviderInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function ProviderForm({ defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: ProviderFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<ProviderInput>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      category: "other",
      website: "",
      support_url: "",
      notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: ProviderInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await onSubmit(values)
      if (result.error) { setFormError(result.error); return }
      onSuccess()
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input placeholder="Hostinger" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{getProviderCategoryLabel(cat)}</SelectItem>
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web</FormLabel>
                  <FormControl render={<Input placeholder="https://..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="support_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de soporte</FormLabel>
                  <FormControl render={<Input placeholder="https://..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl render={<Textarea rows={3} {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : submitLabel}</Button>
      </form>
    </Form>
  )
}

export { ProviderForm }
