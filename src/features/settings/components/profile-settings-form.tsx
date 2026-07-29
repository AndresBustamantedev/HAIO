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
import { profileSchema, type ProfileInput } from "@/features/settings/schemas/profile-schema"
import { updateProfile } from "@/features/settings/actions/update-profile"

function ProfileSettingsForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  function handleSubmit(values: ProfileInput) {
    setFormError(null)
    startTransition(async () => {
      const result = await updateProfile(values)
      if (result.error) {
        setFormError(result.error)
        return
      }
      toast.success("Perfil actualizado.")
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-foreground">Tu perfil</p>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl render={<Input {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos</FormLabel>
                <FormControl render={<Input {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="grid grid-cols-2 gap-3">
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
          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Idioma</FormLabel>
                <FormControl render={<Input placeholder="es" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </form>
    </Form>
  )
}

export { ProfileSettingsForm }
