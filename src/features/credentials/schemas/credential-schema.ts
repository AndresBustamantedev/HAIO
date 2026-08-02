import { z } from "zod"

export const CREDENTIAL_TYPES = [
  "website_admin",
  "hosting_panel",
  "domain_registrar",
  "ftp",
  "sftp",
  "ssh",
  "database",
  "email",
  "api",
  "social_media",
  "analytics",
  "license",
  "saas",
  "other",
] as const

export const credentialSchema = z.object({
  label: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  type: z.enum(CREDENTIAL_TYPES),
  client_id: z.string().uuid().optional().or(z.literal("")),
  username: z.string().trim().max(200).optional().or(z.literal("")),
  login_url: z.string().trim().max(300).optional().or(z.literal("")),
  secret_reference: z.string().trim().max(300).optional().or(z.literal("")),
  expires_at: z.string().trim().optional().or(z.literal("")),
  is_shared_with_client: z.boolean(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type CredentialInput = z.infer<typeof credentialSchema>
