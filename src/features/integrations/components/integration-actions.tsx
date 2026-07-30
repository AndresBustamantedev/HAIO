'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { LoaderIcon, PlayIcon, WifiIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { syncIntegrationNow } from '@/features/integrations/actions/sync-now'
import { testIntegrationConnection } from '@/features/integrations/actions/test-connection'
import type { Integration } from '@/features/integrations/types'

export function IntegrationActions({ integration }: { integration: Integration }) {
  const [syncLoading, setSyncLoading] = React.useState(false)
  const [testLoading, setTestLoading] = React.useState(false)

  const isDisabled = integration.status === 'disabled'

  async function handleSync() {
    setSyncLoading(true)
    try {
      const result = await syncIntegrationNow(integration.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        const msg = [
          result.resourcesFound !== undefined && `${result.resourcesFound} encontrados`,
          result.resourcesCreated !== undefined && result.resourcesCreated > 0 && `${result.resourcesCreated} nuevos`,
          result.resourcesUpdated !== undefined && result.resourcesUpdated > 0 && `${result.resourcesUpdated} actualizados`,
        ]
          .filter(Boolean)
          .join(' · ')
        toast.success(msg ? `Sincronización completada — ${msg}` : 'Sincronización completada.')
      }
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleTest() {
    setTestLoading(true)
    try {
      const result = await testIntegrationConnection(integration.id)
      if (result.success) {
        toast.success(result.userMessage ?? 'Conexión verificada correctamente.')
      } else {
        toast.error(result.error ?? 'La prueba de conexión falló.')
      }
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isDisabled || testLoading}
        onClick={handleTest}
      >
        {testLoading
          ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
          : <WifiIcon className="mr-1.5 size-3.5" />}
        Probar conexión
      </Button>
      <Button
        size="sm"
        disabled={isDisabled || syncLoading}
        onClick={handleSync}
      >
        {syncLoading
          ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
          : <PlayIcon className="mr-1.5 size-3.5" />}
        Sincronizar ahora
      </Button>
    </div>
  )
}
