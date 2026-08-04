"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { EmailAccountFormDrawer } from "@/features/email-accounts/components/email-account-form-drawer"
import { deleteEmailAccount } from "@/features/email-accounts/actions/delete-email-account"
import type { EmailAccount, EmailServiceOption } from "@/features/email-accounts/types"

function EmailAccountRowActions({
  account,
  serviceOptions,
}: {
  account: EmailAccount
  serviceOptions: EmailServiceOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Acciones">
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmailAccountFormDrawer open={editOpen} onOpenChange={setEditOpen} serviceOptions={serviceOptions} account={account} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={account.address}
        onConfirm={async () => {
          const result = await deleteEmailAccount(account.id)
          if (result.error) { toast.error(result.error); return }
          toast.success("Cuenta eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { EmailAccountRowActions }
