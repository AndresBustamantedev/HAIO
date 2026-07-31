'use client'

import * as React from 'react'
import Link from 'next/link'
import { ExternalLinkIcon, InfoIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ConnectorCapability, ConnectorStatus } from '@/features/integrations/connectors/types'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ConnectorMetaForUI = {
  connectorType: string
  displayName: string
  description: string
  category: string
  status: ConnectorStatus
  documentationUrl?: string
  setupInstructions?: readonly string[]
  capabilities: ConnectorCapability[]
  supportedEnvironments: readonly string[]
  requiredSecrets: readonly { type: string; label: string; description: string; isPassword: boolean }[]
}

// ── Config de display ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConnectorStatus, { label: string; className: string }> = {
  available: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  setup_required: {
    label: 'Requiere configuración',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  experimental: {
    label: 'Experimental',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  coming_soon: {
    label: 'Próximamente',
    className: 'bg-muted text-muted-foreground',
  },
}

const CAPABILITY_LABELS: Partial<Record<ConnectorCapability, string>> = {
  'domains.read':       'Dominios',
  'domains.expiration': 'Vencimientos',
  'domains.autorenew':  'Autorenovación',
  'domains.nameservers':'Nameservers',
  'dns.read':           'Zonas DNS',
  'hosting.read':       'Hosting / VPS',
  'repositories.read':  'Repositorios',
  'deployments.read':   'Despliegues',
  'projects.read':      'Proyectos',
  'databases.read':     'Bases de datos',
  'mail.read':          'Correo',
  'mailboxes.read':     'Buzones',
  'users.read':         'Usuarios',
}

const CATEGORIES = ['Todos', 'Dominios y DNS', 'Hosting y VPS', 'Desarrollo', 'Email'] as const

// ── Componente ────────────────────────────────────────────────────────────────

export function ProviderCatalog({ metas }: { metas: ConnectorMetaForUI[] }) {
  const [activeCategory, setActiveCategory] = React.useState<string>('Todos')

  const filtered = activeCategory === 'Todos'
    ? metas
    : metas.filter((m) => m.category === activeCategory)

  return (
    <div className="space-y-6">
      {/* Filtro de categoría */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
            ].join(' ')}
          >
            {cat}
            {cat !== 'Todos' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({metas.filter((m) => m.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid de proveedores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((meta) => (
          <ProviderCard key={meta.connectorType} meta={meta} />
        ))}
      </div>
    </div>
  )
}

// ── Tarjeta de proveedor ──────────────────────────────────────────────────────

function ProviderCard({ meta }: { meta: ConnectorMetaForUI }) {
  const [showInstructions, setShowInstructions] = React.useState(false)
  const statusConf = STATUS_CONFIG[meta.status]
  const canConfigure = meta.status !== 'coming_soon'

  const providerInitials = meta.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar con iniciales */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {providerInitials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-tight">{meta.displayName}</p>
              <span className={[
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                statusConf.className,
              ].join(' ')}>
                {statusConf.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.category}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="text-sm text-muted-foreground">{meta.description}</p>

        {/* Capacidades */}
        {meta.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meta.capabilities
              .filter((c) => CAPABILITY_LABELS[c])
              .map((c) => (
                <Badge key={c} variant="secondary" className="text-xs font-normal">
                  {CAPABILITY_LABELS[c]}
                </Badge>
              ))}
          </div>
        )}

        {/* Instrucciones de configuración */}
        {meta.setupInstructions && meta.setupInstructions.length > 0 && (
          <div>
            <button
              onClick={() => setShowInstructions((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <InfoIcon className="size-3.5" />
              {showInstructions ? 'Ocultar pasos previos' : 'Ver pasos previos requeridos'}
            </button>
            {showInstructions && (
              <ol className="mt-2 space-y-1.5 pl-4">
                {meta.setupInstructions.map((step, i) => (
                  <li key={i} className="text-xs text-muted-foreground list-decimal">
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          {canConfigure ? (
            <Button
              size="sm"
              className="flex-1"
              render={<Link href={`/integraciones/nueva?proveedor=${meta.connectorType}`} />}
            >
              Configurar
            </Button>
          ) : (
            <Button size="sm" className="flex-1" disabled>
              Próximamente
            </Button>
          )}

          {meta.documentationUrl && (
            <a
              href={meta.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver documentación"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ExternalLinkIcon className="size-4" />
              <span className="sr-only">Documentación</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
