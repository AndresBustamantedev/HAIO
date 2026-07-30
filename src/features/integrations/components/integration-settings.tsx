'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { LoaderIcon, PowerIcon, PowerOffIcon, RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  updateIntegrationSettingsSchema,
  type UpdateIntegrationSettingsInput,
} from '@/features/integrations/schemas/integration-schema'
import { updateIntegration } from '@/features/integrations/actions/update-integration'
import { disableIntegration, enableIntegration } from '@/features/integrations/actions/disable-integration'
import { RotateCredentialsDialog } from './rotate-credentials-dialog'
import type { Integration } from '@/features/integrations/types'

type SecretField = { type: string; label: string; isPassword: boolean }

export function IntegrationSettings({
  integration,
  secretFields,
}: {
  integration: Integration
  secretFields: SecretField[]
}) {
  const router = useRouter()
  const [togglingStatus, setTogglingStatus] = React.useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<UpdateIntegrationSettingsInput>({
      resolver: zodResolver(updateIntegrationSettingsSchema),
      defaultValues: {
        name: integration.name,
        sync_frequency: integration.sync_frequency,
        sync_enabled: integration.sync_enabled,
      },
    })

  const syncEnabled = watch('sync_enabled')

  async function onSubmit(data: UpdateIntegrationSettingsInput) {
    const result = await updateIntegration(integration.id, data)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Configuración guardada.')
      router.refresh()
    }
  }

  async function handleToggleStatus() {
    setTogglingStatus(true)
    try {
      const result = integration.status === 'disabled'
        ? await enableIntegration(integration.id)
        : await disableIntegration(integration.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(integration.status === 'disabled' ? 'Integración reactivada.' : 'Integración desactivada.')
        router.refresh()
      }
    } finally {
      setTogglingStatus(false)
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="setting-name">Nombre</Label>
          <Input id="setting-name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="setting-freq">Frecuencia de sync automática</Label>
          <Select
            value={watch('sync_frequency')}
            onValueChange={(v) => setValue('sync_frequency', v as 'hourly' | 'daily' | 'weekly')}
          >
            <SelectTrigger id="setting-freq">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Cada hora</SelectItem>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="sync-enabled"
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={syncEnabled}
            onChange={(e) => setValue('sync_enabled', e.target.checked)}
          />
          <Label htmlFor="sync-enabled">Sincronización automática activada</Label>
        </div>

        <Button type="submit" disabled={isSubmitting || integration.status === 'disabled'}>
          {isSubmitting && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
          Guardar cambios
        </Button>
      </form>

      <Separator />

      {/* Credenciales */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Credenciales</h3>
        <p className="text-sm text-muted-foreground">
          Tipos configurados: {integration.configured_secret_types.join(', ') || 'ninguno'}
        </p>
        <RotateCredentialsDialog
          integrationId={integration.id}
          secretFields={secretFields}
          trigger={
            <Button variant="outline" size="sm">
              <RotateCcwIcon className="mr-1.5 size-3.5" />
              Rotar credenciales
            </Button>
          }
        />
      </div>

      <Separator />

      {/* Activar / Desactivar */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-destructive">Zona de riesgo</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={togglingStatus}
          onClick={handleToggleStatus}
          className={integration.status !== 'disabled' ? 'text-destructive hover:bg-destructive/10' : ''}
        >
          {togglingStatus
            ? <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />
            : integration.status === 'disabled'
              ? <PowerIcon className="mr-1.5 size-3.5" />
              : <PowerOffIcon className="mr-1.5 size-3.5" />}
          {integration.status === 'disabled' ? 'Reactivar integración' : 'Desactivar integración'}
        </Button>
        <p className="text-xs text-muted-foreground">
          {integration.status === 'disabled'
            ? 'Reactivar devuelve la integración al estado "Desconectado".'
            : 'Desactivar detiene todas las sincronizaciones automáticas y la integración queda inaccesible.'}
        </p>
      </div>
    </div>
  )
}
