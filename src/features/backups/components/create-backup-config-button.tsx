"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BackupConfigFormDrawer } from "@/features/backups/components/backup-config-form-drawer"
import type { ClientOption } from "@/features/backups/types"

function CreateBackupConfigButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nueva configuración
      </Button>
      <BackupConfigFormDrawer open={open} onOpenChange={setOpen} clientOptions={clientOptions} />
    </>
  )
}

export { CreateBackupConfigButton }
