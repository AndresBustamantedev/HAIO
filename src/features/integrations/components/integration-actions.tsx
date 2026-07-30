'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  LoaderIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PowerIcon,
  Trash2Icon,
  WifiIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { syncIntegrationNow } from '@/features/integrations/actions/sync-now'
import { testIntegrationConnection } from '@/features/integrations/actions/test-connection'
import { disableIntegration, enableIntegration } from '@/features/integrations/actions/disable-integration'
import { deleteIntegration } from '@/features/integrations/actions/delete-integration'
import type { Integration } from '@/features/integrations/types'

export function IntegrationActions({ integration }: { integration: Integration }) {
  const [syncLoading, setSyncLoading] = React.useState(false)
  const [testLoading, setTestLoading] = React.useState(false)
  const [toggleLoading, setToggleLoading] = React.useState(false)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

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

  async function handleToggle() {
    setToggleLoading(true)
    try {
      const result = isDisabled
        ? await enableIntegration(integration.id)
        : await disableIntegration(integration.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isDisabled ? 'Integración activada.' : 'Integración desactivada.')
      }
    } finally {
      setToggleLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const result = await deleteIntegration(integration.id)
    // Si no hay error la Server Action hace redirect, el componente se desmonta.
    // Solo llegamos aquí si hubo error.
    if (result?.error) {
      toast.error(result.error)
      setDeleteLoading(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Más opciones" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={toggleLoading} onClick={handleToggle}>
              {toggleLoading
                ? <LoaderIcon className="size-4 animate-spin" />
                : <PowerIcon className="size-4" />}
              {isDisabled ? 'Activar integración' : 'Desactivar integración'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon className="size-4" />
              Eliminar integración
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Eliminar integración?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se desactivará la sincronización y la integración quedará archivada.
            Los recursos externos ya importados no se perderán.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={deleteLoading} />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" disabled={deleteLoading} onClick={handleDelete}>
              {deleteLoading && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
