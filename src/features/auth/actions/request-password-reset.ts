"use server"

import { createClient } from "@/lib/supabase/server"

type Result = { error: string | null }

export async function requestPasswordReset(email: string): Promise<Result> {
  if (!email || !email.includes("@")) {
    return { error: "Introduce un email válido." }
  }

  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login/nueva-clave`

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  })

  if (error) {
    return { error: "No se pudo enviar el email. Inténtalo de nuevo." }
  }

  // Always return success — don't reveal whether the email exists
  return { error: null }
}
