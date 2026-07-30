import { LinkIcon } from 'lucide-react'

import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'

export default function IntegracionNotFound() {
  return (
    <PageContainer>
      <PageHeader title="Integración no encontrada" />
      <EmptyState
        icon={LinkIcon}
        title="No encontramos esta integración"
        description="Puede que haya sido eliminada o que no tengas acceso a ella."
        action={
          <Button variant="outline" render={<a href="/integraciones" />}>
            Volver a integraciones
          </Button>
        }
      />
    </PageContainer>
  )
}
