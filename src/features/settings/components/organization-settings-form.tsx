"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { organizationSchema, type OrganizationInput } from "@/features/settings/schemas/organization-schema"
import { updateOrganization } from "@/features/settings/actions/update-organization"

function OrganizationSettingsForm({ defaultValues, canEdit }: { defaultValues: OrganizationInput; canEdit: boolean }) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues,
  })

  function handleSubmit(values: OrganizationInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await updateOrganization(values)
      if (result.error) {
        setFormError(result.error)
        return
      }
      toast.success("Organización actualizada.")
    })
  }

  return (
    <Form {...form}>
      <fieldset disabled={!canEdit} className="contents">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Datos de la organización</p>
            {!canEdit ? <p className="text-xs text-muted-foreground">Solo lectura para tu rol</p> : null}
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="legal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón social</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIF / CIF</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl render={<Input type="email" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio web</FormLabel>
                <FormControl render={<Input {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_line_1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl render={<Input {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código postal</FormLabel>
                  <FormControl render={<Input {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País (ISO-2)</FormLabel>
                  <FormControl render={<Input placeholder="ES" {...field} />} />
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
                  <FormControl render={<Input placeholder="EUR" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona horaria</FormLabel>
                  <FormControl render={<Input placeholder="Europe/Madrid" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          {canEdit ? (
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? "Guardando..." : "Guardar organización"}
            </Button>
          ) : null}
        </form>
      </fieldset>
    </Form>
  )
}

export { OrganizationSettingsForm }
