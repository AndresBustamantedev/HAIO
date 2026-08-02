"use client"

import * as React from "react"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { revealCredential } from "@/features/credentials/actions/reveal-credential"
import { deleteCredential } from "@/features/credentials/actions/delete-credential"

type Props = {
  credentialId: string
  hasSecret: boolean
  projectId: string
}

export function VaultCredentialActions({ credentialId, hasSecret, projectId: _ }: Props) {
  const [revealed, setRevealed] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()

  function handleReveal() {
    if (revealed) {
      setRevealed(null)
      return
    }
    startTransition(async () => {
      const result = await revealCredential(credentialId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setRevealed(result.secret)
    })
  }

  function handleDelete() {
    if (!confirm("¿Eliminar esta credencial? Esta acción no se puede deshacer.")) return
    startDelete(async () => {
      const result = await deleteCredential(credentialId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Credencial eliminada.")
    })
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-1">
        {hasSecret ? (
          <Button variant="ghost" size="icon" onClick={handleReveal} disabled={isPending} title={revealed ? "Ocultar" : "Revelar secreto"}>
            {revealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Eliminar">
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </div>
      {revealed ? (
        <div className="rounded-md border bg-muted px-3 py-1.5 font-mono text-xs text-foreground select-all max-w-[240px] break-all">
          {revealed}
        </div>
      ) : null}
    </div>
  )
}
