"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FormDrawer } from "@/components/common/form-drawer"
import { BackupConfigForm } from "@/features/backups/components/backup-config-form"
import { createBackupConfig } from "@/features/backups/actions/create-backup-config"
import { updateBackupConfig } from "@/features/backups/actions/update-backup-config"
import type { BackupConfigWithClient, ClientOption } from "@/features/backups/types"

type BackupConfigFormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientOptions: ClientOption[]
  config?: BackupConfigWithClient
  defaultClientId?: string
}

function BackupConfigFormDrawer({ open, onOpenChange, clientOptions, config, defaultClientId }: BackupConfigFormDrawerProps) {
  const router = useRouter()
  const isEdit = !!config

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar configuración de backup" : "Nueva configuración de backup"}
      description={isEdit ? config.name : "Define una configuración de copias de seguridad."}
    >
      <BackupConfigForm
        clientOptions={clientOptions}
        defaultValues={
          config
            ? {
                name: config.name,
                provider_name: config.provider_name,
                frequency: config.frequency,
                retention_days: String(config.retention_days),
                status: config.status,
                client_id: config.client_id ?? "",
              }
            : defaultClientId
              ? { client_id: defaultClientId }
              : undefined
        }
        onSubmit={(values) => (isEdit ? updateBackupConfig(config.id, values) : createBackupConfig(values))}
        onSuccess={() => {
          toast.success(isEdit ? "Configuración actualizada." : "Configuración creada.")
          onOpenChange(false)
          router.refresh()
        }}
        submitLabel={isEdit ? "Guardar cambios" : "Crear configuración"}
      />
    </FormDrawer>
  )
}

export { BackupConfigFormDrawer }
