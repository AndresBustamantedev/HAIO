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
  websiteInstallationSchema,
  type WebsiteInstallationInput,
} from "@/features/website-installations/schemas/website-installation-schema"
import {
  getCmsTypeLabel,
  getEnvironmentLabel,
  getInstallationStatusLabel,
  CMS_TYPES,
  ENVIRONMENTS,
  INSTALLATION_STATUSES,
} from "@/features/website-installations/utils/labels"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

type Props = {
  clientOptions: ClientOption[]
  defaultValues?: Partial<WebsiteInstallationInput>
  onSubmit: (values: WebsiteInstallationInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function WebsiteInstallationForm({ clientOptions, defaultValues, onSubmit, onSuccess, submitLabel = "Guardar" }: Props) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<WebsiteInstallationInput>({
    resolver: zodResolver(websiteInstallationSchema),
    defaultValues: {
      client_id: "",
      name: "",
      cms_type: "wordpress",
      cms_version: "",
      environment: "production",
      status: "active",
      public_url: "",
      admin_url: "",
      hosting_site_id: "",
      domain_id: "",
      project_id: "",
      notes: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: WebsiteInstallationInput) {
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
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(clientOptions.map((c) => [c.id, c.display_name]))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input placeholder="Web corporativa cliente X" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cms_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CMS / Plataforma *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CMS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{getCmsTypeLabel(t)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cms_version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versión</FormLabel>
                  <FormControl render={<Input placeholder="6.7.2" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entorno *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((e) => (
                        <SelectItem key={e} value={e}>{getEnvironmentLabel(e)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INSTALLATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{getInstallationStatusLabel(s)}</SelectItem>
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
            name="public_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL pública</FormLabel>
                <FormControl render={<Input type="url" placeholder="https://cliente.com" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="admin_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de administración</FormLabel>
                <FormControl render={<Input type="url" placeholder="https://cliente.com/wp-admin" {...field} />} />
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

export { WebsiteInstallationForm }
