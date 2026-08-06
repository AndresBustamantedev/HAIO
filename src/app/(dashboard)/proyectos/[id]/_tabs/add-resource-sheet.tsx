"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoaderIcon, GlobeIcon, ServerIcon, MailIcon, MonitorIcon, GitBranchIcon, DatabaseIcon } from "lucide-react"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DomainFormDrawer } from "@/features/domains/components/domain-form-drawer"
import { HostingFormDrawer } from "@/features/hosting/components/hosting-form-drawer"
import { EmailServiceFormDrawer } from "@/features/email-services/components/email-service-form-drawer"
import { WebsiteInstallationFormDrawer } from "@/features/website-installations/components/website-installation-form-drawer"
import { createRepository } from "@/features/repositories/actions/create-repository"
import { createDatabase } from "@/features/databases/actions/create-database"

type ResourceTypeId = "dominio" | "hosting" | "correo" | "sitio_web" | "repositorio" | "base_datos"

const TYPES: { id: ResourceTypeId; label: string; Icon: React.ElementType; description: string }[] = [
  { id: "dominio",      label: "Dominio",       Icon: GlobeIcon,      description: "GoDaddy, Namecheap, etc." },
  { id: "hosting",      label: "Hosting",       Icon: ServerIcon,     description: "Hostinger, cPanel, VPS, etc." },
  { id: "correo",       label: "Correo",        Icon: MailIcon,       description: "Google Workspace, Zoho Mail, etc." },
  { id: "sitio_web",    label: "Sitio web",     Icon: MonitorIcon,    description: "WordPress, WooCommerce, etc." },
  { id: "repositorio",  label: "Repositorio",   Icon: GitBranchIcon,  description: "GitHub, GitLab, Bitbucket, etc." },
  { id: "base_datos",   label: "Base de datos", Icon: DatabaseIcon,   description: "PostgreSQL, MySQL, MongoDB, etc." },
]

const DB_ENGINES = ["postgresql", "mysql", "mariadb", "sqlite", "mongodb", "redis", "mssql", "other"]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

