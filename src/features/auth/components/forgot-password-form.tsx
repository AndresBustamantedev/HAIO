"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/features/auth/actions/request-password-reset"

function ForgotPasswordForm() {
  const [isPending, startTransition] = React.useTransition()
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleSend() {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Introduce un email válido.")
      return
    }

    startTransition(async () => {
      const result = await requestPasswordReset(trimmed)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg className="size-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-foreground">Email enviado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Si existe una cuenta con <span className="font-medium">{email}</span>, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Revisa también la carpeta de spam.</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recovery-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="recovery-email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
        />
      </div>

      <Button onClick={handleSend} disabled={isPending} className="w-full">
        {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Volver al inicio de sesión
      </Link>
    </div>
  )
}

export { ForgotPasswordForm }
