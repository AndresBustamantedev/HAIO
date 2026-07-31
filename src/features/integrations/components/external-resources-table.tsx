'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  BoxesIcon,
  CheckCircleIcon,
  LinkIcon,
  UnlinkIcon,
  PlusCircleIcon,
  GlobeIcon,
  ServerIcon,
  LayoutIcon,
  CreditCardIcon,
  GitBranchIcon,
  RocketIcon,
  ShieldIcon,
  MailIcon,
  HardDriveIcon,
  ActivityIcon,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { LinkResourceDialog } from './link-resource-dialog'
import { ImportDomainDialog } from './import-domain-dialog'
import { unlinkExternalResource } from '@/features/integrations/actions/link-external-resource'
import type { ExternalResource } from '@/features/integrations/types'

type ClientOption = { id: string; display_name: string }

// ── Tipos de display ──────────────────────────────────────────────────────────

type DisplayType =
  | 'domain'
  | 'subscription'
  | 'website'
  | 'vps'
  | 'repository'
  | 'deployment'
  | 'dns_zone'
  | 'ssl_certificate'
  | 'mailbox'
  | 'database'
  | 'payment_customer'
  | 'payment_subscription'
  | 'payment_invoice'
  | 'other'

const DISPLAY_TYPE_CONFIG: Record<DisplayType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}> = {
  domain:               { label: 'Dominio',            icon: GlobeIcon,      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  subscription:         { label: 'Suscripción',        icon: CreditCardIcon, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  website:              { label: 'Website',            icon: LayoutIcon,     className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  vps:                  { label: 'VPS',                icon: ServerIcon,     className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  repository:           { label: 'Repositorio',        icon: GitBranchIcon,  className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  deployment:           { label: 'Despliegue',         icon: RocketIcon,     className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  dns_zone:             { label: 'Zona DNS',           icon: ActivityIcon,   className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  ssl_certificate:      { label: 'SSL',                icon: ShieldIcon,     className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  mailbox:              { label: 'Buzón',              icon: MailIcon,       className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  database:             { label: 'Base de datos',      icon: HardDriveIcon,  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  payment_customer:     { label: 'Cliente Stripe',     icon: CreditCardIcon, className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  payment_subscription: { label: 'Suscripción Stripe', icon: CreditCardIcon, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  payment_invoice:      { label: 'Factura Stripe',     icon: CreditCardIcon, className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  other:                { label: 'Recurso',            icon: BoxesIcon,      className: 'bg-muted text-muted-foreground' },
}

function getDisplayType(res: ExternalResource): DisplayType {
  const metaType = res.raw_metadata?.type as string | undefined

  switch (res.external_resource_type) {
    case 'domain': return 'domain'
    case 'hosting':
      if (metaType === 'subscription') return 'subscription'
      if (metaType === 'website') return 'website'
      if (metaType === 'vps') return 'vps'
      return 'other'
    case 'repository':           return 'repository'
    case 'deployment':           return 'deployment'
    case 'dns_zone':             return 'dns_zone'
    case 'ssl_certificate':      return 'ssl_certificate'
    case 'mailbox':              return 'mailbox'
    case 'database':             return 'database'
    case 'payment_customer':     return 'payment_customer'
    case 'payment_subscription': return 'payment_subscription'
    case 'payment_invoice':      return 'payment_invoice'
    default: return 'other'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function daysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function formatCents(cents: number | undefined, currency = 'EUR') {
  if (cents === undefined) return null
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(cents / 100)
}

function RelativeDate({ iso, label }: { iso: string | null | undefined; label?: string }) {
  const days = daysFromNow(iso)
  const formatted = formatDate(iso)
  if (!formatted) return <span className="text-muted-foreground">—</span>

  const prefix = label ? <span className="text-muted-foreground">{label}: </span> : null

  if (days === null) return <span>{prefix}{formatted}</span>
  if (days < 0) return <span className="text-destructive">{prefix}{formatted} <span className="text-xs">(expirado)</span></span>
  if (days < 14) return <span className="text-destructive">{prefix}{formatted} <span className="text-xs">({days}d)</span></span>
  if (days < 60) return <span className="text-amber-600 dark:text-amber-400">{prefix}{formatted} <span className="text-xs">({days}d)</span></span>
  return <span>{prefix}{formatted}</span>
}

// ── Celda de detalles por tipo ────────────────────────────────────────────────

function DetailsCell({ res, displayType }: { res: ExternalResource; displayType: DisplayType }) {
  const meta = res.raw_metadata

  switch (displayType) {
    case 'domain': {
      const expiresOn = meta.expiresOn as string | null ?? meta.expiresAt as string | null
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          <RelativeDate iso={expiresOn} label="Expira" />
          {meta.autoRenew === true && (
            <span className="text-xs text-green-600 dark:text-green-400">↺ Auto-renovación</span>
          )}
          {!!meta.registrarName && (
            <span className="text-xs text-muted-foreground">{String(meta.registrarName)}</span>
          )}
        </div>
      )
    }

    case 'subscription': {
      const nextBilling = meta.nextBillingAt as string | null
      const price = formatCents(meta.renewalPriceCents as number | undefined, meta.currencyCode as string | undefined)
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          <RelativeDate iso={nextBilling} label="Renueva" />
          {price && <span className="text-xs text-muted-foreground">{price} / {meta.billingPeriodUnit as string ?? 'año'}</span>}
          {meta.isAutoRenewed === true && (
            <span className="text-xs text-green-600 dark:text-green-400">↺ Auto-renovación</span>
          )}
        </div>
      )
    }

    case 'website': {
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {!!meta.username && <span className="text-muted-foreground">Usuario: <span className="font-mono text-xs">{String(meta.username)}</span></span>}
          <span className={meta.isEnabled === false ? 'text-destructive text-xs' : 'text-xs text-muted-foreground'}>
            {meta.isEnabled === false ? 'Desactivado' : 'Activo'}
          </span>
        </div>
      )
    }

    case 'vps': {
      const specs = [
        meta.cpus ? `${meta.cpus} vCPU` : null,
        meta.memoryMb ? `${Math.round((meta.memoryMb as number) / 1024)} GB RAM` : null,
        meta.diskGb ? `${meta.diskGb} GB disco` : null,
      ].filter(Boolean).join(' · ')
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {specs && <span className="text-muted-foreground text-xs">{specs}</span>}
          {!!meta.ipv4 && <span className="font-mono text-xs text-muted-foreground">{String(meta.ipv4)}</span>}
          {!!meta.plan && <span className="text-xs text-muted-foreground">Plan: {String(meta.plan)}</span>}
        </div>
      )
    }

    case 'repository': {
      const parts = [
        meta.language as string | undefined,
        meta.visibility as string | undefined,
        meta.stargazers_count !== undefined ? `★ ${meta.stargazers_count}` : null,
      ].filter(Boolean).join(' · ')
      return <span className="text-sm text-muted-foreground">{parts || '—'}</span>
    }

    case 'deployment': {
      const deployedAt = meta.deployedAt as string | null ?? meta.created_at as string | null
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {!!meta.url && <a href={String(meta.url)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">{String(meta.url)}</a>}
          {deployedAt && <span className="text-xs text-muted-foreground">{formatDate(deployedAt)}</span>}
        </div>
      )
    }

    case 'ssl_certificate': {
      const expiresOn = meta.expiresOn as string | null ?? meta.expires_at as string | null
      return <RelativeDate iso={expiresOn} label="Expira" />
    }

    case 'payment_customer': {
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {!!meta.email && <span className="text-muted-foreground">{String(meta.email)}</span>}
          {typeof meta.balance === 'number' && meta.balance !== 0 && (
            <span className="text-xs text-muted-foreground">
              Balance: {formatCents(meta.balance, meta.currency as string)}
            </span>
          )}
          {meta.delinquent === true && (
            <span className="text-xs text-destructive">Moroso</span>
          )}
        </div>
      )
    }

    case 'payment_subscription': {
      const periodEnd = meta.currentPeriodEnd as string | null
      const interval = meta.interval as string | null
      const unitAmount = meta.unitAmount as number | null
      const currency = meta.currency as string | null
      const price = unitAmount !== null && currency
        ? formatCents(unitAmount, currency)
        : null
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          <RelativeDate iso={periodEnd} label="Renueva" />
          {price && interval && (
            <span className="text-xs text-muted-foreground">{price} / {interval}</span>
          )}
          {meta.cancelAtPeriodEnd === true && (
            <span className="text-xs text-amber-600 dark:text-amber-400">Cancela al final del período</span>
          )}
        </div>
      )
    }

    case 'payment_invoice': {
      const dueDate = meta.dueDate as string | null
      const total = meta.total as number | null
      const currency = meta.currency as string | null
      const url = meta.hostedInvoiceUrl as string | null
      return (
        <div className="flex flex-col gap-0.5 text-sm">
          {dueDate && <RelativeDate iso={dueDate} label="Vence" />}
          {total !== null && currency && (
            <span className="text-xs text-muted-foreground">
              Total: {formatCents(total, currency)}
            </span>
          )}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              Ver factura Stripe
            </a>
          )}
        </div>
      )
    }

    default:
      return <span className="text-muted-foreground text-sm">—</span>
  }
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>

  const normalized = status.toLowerCase()
  const colorClass =
    ['active', 'running', 'created', 'connected', 'valid'].includes(normalized)
      ? 'border-green-300 text-green-700 dark:border-green-800 dark:text-green-400'
      : ['expired', 'error', 'stopped', 'failed', 'disabled'].includes(normalized)
        ? 'border-destructive/30 text-destructive'
        : ['pending', 'starting', 'stopping'].includes(normalized)
          ? 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
          : ''

  return (
    <Badge variant="outline" className={`capitalize text-xs ${colorClass}`}>
      {status}
    </Badge>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ExternalResourcesTable({
  resources,
  integrationId,
  clientOptions,
}: {
  resources: ExternalResource[]
  integrationId: string
  clientOptions: ClientOption[]
}) {
  const [unlinkingId, setUnlinkingId] = React.useState<string | null>(null)
  const [activeFilter, setActiveFilter] = React.useState<string>('all')

  async function handleUnlink(resourceId: string) {
    setUnlinkingId(resourceId)
    try {
      const result = await unlinkExternalResource({ externalResourceId: resourceId })
      if (result.error) toast.error(result.error)
      else toast.success('Recurso desvinculado.')
    } finally {
      setUnlinkingId(null)
    }
  }

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={BoxesIcon}
        title="Sin recursos sincronizados"
        description="Los recursos de esta integración aparecerán aquí tras la primera sincronización."
      />
    )
  }

  // Calcular tipos únicos presentes para el filtro
  const typeMap = new Map<string, { displayType: DisplayType; count: number }>()
  for (const res of resources) {
    const dt = getDisplayType(res)
    const existing = typeMap.get(dt)
    if (existing) existing.count++
    else typeMap.set(dt, { displayType: dt, count: 1 })
  }

  const filtered = activeFilter === 'all'
    ? resources
    : resources.filter((res) => getDisplayType(res) === activeFilter)

  return (
    <div className="space-y-3">
      {/* Filtro por tipo */}
      {typeMap.size > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={[
              'rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
              activeFilter === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
            ].join(' ')}
          >
            Todos ({resources.length})
          </button>
          {[...typeMap.entries()].map(([key, { displayType, count }]) => {
            const conf = DISPLAY_TYPE_CONFIG[displayType]
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={[
                  'rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
                  activeFilter === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                ].join(' ')}
              >
                {conf.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Recurso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[28%]">Detalles</TableHead>
              <TableHead>Última sync</TableHead>
              <TableHead>Vinculación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((res) => {
              const displayType = getDisplayType(res)
              const conf = DISPLAY_TYPE_CONFIG[displayType]
              const Icon = conf.icon

              return (
                <TableRow key={res.id}>
                  {/* Tipo + nombre */}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium shrink-0 ${conf.className}`}>
                        <Icon className="size-3" />
                        {conf.label}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">
                          {res.external_name ?? res.external_resource_id}
                        </p>
                        {res.consecutive_missing_syncs >= 2 && (
                          <Badge variant="destructive" className="mt-0.5 text-xs">Ausente</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <StatusBadge status={res.external_status} />
                  </TableCell>

                  {/* Detalles adaptativos */}
                  <TableCell>
                    <DetailsCell res={res} displayType={displayType} />
                  </TableCell>

                  {/* Última sync */}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {res.last_synced_at
                      ? formatDate(res.last_synced_at)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  {/* Vinculación */}
                  <TableCell>
                    {res.local_resource_id
                      ? (
                        <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="size-3.5" />
                          <span>Vinculado</span>
                        </div>
                      )
                      : <span className="text-sm text-muted-foreground">Sin asignar</span>}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {res.local_resource_id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={unlinkingId === res.id}
                          onClick={() => handleUnlink(res.id)}
                          title="Desvincular"
                        >
                          <UnlinkIcon className="size-3.5" />
                          <span className="sr-only">Desvincular</span>
                        </Button>
                      ) : (
                        <>
                          <LinkResourceDialog
                            resource={res}
                            trigger={
                              <Button variant="ghost" size="sm" title="Vincular a recurso existente">
                                <LinkIcon className="size-3.5" />
                                <span className="sr-only">Vincular</span>
                              </Button>
                            }
                          />
                          {displayType === 'domain' && (
                            <ImportDomainDialog
                              resource={res}
                              clientOptions={clientOptions}
                              trigger={
                                <Button variant="ghost" size="sm" title="Importar como nuevo dominio">
                                  <PlusCircleIcon className="size-3.5" />
                                  <span className="sr-only">Importar dominio</span>
                                </Button>
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