function SimpleSelect({ value, onChange, options, labelFn }: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  labelFn?: (v: string) => string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map((s) => (
        <option key={s} value={s}>{labelFn ? labelFn(s) : s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  projectId: string
  projectName: string
  clientId: string
  clientName: string
}

export function AddResourceSheet({ open, onClose, projectId, projectName, clientId, clientName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Which drawer to open (for types that have full drawers)
  const [domainOpen, setDomainOpen] = useState(false)
  const [hostingOpen, setHostingOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [websiteOpen, setWebsiteOpen] = useState(false)

  // Mini-form state — only for repositorio / base_datos (no dedicated drawer exists)
  const [miniType, setMiniType] = useState<"repositorio" | "base_datos" | null>(null)

  const [repoName, setRepoName] = useState("")
  const [repoProvider, setRepoProvider] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoVisibility, setRepoVisibility] = useState("private")
  const [repoStatus, setRepoStatus] = useState("active")

  const [dbName, setDbName] = useState("")
  const [dbEngine, setDbEngine] = useState("postgresql")
  const [dbVersion, setDbVersion] = useState("")
  const [dbProvider, setDbProvider] = useState("")
  const [dbHost, setDbHost] = useState("")
  const [dbStatus, setDbStatus] = useState("active")

  const clientOptions = [{ id: clientId, display_name: clientName }]
  const projectOptions = [{ id: projectId, name: projectName, client_id: clientId }]

  function handleClose() {
    setMiniType(null)
    setRepoName(""); setRepoProvider(""); setRepoUrl(""); setRepoVisibility("private"); setRepoStatus("active")
    setDbName(""); setDbEngine("postgresql"); setDbVersion(""); setDbProvider(""); setDbHost(""); setDbStatus("active")
    onClose()
  }

  function handleTypeClick(type: ResourceTypeId) {
    if (type === "dominio") {
      onClose()
      setDomainOpen(true)
    } else if (type === "hosting") {
      onClose()
      setHostingOpen(true)
    } else if (type === "correo") {
      onClose()
      setEmailOpen(true)
    } else if (type === "sitio_web") {
      onClose()
      setWebsiteOpen(true)
    } else {
      setMiniType(type)
    }
  }

  function handleMiniSubmit() {
    startTransition(async () => {
      let result: { error: string | null }

      if (miniType === "repositorio") {
        if (!repoName.trim()) { toast.error("El nombre es obligatorio."); return }
        result = await createRepository({
          client_id: clientId, project_id: projectId,
          name: repoName.trim(), provider: repoProvider.trim() || "",
          url: repoUrl.trim() || "", visibility: repoVisibility as never,
          status: repoStatus as never,
        })
      } else {
        if (!dbName.trim()) { toast.error("El nombre es obligatorio."); return }
        result = await createDatabase({
          client_id: clientId, project_id: projectId, name: dbName.trim(),
          engine: dbEngine as never, engine_version: dbVersion.trim() || "",
          provider: dbProvider.trim() || "", host: dbHost.trim() || "",
          status: dbStatus as never,
        })
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Recurso añadido correctamente.")
        handleClose()
        router.refresh()
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>
              {miniType ? (miniType === "repositorio" ? "Nuevo repositorio" : "Nueva base de datos") : "Añadir recurso al proyecto"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-5 flex-1">
            {/* Type selector — always visible */}
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ id, label, Icon, description }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTypeClick(id)}
                  className={[
                    "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors",
                    miniType === id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-border/80 hover:bg-muted/50",
                  ].join(" ")}
                >
                  <Icon className={`size-4 ${miniType === id ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className={`text-sm font-medium ${miniType === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Mini-forms for repo / db only */}
            {miniType === "repositorio" && (
              <>
                <hr />
                <div className="space-y-4">
                  <Field label="Nombre" required>
                    <Input placeholder="mi-proyecto, frontend-app…" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
                  </Field>
                  <Field label="Plataforma">
                    <Input placeholder="GitHub, GitLab, Bitbucket…" value={repoProvider} onChange={(e) => setRepoProvider(e.target.value)} />
                  </Field>
                  <Field label="URL">
                    <Input placeholder="https://github.com/org/repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
                  </Field>
                  <Field label="Visibilidad">
                    <SimpleSelect value={repoVisibility} onChange={setRepoVisibility} options={["private", "public"]}
                      labelFn={(v) => v === "private" ? "Privado" : "Público"} />
                  </Field>
                  <Field label="Estado">
                    <SimpleSelect value={repoStatus} onChange={setRepoStatus} options={["active", "archived", "deleted"]}
                      labelFn={(v) => ({ active: "Activo", archived: "Archivado", deleted: "Eliminado" }[v] ?? v)} />
                  </Field>
                </div>
              </>
            )}

            {miniType === "base_datos" && (
              <>
                <hr />
                <div className="space-y-4">
                  <Field label="Nombre" required>
                    <Input placeholder="produccion_db, analytics…" value={dbName} onChange={(e) => setDbName(e.target.value)} />
                  </Field>
                  <Field label="Motor">
                    <SimpleSelect value={dbEngine} onChange={setDbEngine} options={DB_ENGINES}
                      labelFn={(v) => ({ postgresql: "PostgreSQL", mysql: "MySQL", mariadb: "MariaDB",
                        sqlite: "SQLite", mongodb: "MongoDB", redis: "Redis", mssql: "SQL Server", other: "Otro" }[v] ?? v)} />
                  </Field>
                  <Field label="Versión">
                    <Input placeholder="16.2, 8.0…" value={dbVersion} onChange={(e) => setDbVersion(e.target.value)} />
                  </Field>
                  <Field label="Proveedor">
                    <Input placeholder="Supabase, PlanetScale, Railway…" value={dbProvider} onChange={(e) => setDbProvider(e.target.value)} />
                  </Field>
                  <Field label="Host / URL de conexión">
                    <Input placeholder="db.supabase.co" value={dbHost} onChange={(e) => setDbHost(e.target.value)} />
                  </Field>
                  <Field label="Estado">
                    <SimpleSelect value={dbStatus} onChange={setDbStatus} options={["active", "inactive", "migrating"]}
                      labelFn={(v) => ({ active: "Activo", inactive: "Inactivo", migrating: "Migrando" }[v] ?? v)} />
                  </Field>
                </div>
              </>
            )}
          </div>

          {miniType && (
            <div className="border-t px-6 py-4 flex justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={() => setMiniType(null)} disabled={isPending}>Atrás</Button>
              <Button onClick={handleMiniSubmit} disabled={isPending}>
                {isPending && <LoaderIcon className="mr-1.5 size-3.5 animate-spin" />}
                Guardar recurso
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <DomainFormDrawer
        open={domainOpen}
        onOpenChange={setDomainOpen}
        clientOptions={clientOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
        projectOptions={projectOptions}
      />
      <HostingFormDrawer
        open={hostingOpen}
        onOpenChange={setHostingOpen}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
      />
      <EmailServiceFormDrawer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        clientOptions={clientOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
      />
      <WebsiteInstallationFormDrawer
        open={websiteOpen}
        onOpenChange={setWebsiteOpen}
        clientOptions={clientOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
      />
    </>
  )
}
