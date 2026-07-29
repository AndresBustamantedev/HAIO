"use client"

import { ConfirmDialog } from "@/components/common/confirm-dialog"

type DeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Name of the record being deleted, shown in the description. */
  itemLabel: string
  onConfirm: () => Promise<void> | void
  title?: string
};

/** Destructive confirmation, preset for delete/soft-delete actions. */
function DeleteDialog({
  open,
  onOpenChange,
  itemLabel,
  onConfirm,
  title = "Eliminar registro",
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={`Esta acción eliminará "${itemLabel}". No podrás deshacerlo desde aquí.`}
      confirmLabel="Eliminar"
      confirmVariant="destructive"
      onConfirm={onConfirm}
    />
  )
}

export { DeleteDialog }
