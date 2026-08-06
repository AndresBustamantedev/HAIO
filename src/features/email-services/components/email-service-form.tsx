"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

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
  EMAIL_SERVICE_STATUSES,
  emailServiceSchema,
  type EmailServiceInput,
} from "@/features/email-services/schemas/email-service-schema"
import { getEmailServiceStatusBadge } from "@/features/email-services/utils/status"
import type { ClientOption } from "@/features/email-services/types"

type EmailServiceFormProps = {
  defaultValues?: Partial<EmailServiceInput>
  clientOptions: ClientOption[]
  onSubmit: (values: EmailServiceInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

type ProjectOption = { id: string; name: string }

function EmailServiceForm({ defaultValues, clientOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: EmailServiceFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(false)

  const form = useForm<EmailServiceInput>({
    resolver: zodResolver(emailServiceSchema),
    defaultValues: {
      client_id: "",
      project_id: "",
      provider_name: "",
      plan_name: "",
      status: "active",
      starts_on: "",
      expires_on: "",
      renewal_price: "",
      auto_renew: true,
      notes: "",
      ...defaultValues,
    },
  })

  const watchedClientId = useWatch({ control: form.control, name: "client_id" })
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    if (!watchedClientId) { setProjects([]); return }
    setLoadingProjects(true)
    fetch(`/api/integrations/search-projects?client_id=${watchedClientId}`)
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false))
    if (isMountedRef.current) {
      form.setValue("project_id", "")
    }
    isMountedRef.current = true
  }, [watchedClientId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(values: EmailServiceInput) {
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

          {watchedClientId && (
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    disabled={loadingProjects}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(val: string) =>
                          loadingProjects
                            ? "Cargando proyectos…"
                            : val && val !== "__none__"
                              ? (projects.find((p) => p.id === val)?.name ?? val)
                              : "Sin proyecto asignado"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin proyecto asignado</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {!loadingProjects && projects.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">No hay proyectos para este cliente.</div>
                      )}
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
              name="provider_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor *</FormLabel>
                  <FormControl render={<Input placeholder="Google Workspace, Zoho..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plan_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <FormControl render={<Input {...field} />} />
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_SERVICE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getEmailServiceStatusBadge(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Fechas y precio</legend>

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
              name="expires_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expira</FormLabel>
                  <FormControl render={<Input type="date" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="renewal_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de renovación</FormLabel>
                <FormControl render={<Input inputMode="decimal" placeholder="0.00" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auto_renew"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Renovación automática</FormLabel>
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

export { EmailServiceForm }
