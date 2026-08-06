"use client"

import { useState, useMemo } from "react"
import {
  GlobeIcon, ServerIcon, MailIcon, ShieldCheckIcon, ArchiveIcon,
  GitBranchIcon, ZapIcon, DatabaseIcon, MonitorIcon, PlusIcon,
  SearchIcon, ExternalLinkIcon,
} from "lucide-react"

import { AddResourceSheet } from "./add-resource-sheet"

export type ResourceType =
  | "dominio" | "hosting" | "wordpress" | "correo"
  | "ssl" | "backup" | "repositorio" | "servicio_externo" | "base_datos"

export type Resource = {
  id: string
  name: string
  type: ResourceType
  provider?: string | null
  status: string
  expires_on?: string | null
  url?: string | null
  manageUrl?: string | null
  meta: { label: string; value: string }[]
}

const TYPE_CONFIG: Record<ResourceType, { label: string; iconBg: string; iconColor: string; Icon: React.ElementType }> = {
  dominio:          { label: "Dominio",          iconBg: "bg-blue-500/15",   iconColor: "text-blue-500",   Icon: GlobeIcon },
  hosting:          { label: "Hosting",          iconBg: "bg-violet-500/15", iconColor: "text-violet-500", Icon: ServerIcon },
  wordpress:        { label: "WordPress",        iconBg: "bg-sky-500/15",    iconColor: "text-sky-500",    Icon: MonitorIcon },
  base_datos:       { label: "Base de datos",    iconBg: "bg-teal-500/15",   iconColor: "text-teal-500",   Icon: DatabaseIcon },
  correo:           { label: "Correo",           iconBg: "bg-blue-400/15",   iconColor: "text-blue-400",   Icon: MailIcon },
  ssl:              { label: "SSL",              iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500", Icon: ShieldCheckIcon },
  backup:           { label: "Backup",           iconBg: "bg-orange-500/15", iconColor: "text-orange-500", Icon: ArchiveIcon },
  repositorio:      { label: "Repositorio",      iconBg: "bg-muted",         iconColor: "text-foreground",  Icon: GitBranchIcon },
  servicio_externo: { label: "Servicio externo", iconBg: "bg-amber-500/15",  iconColor: "text-amber-500",  Icon: ZapIcon },
}

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  active:    { label: "Activo",    dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  inactive:  { label: "Inactivo", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  expired:   { label: "Expirado", dot: "bg-red-500",     text: "text-red-600 dark:text-red-400" },
  cancelled: { label: "Cancelado",dot: "bg-red-500",     text: "text-red-600 dark:text-red-400" },
  suspended: { label: "Suspendido",dot: "bg-amber-500",  text: "text-amber-600 dark:text-amber-400" },
  unknown:   { label: "Desconocido",dot: "bg-muted-foreground", text: "text-muted-foreground" },
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

function ResourceCard({ resource }: { resource: Resource }) {
  const cfg = TYPE_CONFIG[resource.type]
  const status = STATUS_MAP[resource.status] ?? STATUS_MAP.inactive
  const { Icon } = cfg

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 gap-3 hover:border-border/80 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
            <Icon className={`size-4 ${cfg.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground leading-tight">{resource.name}</p>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noreferrer"
                 className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate">
                <ExternalLinkIcon className="size-2.5 shrink-0" />
                <span className="truncate">{resource.url.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {cfg.label}
        </span>
      </div>

      {/* Meta */}
      {resource.meta.length > 0 && (
        <div className="space-y-1.5">
          {resource.meta.slice(0, 3).map((m) => (
            <div key={m.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{m.label}</span>
              <span className="text-right font-medium text-foreground truncate max-w-[60%]">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
          <span className={`size-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        {resource.manageUrl && (
          <a
            href={resource.manageUrl}
            target={resource.manageUrl.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Gestionar
            <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function AddResourceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-6 gap-3 text-center cursor-pointer hover:border-border hover:bg-card transition-colors min-h-[180px] w-full"
    >
      <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
        <PlusIcon className="size-5 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Añadir nuevo recurso</p>
        <p className="text-xs text-muted-foreground mt-0.5">Dominios, hosting, correos, SSL y más</p>
      </div>
    </button>
  )
}

type FilterId = "todos" | ResourceType

export function ResourcesGrid({ resources, clientId, clientName, projectId, projectName }: { resources: Resource[]; clientId: string; clientName: string; projectId: string; projectName: string }) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterId>("todos")
  const [addOpen, setAddOpen] = useState(false)

  const counts = useMemo(() => {
    const map: Partial<Record<ResourceType, number>> = {}
    for (const r of resources) {
      map[r.type] = (map[r.type] ?? 0) + 1
    }
    return map
  }, [resources])

  const filtered = useMemo(() => {
    let list = resources
    if (activeFilter !== "todos") list = list.filter((r) => r.type === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.provider?.toLowerCase().includes(q) ||
          TYPE_CONFIG[r.type].label.toLowerCase().includes(q),
      )
    }
    return list
  }, [resources, activeFilter, search])

  const filters: { id: FilterId; label: string; count?: number }[] = [
    { id: "todos", label: "Todos", count: resources.length },
    ...Object.entries(counts).map(([type, count]) => ({
      id: type as ResourceType,
      label: TYPE_CONFIG[type as ResourceType]?.label ?? type,
      count,
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Recursos del proyecto</h2>
          <p className="text-sm text-muted-foreground">Todos los recursos e infraestructura asociados a este proyecto.</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="size-4" />
          Añadir recurso
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar recursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const isActive = f.id === activeFilter
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {f.label}
              {f.count !== undefined && (
                <span className={`ml-1.5 ${isActive ? "opacity-70" : "opacity-50"}`}>
                  {f.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Card grid */}
      {filtered.length === 0 && resources.length > 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No se encontraron recursos que coincidan con la búsqueda.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay recursos asignados a este proyecto todavía.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
          {activeFilter === "todos" && !search && <AddResourceCard onClick={() => setAddOpen(true)} />}
        </div>
      )}

      <AddResourceSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        projectId={projectId}
        projectName={projectName}
        clientId={clientId}
        clientName={clientName}
      />
    </div>
  )
}
