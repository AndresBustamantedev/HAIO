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
import { providerAccountSchema, type ProviderAccountInput } from "@/features/providers/schemas/provider-schema"
import type { Provider } from "@/features/providers/types"

type ProviderAccountFormProps = {
  providers: Pick<Provider, "id" | "name">[]
  defaultValues?: Partial<ProviderAccountInput>
  onSubmit: (values: ProviderAccountInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function ProviderAccountForm({ providers, defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: ProviderAccountFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<ProviderAccountInput>({
    resolver: zodResolver(providerAccountSchema),
    defaultValues: {
      provider_id: "",
      label: "",
      account_reference: "",
      notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: ProviderAccountInput) {
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
            name="provider_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la cuenta *</FormLabel>
                <FormControl render={<Input placeholder="Cuenta reseller Hostinger" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia de cuenta</FormLabel>
                <FormControl render={<Input placeholder="Nº de cliente, email de acceso..." {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

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

export { ProviderAccountForm }
