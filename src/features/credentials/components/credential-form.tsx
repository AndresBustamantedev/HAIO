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
import { CREDENTIAL_TYPES, credentialSchema, type CredentialInput } from "@/features/credentials/schemas/credential-schema"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"
import type { ClientOption } from "@/features/credentials/types"

type CredentialFormProps = {
  defaultValues?: Partial<CredentialInput>
  clientOptions: ClientOption[]
  onSubmit: (values: CredentialInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function CredentialForm({ defaultValues, clientOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: CredentialFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<CredentialInput>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      label: "",
      type: "website_admin",
      client_id: "",
      username: "",
      login_url: "",
      secret_reference: "",
      expires_at: "",
      is_shared_with_client: false,
      notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: CredentialInput) {
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
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input placeholder="Panel de hosting Acme" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getCredentialTypeLabel(type)}
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
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente (interno)</SelectItem>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="login_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de acceso</FormLabel>
                  <FormControl render={<Input placeholder="https://..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="secret_reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia del secreto</FormLabel>
                <FormControl render={<Input placeholder="vault://ruta/al/secreto" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expira el</FormLabel>
                <FormControl render={<Input type="date" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_shared_with_client"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Compartida con el cliente</FormLabel>
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Notas</legend>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl render={<Textarea rows={3} {...field} />} />
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

export { CredentialForm }
