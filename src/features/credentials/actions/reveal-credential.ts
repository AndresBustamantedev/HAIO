"use server"

import "server-only"
import { createDecipheriv } from "crypto"

import { createClient } from "@/lib/supabase/server"

type RevealResult =
  | { secret: string; error: null }
  | { secret: null; error: string }

/**
 * Secure credential reveal flow:
 * 1. Validate authenticated session.
 * 2. Fetch ONLY the ciphertext for the requested credential
 *    (RLS ensures the user belongs to the credential's org with owner/admin/manager role).
 * 3. Insert access log (action = 'view') while the user's session is active.
 * 4. Decrypt server-side using CREDENTIAL_ENCRYPTION_KEY env var.
 * 5. Return plaintext for this request only — never stored in cache, state, or HTML.
 *
 * NEVER returns secret_ciphertext to the client.
 * NEVER uses admin/service-role client.
 * NEVER calls an SQL function to decrypt.
 */
export async function revealCredential(credentialId: string): Promise<RevealResult> {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!key) {
    return { secret: null, error: "Cifrado no configurado en el servidor." }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { secret: null, error: "Sesión no válida." }
  }

  // Fetch only the ciphertext — RLS limits this to owner/admin/manager.
  // We explicitly request the raw table (not v_credentials_safe) because
  // v_credentials_safe intentionally excludes secret_ciphertext.
  const { data: credential, error: fetchError } = await supabase
    .from("credentials")
    .select("id, organization_id, secret_ciphertext, credential_mode")
    .eq("id", credentialId)
    .is("deleted_at", null)
    .maybeSingle()

  if (fetchError || !credential) {
    return { secret: null, error: "Credencial no encontrada o acceso denegado." }
  }

  if (credential.credential_mode !== "encrypted" || !credential.secret_ciphertext) {
    return { secret: null, error: "Esta credencial no tiene un secreto cifrado." }
  }

  // Log the access before returning the decrypted value.
  // If logging fails we still return an error — consistency matters here.
  const { error: logError } = await supabase.from("credential_access_logs").insert({
    credential_id: credentialId,
    user_id: user.id,
    action: "view" as const,
  })

  if (logError) {
    return { secret: null, error: "No se pudo registrar el acceso. Operación cancelada." }
  }

  try {
    const decrypted = decryptSecret(credential.secret_ciphertext as string, key)
    return { secret: decrypted, error: null }
  } catch {
    return { secret: null, error: "Error al descifrar el secreto." }
  }
}

/**
 * Decrypts AES-256-GCM ciphertext stored as a PostgreSQL bytea hex string.
 * Format stored: \x{iv(12 bytes)}{authTag(16 bytes)}{ciphertext}
 */
function decryptSecret(ciphertextHex: string, keyBase64: string): string {
  // PostgreSQL bytea comes back as \x<hex>
  const hex = ciphertextHex.startsWith("\\x")
    ? ciphertextHex.slice(2)
    : ciphertextHex.replace(/^0x/, "")

  const buf = Buffer.from(hex, "hex")

  if (buf.length < 12 + 16) {
    throw new Error("Ciphertext demasiado corto.")
  }

  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)

  const keyBuf = Buffer.from(keyBase64, "base64")
  const decipher = createDecipheriv("aes-256-gcm", keyBuf, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString("utf8")
}
