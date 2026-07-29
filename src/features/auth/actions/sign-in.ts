"use server"

import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/features/auth/schemas/login-schema"

type SignInResult = { error: string } | { error: null }

/**
 * Signs a user in with email/password. Validation happens twice: RHF+Zod on
 * the client for instant feedback, and again here because the client can
 * never be trusted.
 */
export async function signIn(input: { email: string; password: string }): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return { error: "Datos de acceso no válidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: "Email o contraseña incorrectos." }
  }

  return { error: null }
}
