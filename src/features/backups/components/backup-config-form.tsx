"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { BACKUP_STATUSES, backupConfigSchema, type BackupConfigInput } from "@/features/backups/schemas/backup-config-schema"
import { getBackupStatusBadge } from "@/features/backups/utils/status"
import type { ClientOption } from "@/features/backups/types"

type BackupConfigFormProps = {
  defaultValues?: Partial<BackupConfigInput>
  clientOptions: ClientOption[]
  onSubmit: (values: BackupConfigInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function BackupConfigForm({ defaultValues, clientOptions, onSubmit, onSuccess, submitLabel = "Guardar" }: BackupConfigFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<BackupConfigInput>({
    resolver: zodResolver(backupConfigSchema),
    defaultValues: {
      name: "",
      provider_name: "",
      frequency: "daily",
      retention_days: "30",
      status: "pending",
      client_id: "",
      ...defaultValues,
    },
  })

  function handleSubmit(values: BackupConfigInput) {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl render={<Input placeholder="Backup diario web Acme" {...field} />} />
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
                  <FormControl render={<Input placeholder="AWS S3, Backblaze..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia *</FormLabel>
                  <FormControl render={<Input placeholder="daily, weekly..." {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="retention_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retención (días) *</FormLabel>
                  <FormControl render={<Input inputMode="numeric" {...field} />} />
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {BACKUP_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getBackupStatusBadge(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}

export { BackupConfigForm }
