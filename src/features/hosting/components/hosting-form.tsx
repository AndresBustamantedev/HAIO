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
import { HOSTING_STATUSES, hostingSchema, type HostingInput } from "@/features/hosting/schemas/hosting-schema"
import { getHostingStatusBadge } from "@/features/hosting/utils/status"
import type { ClientOption } from "@/features/hosting/types"

type ProjectOption = { id: string; name: string; client_id: string }

type HostingFormProps = {
  defaultValues?: Partial<HostingInput>
  clientOptions: ClientOption[]
  projectOptions?: ProjectOption[]
  onSubmit: (values: HostingInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function HostingForm({ defaultValues, clientOptions, projectOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: HostingFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<HostingInput>({
    resolver: zodResolver(hostingSchema),
    defaultValues: {
      client_id: "",
      provider_name: "",
      plan_name: "",
      status: "active",
      panel_url: "",
      server_hostname: "",
      starts_on: "",
      expires_on: "",
      renewal_price: "",
      auto_renew: true,
      notes: "",
      project_id: "",
      ...defaultValues,
    },
  })

  const selectedClientId = form.watch("client_id")
  const filteredProjects = (projectOptions ?? []).filter((p) => p.client_id === selectedClientId)

  const prevClientRef = React.useRef(selectedClientId)
  React.useEffect(() => {
    if (prevClientRef.current !== selectedClientId) {
      form.setValue("project_id", "")
      prevClientRef.current = selectedClientId
    }
  }, [selectedClientId, form])

  function handleSubmit(values: HostingInput) {
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="provider_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor *</FormLabel>
                  <FormControl render={<Input placeholder="DigitalOcean, cPanel..." {...field} />} />
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

          <div className="grid grid-cols-2 gap-3">
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
                      {HOSTING_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getHostingStatusBadge(status).label}
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
              name="server_hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor</FormLabel>
                  <FormControl render={<Input placeholder="srv1.hosting.com" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="panel_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL del panel</FormLabel>
                <FormControl render={<Input placeholder="https://..." {...field} />} />
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

        {filteredProjects.length > 0 && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  items={{ "": "Sin proyecto asignado", ...Object.fromEntries(filteredProjects.map((p) => [p.id, p.name])) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(val: string) =>
                        val
                          ? (filteredProjects.find((p) => p.id === val)?.name ?? val)
                          : "Sin proyecto asignado"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin proyecto asignado</SelectItem>
                    {filteredProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}

export { HostingForm }
