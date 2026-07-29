"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
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
import { DOCUMENT_CATEGORIES, documentMetaSchema, type DocumentMetaInput } from "@/features/documents/schemas/document-schema"
import { getDocumentCategoryLabel } from "@/features/documents/utils/labels"
import { uploadDocumentFile } from "@/features/documents/utils/upload-document-file"
import { createDocument } from "@/features/documents/actions/create-document"
import type { ClientOption } from "@/features/documents/types"

type DocumentUploadDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  clientOptions: ClientOption[]
}

function DocumentUploadDrawer({ open, onOpenChange, organizationId, clientOptions }: DocumentUploadDrawerProps) {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<DocumentMetaInput>({
    resolver: zodResolver(documentMetaSchema),
    defaultValues: {
      title: "",
      category: "other",
      client_id: "",
      project_id: "",
      description: "",
      is_visible_to_client: false,
    },
  })

  function handleSubmit(values: DocumentMetaInput) {
    setFormError(null)

    if (!file) {
      setFormError("Selecciona un archivo para subir.")
      return
    }

    startTransition(async () => {
      try {
        const uploaded = await uploadDocumentFile(file, organizationId, values.client_id || undefined)
        const result = await createDocument(values, {
          id: uploaded.id,
          storagePath: uploaded.storagePath,
          originalFilename: uploaded.originalFilename,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        })
        if (result.error) {
          setFormError(result.error)
          return
        }
        toast.success("Documento subido.")
        form.reset()
        setFile(null)
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        setFormError((error as Error).message ?? "No se pudo subir el archivo.")
      }
    })
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Subir documento" description="Sube un archivo y describe su contexto.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="document-file">
              Archivo *
            </label>
            <input
              id="document-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            {file ? <p className="text-xs text-muted-foreground">{file.name}</p> : null}
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl render={<Input placeholder="Contrato firmado" {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getDocumentCategoryLabel(category)}
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
                      <SelectItem value="none">Sin cliente</SelectItem>
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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl render={<Textarea rows={2} {...field} />} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_visible_to_client"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                <FormLabel className="font-normal">Visible para el cliente en el portal</FormLabel>
              </FormItem>
            )}
          />

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <Button type="submit" disabled={isPending} className="mt-1">
            {isPending ? "Subiendo..." : "Subir documento"}
          </Button>
        </form>
      </Form>
    </FormDrawer>
  )
}

export { DocumentUploadDrawer }
