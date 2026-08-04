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
  emailAccountSchema,
  EMAIL_ACCOUNT_STATUSES,
  type EmailAccountInput,
} from "@/features/email-accounts/schemas/email-account-schema"
import type { EmailServiceOption } from "@/features/email-accounts/types"

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  inactive: "Inactiva",
  suspended: "Suspendida",
}

type Props = {
  serviceOptions: EmailServiceOption[]
  defaultValues?: Partial<EmailAccountInput>
  onSubmit: (values: EmailAccountInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function EmailAccountForm({ serviceOptions, defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: Props) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<EmailAccountInput>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {
      email_service_id: "",
      address: "",
      display_name: "",
      password: "",
      status: "active",
      quota_mb: "",
      forwards_to: "",
      notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: EmailAccountInput) {
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
            name="email_service_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Servicio de correo *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.provider_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección de correo *</FormLabel>
                <FormControl render={<Input type="email" placeholder="usuario@dominio.com" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre mostrado</FormLabel>
                <FormControl render={<Input placeholder="Juan García" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl render={<Input type="text" placeholder="Dejar vacío para no cambiar" {...field} />} />
                <p className="text-xs text-muted-foreground">Se guarda cifrada. Déjala vacía para mantener la actual.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMAIL_ACCOUNT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quota_mb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuota (MB)</FormLabel>
                  <FormControl render={<Input type="number" min="0" placeholder="1024" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="forwards_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reenviar a</FormLabel>
                <FormControl render={<Input placeholder="otro@correo.com, otro2@correo.com" {...field} />} />
                <p className="text-xs text-muted-foreground">Separa múltiples direcciones con comas.</p>
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

export { EmailAccountForm }
