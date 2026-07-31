'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoaderIcon, ShieldAlertIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { rotateIntegrationCredentials } from '@/features/integrations/actions/rotate-credentials'

type SecretField = { type: string; label: string; isPassword: boolean; optional?: boolean }

export function RotateCredentialsDialog({
  integrationId,
  secretFields,
  trigger,
}: {
  integrationId: string
  secretFields: SecretField[]
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)

  function handleChange(type: string, val: string) {
    setValues((prev) => ({ ...prev, [type]: val }))
  }

  async function handleSubmit() {
    const missing = secretFields.filter((f) => !f.optional && !values[f.type]?.trim())
    if (missing.length > 0) {
      toast.error(`Completa los campos obligatorios: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    setSubmitting(true)
    try {
      const result = await rotateIntegrationCredentials(integrationId, { secrets: values })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Credenciales actualizadas. La integración requiere una nueva prueba de conexión.')
        setOpen(false)
        setValues({})
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setValues({}) }}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlertIcon className="size-4 text-amber-500" />
            Rotar credenciales
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Las nuevas credenciales reemplazarán las actuales. La integración pasará a estado
            &ldquo;Desconectado&rdquo; hasta que se verifique la conexión.
          </p>
          {secretFields.map((field) => (
            <div key={field.type} className="space-y-1.5">
              <Label htmlFor={`rotate-${field.type}`}>
                {field.label}
                {field.optional && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional — déjalo vacío para eliminarlo)</span>
                )}
              </Label>
              <Input
                id={`rotate-${field.type}`}
                type={field.isPassword ? 'password' : 'text'}
                autoComplete="off"
                value={values[field.type] ?? ''}
                onChange={(e) => handleChange(field.type, e.target.value)}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={submitting} onClick={handleSubmit}>
            {submitting && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
            Rotar credenciales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
