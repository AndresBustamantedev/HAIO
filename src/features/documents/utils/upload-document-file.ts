"use client"

import { createClient } from "@/lib/supabase/client"
import { DOCUMENTS_BUCKET } from "@/features/documents/types"

/**
 * Uploads a file straight from the browser to the private `client-documents`
 * bucket (Storage RLS only requires the path's first segment to match an
 * organization the user belongs to — see 0011_storage_policies.sql), then
 * returns everything `createDocument` needs to persist the metadata row.
 */
export async function uploadDocumentFile(file: File, organizationId: string, clientId?: string) {
  const supabase = createClient()
  const id = crypto.randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${organizationId}/${clientId || "general"}/${id}/${safeName}`

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    id,
    storagePath,
    originalFilename: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size,
  }
}
