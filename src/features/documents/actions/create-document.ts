"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { documentMetaSchema, type DocumentMetaInput } from "@/features/documents/schemas/document-schema"
import { DOCUMENTS_BUCKET } from "@/features/documents/types"

type UploadedFileInfo = {
  id: string
  storagePath: string
  originalFilename: string
  mimeType: string | null
  sizeBytes: number
}

type ActionResult = { error: string | null }

/**
 * Persists the document's metadata row. The file itself is uploaded directly
 * from the browser to Storage beforehand (see `uploadDocumentFile`) — this
 * action only records the reference, after the upload has already succeeded.
 */
export async function createDocument(input: DocumentMetaInput, file: UploadedFileInfo): Promise<ActionResult> {
  const parsed = documentMetaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("documents").insert({
    id: file.id,
    organization_id: organization.organizationId,
    bucket_id: DOCUMENTS_BUCKET,
    storage_path: file.storagePath,
    original_filename: file.originalFilename,
    mime_type: file.mimeType,
    size_bytes: file.sizeBytes,
    title: parsed.data.title,
    category: parsed.data.category,
    client_id: parsed.data.client_id || null,
    project_id: parsed.data.project_id || null,
    description: parsed.data.description || null,
    is_visible_to_client: parsed.data.is_visible_to_client,
    uploaded_by: user?.id ?? null,
  })

  if (error) {
    return { error: "No se pudo registrar el documento. " + error.message }
  }

  revalidatePath("/documentos")
  if (parsed.data.client_id) revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
