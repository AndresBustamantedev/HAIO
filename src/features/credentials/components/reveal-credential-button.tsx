"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon, CopyIcon, CheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { revealCredential } from "@/features/credentials/actions/reveal-credential"

const AUTO_HIDE_MS = 30_000

function RevealCredentialButton({ credentialId }: { credentialId: string }) {
  const [secret, setSecret] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const [copied, setCopied] = React.useState(false)
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearSecret() {
    setSecret(null)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
  }

  function handleReveal() {
    startTransition(async () => {
      const result = await revealCredential(credentialId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setSecret(result.secret)
      // Auto-hide after AUTO_HIDE_MS
      hideTimerRef.current = setTimeout(clearSecret, AUTO_HIDE_MS)
    })
  }

  async function handleCopy() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar al portapapeles.")
    }
  }

  // Clear on unmount
  React.useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }, [])

  if (secret) {
    return (
      <div className="flex items-center gap-1.5">
        <code className="max-w-[180px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {secret}
        </code>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copiar"
          onClick={handleCopy}
        >
          {copied ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ocultar"
          onClick={clearSecret}
        >
          <EyeOffIcon className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReveal}
      disabled={isPending}
      className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
    >
      {isPending ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <EyeIcon className="size-3.5" />
      )}
      Revelar
    </Button>
  )
}

export { RevealCredentialButton }
