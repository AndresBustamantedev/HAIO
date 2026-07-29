"use server"

import "server-only"
import { createCipheriv, randomBytes } from "crypto"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type SetSecretResult = { error: string | null }

/**
 * Encrypts a plaintext secret with AES-256-GCM and persists only the
 * ciphertext. The key NEVER touches the database.
 *
 * Security guarantees:
 * - Key comes from process.env.CREDENTIAL_ENCRYPTION_KEY (server-only)
 * - IV is generated fresh for every call
 * - Auth tag is stored alongside the ciphertext (GCM integrity)
 * - credential_mode is set to 'encrypted', secret_reference is cleared
 */
export async function setCredentialSecret(
  credentialId: string,
  plaintext: string,
): Promise<SetSecretResult> {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!key) {
    return { error: "Cifrado no configurado en el servidor." }
  }

  if (!plaintext) {
    return { error: "El secreto no puede estar vacío." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const allowedRoles = ["owner", "admin", "manager"]
  if (!allowedRoles.includes(organization.role)) {
    return { error: "No tienes permiso para guardar secretos." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Confirm the credential belongs to the user's organization (RLS also enforces this).
  const { data: existing, error: fetchError } = await supabase
    .from("credentials")
    .select("id")
    .eq("id", credentialId)
    .eq("organization_id", organization.organizationId)
    .is("deleted_at", null)
    .maybeSingle()

  if (fetchError || !existing) {
    return { error: "Credencial no encontrada." }
  }

  let ciphertextHex: string
  try {
    ciphertextHex = encryptSecret(plaintext, key)
  } catch {
    return { error: "Error al cifrar el secreto." }
  }

  // secret_ciphertext is bytea — PostgREST accepts the \x<hex> literal.
  const { error: updateError } = await supabase
    .from("credentials")
    .update({
      secret_ciphertext: ciphertextHex,
      credential_mode: "encrypted",
      secret_reference: null,
      updated_by: user?.id ?? null,
    })
    .eq("id", credentialId)
    .eq("organization_id", organization.organizationId)

  if (updateError) {
    return { error: "No se pudo guardar el secreto cifrado. " + updateError.message }
  }

  await supabase.from("credential_access_logs").insert({
    credential_id: credentialId,
    user_id: user?.id ?? null,
    action: "update" as const,
  })

  revalidatePath("/credenciales")

  return { error: null }
}

/**
 * Encrypts plaintext with AES-256-GCM.
 * Returns a PostgreSQL bytea hex literal: \x{iv(12)}{authTag(16)}{ciphertext}
 */
function encryptSecret(plaintext: string, keyBase64: string): string {
  const iv = randomBytes(12)
  const keyBuf = Buffer.from(keyBase64, "base64")
  const cipher = createCipheriv("aes-256-gcm", keyBuf, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  const packed = Buffer.concat([iv, authTag, encrypted])
  return `\\x${packed.toString("hex")}`
}
