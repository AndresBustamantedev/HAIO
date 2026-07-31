'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CheckCircleIcon, LoaderIcon, XCircleIcon } from 'lucide-react'

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
import { createIntegrationSchema, type CreateIntegrationInput } from '@/features/integrations/schemas/integration-schema'
import { createIntegration } from '@/features/integrations/actions/create-integration'
import { preTestConnection } from '@/features/integrations/actions/pre-test-connection'

type SecretDef = { type: string; label: string; description: string; isPassword: boolean; optional?: boolean }

type Props = {
  connectorType: string
  connectorDisplayName: string
  requiredSecrets: ReadonlyArray<SecretDef>
  supportedEnvironments: ReadonlyArray<'production' | 'sandbox'>
}

export function CreateIntegrationForm({
  connectorType,
  connectorDisplayName,
  requiredSecrets,
  supportedEnvironments,
}: Props) {
  const router = useRouter()
  const [testResult, setTestResult] = React.useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMessage, setTestMessage] = React.useState<string>('')

  const form = useForm<CreateIntegrationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createIntegrationSchema) as any,
    defaultValues: {
      connector_type: connectorType,
      environment: 'production',
      sync_frequency: 'daily',
      sync_enabled: false,
      name: '',
      secrets: {},
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form
  const environment = watch('environment') as 'production' | 'sandbox'

  async function handlePreTest() {
    const values = form.getValues()
    const secrets: Record<string, string> = {}
    for (const s of requiredSecrets) {
      const val = values.secrets?.[s.type]?.trim()
      if (!val && !s.optional) {
        toast.error(`Introduce el campo "${s.label}" antes de probar.`)
        return
      }
      if (val) secrets[s.type] = val
    }
    setTestResult('testing')
    setTestMessage('')
    const result = await preTestConnection({ connector_type: connectorType, environment, secrets })
    if (result.error) {
      setTestResult('fail')
      setTestMessage(result.error)
    } else {
      setTestResult('ok')
      setTestMessage(result.userMessage ?? 'Conexión verificada.')
    }
  }

  async function onSubmit(data: CreateIntegrationInput) {
    // Filtrar secretos vacíos antes de enviar (los opcionales pueden quedar en blanco)
    const cleanSecrets: Record<string, string> = {}
    for (const [k, v] of Object.entries(data.secrets ?? {})) {
      if (v && v.trim()) cleanSecrets[k] = v.trim()
    }
    const result = await createIntegration({ ...data, secrets: cleanSecrets })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Integración creada correctamente.')
    router.push(`/integraciones/${result.integrationId}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Nombre (opcional) */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre de la integración</Label>
        <Input
          id="name"
          placeholder={`Mi cuenta de ${connectorDisplayName}`}
          {...register('name')}
        />
        <p className="text-xs text-muted-foreground">
          Si lo dejas vacío se generará un nombre automático.
        </p>
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Entorno */}
      {supportedEnvironments.length > 1 && (
        <div className="space-y-1.5">
          <Label htmlFor="environment">Entorno</Label>
          <Select
            value={environment}
            onValueChange={(v) => setValue('environment', v as 'production' | 'sandbox')}
          >
            <SelectTrigger id="environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedEnvironments.includes('production') && (
                <SelectItem value="production">Producción</SelectItem>
              )}
              {supportedEnvironments.includes('sandbox') && (
                <SelectItem value="sandbox">Sandbox / OTE</SelectItem>
              )}
            </SelectContent>
          </Select>
          {environment === 'sandbox' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              El entorno sandbox usa credenciales de prueba separadas.
            </p>
          )}
        </div>
      )}

      {/* Credenciales */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Credenciales de acceso</legend>
        {requiredSecrets.map((secret) => (
          <div key={secret.type} className="space-y-1.5">
            <Label htmlFor={`secret_${secret.type}`}>
              {secret.label}
              {secret.optional && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
              )}
            </Label>
            <Input
              id={`secret_${secret.type}`}
              type={secret.isPassword ? 'password' : 'text'}
              autoComplete="off"
              placeholder={secret.description}
              {...register(`secrets.${secret.type}`)}
            />
            {errors.secrets?.[secret.type] && (
              <p className="text-xs text-destructive">{errors.secrets[secret.type]?.message}</p>
            )}
          </div>
        ))}
      </fieldset>

      {/* Frecuencia de sync */}
      <div className="space-y-1.5">
        <Label htmlFor="sync_frequency">Frecuencia de sincronización automática</Label>
        <Select
          defaultValue="daily"
          onValueChange={(v) => setValue('sync_frequency', v as 'hourly' | 'daily' | 'weekly')}
        >
          <SelectTrigger id="sync_frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">Cada hora</SelectItem>
            <SelectItem value="daily">Diaria</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          La sincronización automática solo se activa cuando la integración esté conectada.
        </p>
      </div>

      {/* Test resultado */}
      {testResult === 'ok' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          {testMessage}
        </div>
      )}
      {testResult === 'fail' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <XCircleIcon className="size-4 shrink-0" />
          {testMessage}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={testResult === 'testing'}
          onClick={handlePreTest}
        >
          {testResult === 'testing' && <LoaderIcon className="mr-2 size-4 animate-spin" />}
          Probar conexión
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderIcon className="mr-2 size-4 animate-spin" />}
          Guardar integración
        </Button>
      </div>
    </form>
  )
}
