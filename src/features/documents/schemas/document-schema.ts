import { z } from "zod"

export const DOCUMENT_CATEGORIES = [
  "contract",
  "quote",
  "invoice",
  "receipt",
  "brief",
  "report",
  "credential_export",
  "legal",
  "other",
] as const

export const documentMetaSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  category: z.enum(DOCUMENT_CATEGORIES),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  is_visible_to_client: z.boolean(),
})

export type DocumentMetaInput = z.infer<typeof documentMetaSchema>
