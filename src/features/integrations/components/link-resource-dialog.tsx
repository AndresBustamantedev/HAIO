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

type LocalResourceType = 'domain' | 'project' | 'client'

type LocalDomain = { id: string; domain_name: string; client_name?: string }
type LocalProject = { id: string; name: string; client_name?: string | null }
type LocalClient = { id: string; display_name: string; legal_name?: string | null }

type ResultItem = { id: string; primary: string; secondary?: string | null }

const TYPE_CONFIG: Record<
  LocalResourceType,
  { label: string; placeholder: string; emptyHint: string; endpoint: string }
> = {
  domain: {
    label: 'Dominio local',
    placeholder: 'ejemplo.com',
    emptyHint: 'No hay dominios locales. Usa "Importar dominio" para crear uno.',
    endpoint: '/api/integrations/search-domains',
  },
  project: {
    label: 'Proyecto',
    placeholder: 'Nombre del proyecto',
    emptyHint: 'No se encontraron proyectos.',
    endpoint: '/api/integrations/search-projects',
  },
  client: {
    label: 'Cliente',
    placeholder: 'Nombre del cliente',
    emptyHint: 'No se encontraron clientes.',
    endpoint: '/api/integrations/search-clients',
  },
}

function normalizeResults(type: LocalResourceType, data: Record<string, unknown>): ResultItem[] {
  if (type === 'domain') {
    return ((data.domains ?? []) as LocalDomain[]).map((d) => ({
      id: d.id,
      primary: d.domain_name,
      secondary: d.client_name,
    }))
  }
  if (type === 'project') {
    return ((data.projects ?? []) as LocalProject[]).map((p) => ({
      id: p.id,
      primary: p.name,
      secondary: p.client_name,
    }))
  }
  // client
  return ((data.clients ?? []) as LocalClient[]).map((c) => ({
    id: c.id,
    primary: c.display_name,
    secondary: c.legal_name !== c.display_name ? c.legal_name : null,
  }))
}

export function LinkResourceDialog({
  resource,
  trigger,
}: {
  resource: ExternalResource
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [resourceType, setResourceType] = React.useState<LocalResourceType>('domain')
  const [search, setSearch] = React.useState('')
  const [results, setResults] = React.useState<ResultItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setSearch('')
      setResults([])
      setSelectedId(null)
      setResourceType('domain')
    }
  }

  function handleTypeChange(type: LocalResourceType) {
    setResourceType(type)
    setSearch('')
    setResults([])
    setSelectedId(null)
  }

  async function fetchResults(type: LocalResourceType, q: string) {
    setLoading(true)
    try {
      const { endpoint } = TYPE_CONFIG[type]
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>
        setResults(normalizeResults(type, data))
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!open) return
    const delay = search === '' ? 0 : 300
    const timer = setTimeout(() => fetchResults(resourceType, search), delay)
    return () => clearTimeout(timer)
  }, [search, open, resourceType])

  async function handleSubmit() {
    if (!selectedId) return
    setSubmitting(true)
    try {
      const result = await linkExternalResource({
        externalResourceId: resource.id,
        localResourceId: selectedId,
        localResourceType: resourceType,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        const typeLabel = TYPE_CONFIG[resourceType].label.toLowerCase()
        toast.success(`"${resource.external_name}" vinculado al ${typeLabel}.`)
        setOpen(false)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const config = TYPE_CONFIG[resourceType]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular recurso</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Recurso: <strong>{resource.external_name ?? resource.external_resource_id}</strong>
          </p>

          {/* Selector de tipo */}
          <div className="flex rounded-md border p-0.5 gap-0.5">
            {(Object.keys(TYPE_CONFIG) as LocalResourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  resourceType === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resource-search">Buscar {config.label.toLowerCase()}</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="resource-search"
                className="pl-8"
                placeholder={config.placeholder}
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
            {!loading && results.length === 0 && search.length >= 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No se encontraron resultados.
              </p>
            )}
            {!loading && results.length === 0 && search.length < 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {config.emptyHint}
              </p>
            )}
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  selectedId === item.id ? 'bg-primary/10 font-medium text-primary' : ''
                }`}
              >
                {item.primary}
                {item.secondary && (
                  <span className="ml-2 text-xs text-muted-foreground">({item.secondary})</span>
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
