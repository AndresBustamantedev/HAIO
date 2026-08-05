"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setCredentialSecret } from "@/features/credentials/actions/set-credential-secret"

function SetSecretDialog({
  credentialId,
  credentialLabel,
  open,
  onOpenChange,
}: {
  credentialId: string
  credentialLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [value, setValue] = React.useState("")
  const [showSecret, setShowSecret] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!open) {
      setValue("")
      setShowSecret(false)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await setCredentialSecret(credentialId, value)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Contraseña guardada cifrada.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Establecer contraseña</DialogTitle>
          <DialogDescription>
            La contraseña se cifra con AES-256-GCM antes de guardarse. La clave de cifrado nunca toca la base de datos.
          </DialogDescription>
        </DialogHeader>

        <form id="set-secret-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="credential-label-display" className="text-muted-foreground text-xs">
              Credencial
            </Label>
            <p id="credential-label-display" className="text-sm font-medium">{credentialLabel}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="secret-input">Contraseña / Secreto</Label>
            <div className="relative">
              <Input
                id="secret-input"
                type={showSecret ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Introduce la contraseña..."
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={showSecret ? "Ocultar" : "Mostrar"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                onClick={() => setShowSecret((v) => !v)}
              >
                {showSecret ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="set-secret-form" disabled={isPending || !value}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cifrada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SetSecretDialog }
