"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type Stage = "exchanging" | "ready" | "done" | "error"

function NewPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [stage, setStage] = React.useState<Stage>("exchanging")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    const code = searchParams.get("code")
    if (!code) {
      setStage("error")
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStage("error")
      } else {
        setStage("ready")
      }
    })
  }, [searchParams])

  function handleUpdate() {
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error("No se pudo actualizar la contraseña. El enlace puede haber expirado.")
        return
      }
      setStage("done")
      setTimeout(() => router.push("/"), 2000)
    })
  }

  if (stage === "exchanging") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Verificando enlace...</p>
      </div>
    )
  }

  if (stage === "error") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <svg className="size-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-foreground">Enlace no válido</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Este enlace ha expirado o ya fue usado. Solicita uno nuevo.
          </p>
        </div>
        <Link href="/login/recuperar" className="text-sm text-primary hover:underline">
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (stage === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <svg className="size-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-foreground">Contraseña actualizada</p>
          <p className="mt-1 text-sm text-muted-foreground">Redirigiendo al panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
          Nueva contraseña
        </label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
          Confirmar contraseña
        </label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleUpdate() }}
        />
      </div>

      <Button onClick={handleUpdate} disabled={isPending} className="w-full">
        {isPending ? "Guardando..." : "Establecer nueva contraseña"}
      </Button>
    </div>
  )
}

export { NewPasswordForm }
