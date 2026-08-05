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
import { DOMAIN_STATUSES, domainSchema, type DomainInput } from "@/features/domains/schemas/domain-schema"
import { getDomainStatusBadge } from "@/features/domains/utils/status"
import type { ClientOption, ProjectOption } from "@/features/domains/types"

type DomainFormProps = {
  defaultValues?: Partial<DomainInput>
  clientOptions: ClientOption[]
  projectOptions?: ProjectOption[]
  onSubmit: (values: DomainInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function DomainForm({ defaultValues, clientOptions, projectOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: DomainFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<DomainInput>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      client_id: "",
      domain_name: "",
      status: "active",
      registrar_name: "",
      registered_on: "",
      expires_on: "",
      renewal_price: "",
      auto_renew: true,
      managed_by_us: true,
      privacy_enabled: true,
      notes: "",
      project_id: "",
      ...defaultValues,
    },
  })

  const selectedClientId = form.watch("client_id")
  const filteredProjects = (projectOptions ?? []).filter((p) => p.client_id === selectedClientId)

  const prevClientId = React.useRef(selectedClientId)
  React.useEffect(() => {
    if (prevClientId.current !== selectedClientId) {
      form.setValue("project_id", "")
      prevClientId.current = selectedClientId
    }
  }, [selectedClientId, form])

  function handleSubmit(values: DomainInput) {
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
                      <SelectValue placeholder="Sin proyecto asignado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin proyecto asignado</SelectItem>
                      {filteredProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="domain_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dominio *</FormLabel>
                <FormControl render={<Input placeholder="ejemplo.com" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} items={Object.fromEntries(DOMAIN_STATUSES.map((s) => [s, getDomainStatusBadge(s).label]))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getDomainStatusBadge(status).label}
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
              name="registrar_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrador</FormLabel>
                  <FormControl render={<Input placeholder="GoDaddy, Namecheap..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-foreground">Fechas y precio</legend>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="registered_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrado el</FormLabel>
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
                  <FormLabel>Expira el</FormLabel>
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
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-foreground">Opciones</legend>

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
          <FormField
            control={form.control}
            name="managed_by_us"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Gestionado por nosotros</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="privacy_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Privacidad WHOIS activa</FormLabel>
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

export { DomainForm }
