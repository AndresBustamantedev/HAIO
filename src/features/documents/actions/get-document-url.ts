"use server"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { DOCUMENTS_BUCKET } from "@/features/documents/types"

type ActionResult = { error: string | null; url?: string }

/** The bucket is private — every download goes through a short-lived signed URL. */
export async function getDocumentUrl(storagePath: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(storagePath, 60)

  if (error || !data) {
    return { error: "No se pudo generar el enlace de descarga. " + (error?.message ?? "") }
  }

  return { error: null, url: data.signedUrl }
}
