"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Short, unambiguous Spanish words easy to type
const WORDS = [
  "arena", "brisa", "calma", "duna", "faro", "glaciar", "hojas", "isla",
  "junco", "lago", "monte", "niebla", "orilla", "pico", "roca", "sierra",
  "trueno", "umbral", "valle", "viento",
]

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Name of the record being deleted, shown in the description. */
  itemLabel: string
  onConfirm: () => Promise<void> | void
  title?: string
}

function DeleteDialog({
  open,
  onOpenChange,
  itemLabel,
  onConfirm,
  title = "Eliminar registro",
}: DeleteDialogProps) {
  const [confirmWord, setConfirmWord] = React.useState(randomWord)
  const [typed, setTyped] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const canConfirm = typed === confirmWord

  // New word + clear input each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setConfirmWord(randomWord())
      setTyped("")
    }
  }, [open])

  function handleConfirm() {
    if (!canConfirm) return
    startTransition(async () => {
      await onConfirm()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Esta acción eliminará{" "}
            <strong className="text-foreground">{itemLabel}</strong>. No podrás
            deshacerlo desde aquí.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Para confirmar, escribe{" "}
            <span className="font-mono font-semibold text-foreground">
              {confirmWord}
            </span>{" "}
            en el campo:
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            placeholder="Escribe la palabra..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={isPending}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteDialog }
