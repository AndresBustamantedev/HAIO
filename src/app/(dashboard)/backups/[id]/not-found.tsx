import { DatabaseBackupIcon } from "lucide-react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"

export default function BackupNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Configuración no encontrada" />
      <EmptyState
        icon={DatabaseBackupIcon}
        title="No encontramos esta configuración"
        description="Puede que haya sido eliminada o que no tengas acceso a ella."
        action={
          <Button variant="outline" render={<a href="/backups" />}>
            Volver a backups
          </Button>
        }
      />
    </PageContainer>
  )
}
