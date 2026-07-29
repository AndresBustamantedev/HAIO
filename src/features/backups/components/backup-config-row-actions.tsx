"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { BackupConfigFormDrawer } from "@/features/backups/components/backup-config-form-drawer"
import { deleteBackupConfig } from "@/features/backups/actions/delete-backup-config"
import type { BackupConfigWithClient, ClientOption } from "@/features/backups/types"

function BackupConfigRowActions({ config, clientOptions }: { config: BackupConfigWithClient; clientOptions: ClientOption[] }) {
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
          <DropdownMenuItem render={<Link href={`/backups/${config.id}`} />}>
            <EyeIcon />
            Ver historial
          </DropdownMenuItem>
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

      <BackupConfigFormDrawer open={editOpen} onOpenChange={setEditOpen} config={config} clientOptions={clientOptions} />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={config.name}
        onConfirm={async () => {
          const result = await deleteBackupConfig(config.id)
          if (result.error) {
            toast.error(result.error)
            return
          }
          toast.success("Configuración eliminada.")
          router.refresh()
        }}
      />
    </>
  )
}

export { BackupConfigRowActions }
