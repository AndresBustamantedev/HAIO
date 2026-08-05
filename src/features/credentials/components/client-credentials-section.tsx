"use client"

import { ExternalLinkIcon, FolderIcon, ShareIcon } from "lucide-react"

import { RevealCredentialButton } from "@/features/credentials/components/reveal-credential-button"
import { CredentialRowActions } from "@/features/credentials/components/credential-row-actions"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"
import type { ClientOption, CredentialSafeWithClient } from "@/features/credentials/types"
import type { ProjectOption } from "@/lib/supabase/queries/client-options"

type ProjectGroup = {
  project_id: string | null
  project_name: string
  credentials: CredentialSafeWithClient[]
}

function groupByProject(
  credentials: CredentialSafeWithClient[],
  projectOptions: ProjectOption[],
): ProjectGroup[] {
  const projectMap = new Map(projectOptions.map((p) => [p.id, p.name]))
  const groups = new Map<string, ProjectGroup>()

  for (const cred of credentials) {
    const ids = cred.project_ids ?? []
    if (ids.length === 0) {
      // No project assigned
      if (!groups.has("__none__")) {
        groups.set("__none__", { project_id: null, project_name: "Sin proyecto", credentials: [] })
      }
      groups.get("__none__")!.credentials.push(cred)
    } else {
      // Appears in every assigned project
      for (const pid of ids) {
        if (!groups.has(pid)) {
          groups.set(pid, {
            project_id: pid,
            project_name: projectMap.get(pid) ?? "Proyecto desconocido",
            credentials: [],
          })
        }
        groups.get(pid)!.credentials.push(cred)
      }
    }
  }

  // Sort: named projects first (alphabetical), "Sin proyecto" last
  return Array.from(groups.values()).sort((a, b) => {
    if (a.project_id === null) return 1
    if (b.project_id === null) return -1
    return a.project_name.localeCompare(b.project_name, "es")
  })
}

function groupByType(credentials: CredentialSafeWithClient[]) {
  const map = new Map<string, CredentialSafeWithClient[]>()
  for (const cred of credentials) {
    const type = cred.type ?? "other"
    if (!map.has(type)) map.set(type, [])
    map.get(type)!.push(cred)
  }
  return Array.from(map.entries()).sort(([a], [b]) =>
    getCredentialTypeLabel(a).localeCompare(getCredentialTypeLabel(b), "es"),
  )
}

function CredentialRow({
  cred,
  clientOptions,
  projectOptions,
  isSharedAcrossProjects,
}: {
  cred: CredentialSafeWithClient
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
  isSharedAcrossProjects: boolean
}) {
  return (
    <tr className="transition-colors hover:bg-muted/20">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{cred.label}</span>
          {isSharedAcrossProjects && (
            <span
              title={`Compartida en ${(cred.project_ids ?? []).length} proyectos`}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
            >
              <ShareIcon className="size-2.5" />
              Compartida
            </span>
          )}
        </div>
        {cred.notes && (
          <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">{cred.notes}</p>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className="text-muted-foreground">{cred.username ?? "—"}</span>
      </td>
      <td className="px-3 py-2.5">
        {cred.login_url ? (
          <a
            href={cred.login_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            title={cred.login_url}
          >
            <ExternalLinkIcon className="size-3.5 shrink-0" />
            <span className="max-w-[120px] truncate text-xs">
              {cred.login_url.replace(/^https?:\/\//, "")}
            </span>
          </a>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        {cred.credential_mode === "encrypted" && cred.id ? (
          <RevealCredentialButton credentialId={cred.id} />
        ) : cred.credential_mode === "external_reference" && cred.secret_reference ? (
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">
            {cred.secret_reference}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        <CredentialRowActions
          credential={cred}
          clientOptions={clientOptions}
          projectOptions={projectOptions}
        />
      </td>
    </tr>
  )
}

export function ClientCredentialsSection({
  credentials,
  clientOptions,
  projectOptions,
}: {
  credentials: CredentialSafeWithClient[]
  clientOptions: ClientOption[]
  projectOptions: ProjectOption[]
}) {
  const projectGroups = groupByProject(credentials, projectOptions)

  return (
    <div className="space-y-4">
      {projectGroups.map((pg) => {
        const typeGroups = groupByType(pg.credentials)

        return (
          <div key={pg.project_id ?? "__none__"} className="overflow-hidden rounded-xl border bg-card">
            {/* Project header */}
            <div className="flex items-center gap-2 border-b bg-muted/50 px-5 py-3">
              <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">{pg.project_name}</h2>
              <span className="text-xs text-muted-foreground">
                ({pg.credentials.length} credencial{pg.credentials.length !== 1 ? "es" : ""})
              </span>
            </div>

            {typeGroups.map(([type, items], ti) => (
              <div key={type} className={ti > 0 ? "border-t" : undefined}>
                {/* Type subheader */}
                <div className="flex items-center gap-2 bg-muted/20 px-5 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {getCredentialTypeLabel(type)}
                  </span>
                  <span className="text-xs text-muted-foreground/60">({items.length})</span>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-5 py-2 text-left font-medium">Nombre</th>
                      <th className="px-3 py-2 text-left font-medium">Usuario</th>
                      <th className="px-3 py-2 text-left font-medium">URL</th>
                      <th className="px-3 py-2 text-left font-medium">Contraseña</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((cred) => (
                      <CredentialRow
                        key={cred.id}
                        cred={cred}
                        clientOptions={clientOptions}
                        projectOptions={projectOptions}
                        isSharedAcrossProjects={(cred.project_ids ?? []).length > 1}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
