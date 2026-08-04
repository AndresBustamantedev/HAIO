"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { revealEmailPassword } from "@/features/email-accounts/actions/reveal-email-password"

export function RevealPasswordButton({ accountId }: { accountId: string }) {
  const [state, setState] = React.useState<"idle" | "loading" | "visible">("idle")
  const [password, setPassword] = React.useState<string | null>(null)

  async function handleReveal() {
    if (state === "visible") {
      setState("idle")
      setPassword(null)
      return
    }
    setState("loading")
    const result = await revealEmailPassword(accountId)
    if (result.error) {
      toast.error(result.error)
      setState("idle")
      return
    }
    setPassword(result.password)
    setState("visible")
  }

  function handleCopy() {
    if (!password) return
    navigator.clipboard.writeText(password).then(() => toast.success("Contraseña copiada."))
  }

  return (
    <div className="flex items-center gap-1.5">
      {state === "visible" && password ? (
        <span className="font-mono text-xs text-foreground bg-muted px-2 py-0.5 rounded select-all">
          {password}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">••••••••</span>
      )}
      <button
        type="button"
        onClick={handleReveal}
        disabled={state === "loading"}
        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        aria-label={state === "visible" ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {state === "visible" ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
      </button>
      {state === "visible" && password && (
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copiar contraseña"
        >
          <CopyIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
