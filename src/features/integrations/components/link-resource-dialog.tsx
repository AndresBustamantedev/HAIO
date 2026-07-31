'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SearchIcon, LoaderIcon } from 'lucide-react'

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
import { linkExternalResource } from '@/features/integrations/actions/link-external-resource'
import type { ExternalResource } from '@/features/integrations/types'

type LocalDomain = { id: string; domain_name: string; client_name?: string }

export function LinkResourceDialog({
  resource,
  trigger,
}: {
  resource: ExternalResource
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [domains, setDomains] = React.useState<LocalDomain[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setSearch('')
      setDomains([])
      setSelectedId(null)
    }
  }

  async function fetchDomains(q: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/integrations/search-domains?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json() as { domains: LocalDomain[] }
        setDomains(data.domains ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!open) return
    // Carga inmediata al abrir; debounce de 300ms al buscar
    const delay = search === '' ? 0 : 300
    const timer = setTimeout(() => fetchDomains(search), delay)
    return () => clearTimeout(timer)
  }, [search, open])

  async function handleSubmit() {
    if (!selectedId) return
    setSubmitting(true)
    try {
      const result = await linkExternalResource({
        externalResourceId: resource.id,
        localResourceId: selectedId,
        localResourceType: 'domain',
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${resource.external_name}" vinculado al dominio.`)
        setOpen(false)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular a dominio existente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Recurso: <strong>{resource.external_name ?? resource.external_resource_id}</strong>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="domain-search">Buscar dominio local</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="domain-search"
                className="pl-8"
                placeholder="ejemplo.com"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && domains.length === 0 && search.length >= 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No se encontraron dominios con ese nombre.
              </p>
            )}
            {!loading && domains.length === 0 && search.length < 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay dominios locales. Usa &quot;Importar dominio&quot; para crear uno.
              </p>
            )}
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  selectedId === d.id ? 'bg-primary/10 font-medium text-primary' : ''
                }`}
              >
                {d.domain_name}
                {d.client_name && (
                  <span className="ml-2 text-xs text-muted-foreground">({d.client_name})</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!selectedId || submitting} onClick={handleSubmit}>
            {submitting && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
