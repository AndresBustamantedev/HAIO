'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoaderIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { importDomainFromResource } from '@/features/integrations/actions/import-domain'
import type { ExternalResource } from '@/features/integrations/types'

type ClientOption = { id: string; display_name: string }
type ProjectOption = { id: string; name: string }

export function ImportDomainDialog({
  resource,
  clientOptions,
  trigger,
}: {
  resource: ExternalResource
  clientOptions: ClientOption[]
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [clientId, setClientId] = React.useState('')
  const [projectId, setProjectId] = React.useState('')
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const meta = resource.raw_metadata
  const expiresOn = typeof meta.expiresOn === 'string' ? meta.expiresOn.split('T')[0] : null
  const autoRenew = typeof meta.autoRenew === 'boolean' ? meta.autoRenew : false
  const nameservers = Array.isArray(meta.nameservers) ? meta.nameservers as string[] : []

  React.useEffect(() => {
    if (!clientId) {
      setProjects([])
      setProjectId('')
      return
    }
    setLoadingProjects(true)
    fetch(`/api/integrations/search-projects?client_id=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((data: { projects?: ProjectOption[] }) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false))
  }, [clientId])

  async function handleSubmit() {
    if (!clientId) {
      toast.error('Selecciona un cliente.')
      return
    }
    setSubmitting(true)
    try {
      const result = await importDomainFromResource({
        externalResourceId: resource.id,
        clientId,
        projectId: projectId || undefined,
        notes: notes.trim() || undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Dominio "${resource.external_name}" importado y vinculado.`)
        setOpen(false)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar como dominio local</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Resumen del recurso */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <p className="font-medium">{resource.external_name ?? resource.external_resource_id}</p>
            {expiresOn && <p className="text-muted-foreground">Expira: {expiresOn}</p>}
            {autoRenew !== undefined && (
              <p className="text-muted-foreground">
                Autorenovación: {autoRenew ? 'Sí' : 'No'}
              </p>
            )}
            {nameservers.length > 0 && (
              <p className="text-muted-foreground">NS: {nameservers.slice(0, 2).join(', ')}</p>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="client-select">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <Select value={clientId} onValueChange={(v) => { setClientId(v); setProjectId('') }}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Selecciona un cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proyecto (opcional) */}
          {clientId && (
            <div className="space-y-1.5">
              <Label htmlFor="project-select">Proyecto (opcional)</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
                disabled={loadingProjects || projects.length === 0}
              >
                <SelectTrigger id="project-select">
                  <SelectValue
                    placeholder={
                      loadingProjects
                        ? 'Cargando proyectos...'
                        : projects.length === 0
                          ? 'Sin proyectos para este cliente'
                          : 'Sin asignar a proyecto'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notas opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas internas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Importado desde GoDaddy el..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Se crearán solo los campos disponibles en GoDaddy. Precio, hosting y correo
            deberán completarse manualmente.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={!clientId || submitting} onClick={handleSubmit}>
            {submitting && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
            Importar dominio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
