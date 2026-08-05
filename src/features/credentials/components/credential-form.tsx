"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { LockIcon, EyeIcon, FolderIcon } from "lucide-react"

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
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

type CredentialFormProps = {
  defaultValues?: Partial<CredentialInput>
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
  onSubmit: (values: CredentialInput) => Promise<{ error: string | null }>
  onSuccess: () => void
  submitLabel?: string
}

function CredentialForm({
  defaultValues,
  clientOptions,
  projectOptions,
  onSubmit,
  onSuccess,
  submitLabel = "Guardar",
}: CredentialFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<CredentialInput>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      label: "",
      type: "website_admin",
      client_id: "",
      project_ids: [],
      username: "",
      login_url: "",
      secret_reference: "",
      expires_at: "",
      is_shared_with_client: false,
      notes: "",
      ...defaultValues,
    },
  })

  const selectedClientId = form.watch("client_id")
  const selectedProjectIds = form.watch("project_ids") ?? []

  // Projects filtered by selected client
  const filteredProjects = React.useMemo(
    () =>
      selectedClientId
        ? projectOptions.filter((p) => p.client_id === selectedClientId)
        : projectOptions,
    [selectedClientId, projectOptions],
  )

  // Clear project_ids when client changes and selected projects don't match new client
  React.useEffect(() => {
    if (selectedClientId) {
      const validIds = new Set(filteredProjects.map((p) => p.id))
      const current = form.getValues("project_ids") ?? []
      const filtered = current.filter((id) => validIds.has(id))
      if (filtered.length !== current.length) {
        form.setValue("project_ids", filtered)
      }
    }
  }, [selectedClientId, filteredProjects, form])

  function toggleProject(projectId: string, checked: boolean) {
    const current = form.getValues("project_ids") ?? []
    form.setValue(
      "project_ids",
      checked ? [...current, projectId] : current.filter((id) => id !== projectId),
    )
  }

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
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
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

          {/* Project multi-select */}
          {filteredProjects.length > 0 && (
            <FormField
              control={form.control}
              name="project_ids"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FolderIcon className="size-3.5 text-muted-foreground" />
                    Proyectos
                  </FormLabel>
                  <div className="rounded-md border p-3 space-y-2">
                    {filteredProjects.map((project) => (
                      <label
                        key={project.id}
                        className="flex items-center gap-2.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={(checked) => toggleProject(project.id, !!checked)}
                        />
                        <span className="text-sm">{project.name}</span>
                        {selectedProjectIds.length > 1 && selectedProjectIds.includes(project.id) && (
                          <span className="ml-auto text-xs text-muted-foreground">Compartida</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
              <FormItem>
                <FormLabel>Visibilidad</FormLabel>
                <div className="flex rounded-md border p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      !field.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LockIcon className="size-3.5" />
                    Solo admin
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      field.value
                        ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <EyeIcon className="size-3.5" />
                    Portal cliente
                  </button>
                </div>
                <FormMessage />
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
