"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  emailAccountSchema,
  type EmailAccountInput,
} from "@/features/email-accounts/schemas/email-account-schema"
import { encryptSecret } from "@/features/integrations/services/encryption"

type ActionResult = { error: string | null }

function parseForwardsTo(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function updateEmailAccount(id: string, input: EmailAccountInput): Promise<ActionResult> {
  const parsed = emailAccountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createClient()
  const d = parsed.data

  let passwordCiphertext: Buffer | undefined
  if (d.password) {
    try {
      passwordCiphertext = encryptSecret(d.password).buffer
    } catch {
      return { error: "No se pudo cifrar la contraseña." }
    }
  }

  const { error } = await (supabase as any)
    .from("email_accounts")
    .update({
      email_service_id: d.email_service_id,
      address: d.address,
      display_name: d.display_name || null,
      status: d.status,
      quota_mb: d.quota_mb ? Number(d.quota_mb) : null,
      forwards_to: parseForwardsTo(d.forwards_to),
      notes: d.notes || null,
      ...(passwordCiphertext
        ? { password_ciphertext: `\\x${passwordCiphertext.toString("hex")}` }
        : {}),
    })
    .eq("id", id)

  if (error) {
    return { error: "No se pudo actualizar la cuenta de correo. " + error.message }
  }

  revalidatePath("/correos")

  return { error: null }
}
