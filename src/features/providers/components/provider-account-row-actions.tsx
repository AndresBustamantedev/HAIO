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
import { ProviderAccountFormDrawer } from "@/features/providers/components/provider-account-form-drawer"
import { deleteProviderAccount } from "@/features/providers/actions/delete-provider-account"
import type { Provider, ProviderAccount } from "@/features/providers/types"

function ProviderAccountRowActions({
  account,
  providers,
}: {
  account: ProviderAccount
  providers: Pick<Provider, "id" | "name">[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
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

      <ProviderAccountFormDrawer open={editOpen} onOpenChange={setEditOpen} providers={providers} account={account} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={account.label}
        onConfirm={async () => {
          const result = await deleteProviderAccount(account.id)
          if (result.error) { toast.error(result.error); return }
          toast.success("Cuenta eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { ProviderAccountRowActions }
