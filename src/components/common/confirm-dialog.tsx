"use client"

import * as React from "react"

import { Button, type buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { VariantProps } from "class-variance-authority"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"]
  onConfirm: () => Promise<void> | void
}

/**
 * Reusable confirmation modal for any critical, non-delete action (closing a
 * project, cancelling a subscription, etc.). For deletions, use
 * <DeleteDialog>, which is built on top of this component.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await onConfirm()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
