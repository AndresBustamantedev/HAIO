import { LockIcon, EyeIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { VaultCredentialActions } from "./vault-credential-actions"
import { VaultAddCredential } from "./vault-add-credential"
import { getCredentialTypeLabel } from "@/features/credentials/utils/labels"

type Props = { projectId: string; clientId: string }

type Cred = {
  id: string
  type: string
  label: string
  username: string | null
  login_url: string | null
  notes: string | null
  expires_at: string | null
  is_shared_with_client: boolean
  credential_mode: string | null
  secret_reference: string | null
}

function formatDate(v: string | null) {
  if (!v) return null
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

function CredentialCard({ cred, projectId }: { cred: Cred; projectId: string }) {
  const expiresAt = formatDate(cred.expires_at)
  const isExpired = cred.expires_at ? new Date(cred.expires_at) < new Date() : false

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{cred.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {getCredentialTypeLabel(cred.type)}
            </span>
            {isExpired ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Expirada
              </span>
            ) : expiresAt ? (
              <span className="text-xs text-muted-foreground">Expira {expiresAt}</span>
            ) : null}
          </div>
          {cred.username ? (
            <p className="mt-1 text-sm text-muted-foreground font-mono">{cred.username}</p>
          ) : null}
          {cred.login_url ? (
            <a
              href={cred.login_url}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 block text-xs text-blue-600 hover:underline dark:text-blue-400 truncate"
            >
              {cred.login_url}
            </a>
          ) : null}
          {cred.notes ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{cred.notes}</p>
          ) : null}
        </div>
        <VaultCredentialActions
          credentialId={cred.id}
          hasSecret={cred.credential_mode === "encrypted"}
          projectId={projectId}
        />
      </div>
    </li>
  )
}

export async function TabVault({ projectId, clientId }: Props) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: credentials } = await (supabase as any)
    .from("v_credentials_safe")
    .select("id, type, label, username, login_url, notes, expires_at, is_shared_with_client, credential_mode, secret_reference")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("type")
    .order("label")

  const creds = (credentials ?? []) as Cred[]
  const privateCreds = creds.filter((c) => !c.is_shared_with_client)
  const sharedCreds = creds.filter((c) => c.is_shared_with_client)

  return (
    <div className="flex flex-col gap-8">
      {/* Sección admin */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LockIcon className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Solo admin</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {privateCreds.length}
            </span>
          </div>
          <VaultAddCredential projectId={projectId} clientId={clientId} defaultShared={false} />
        </div>
        {privateCreds.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sin credenciales privadas. Úsalas para claves internas que el cliente no debe ver.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {privateCreds.map((cred) => (
              <CredentialCard key={cred.id} cred={cred} projectId={projectId} />
            ))}
          </ul>
        )}
      </section>

      {/* Separador */}
      <div className="border-t" />

      {/* Sección portal cliente */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeIcon className="size-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Portal cliente</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {sharedCreds.length}
            </span>
          </div>
          <VaultAddCredential projectId={projectId} clientId={clientId} defaultShared={true} />
        </div>
        {sharedCreds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 p-6 text-center dark:border-blue-900/40">
            <p className="text-sm text-muted-foreground">
              Sin accesos compartidos. Añade aquí las credenciales que el cliente verá en su portal.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sharedCreds.map((cred) => (
              <li key={cred.id} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{cred.label}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {getCredentialTypeLabel(cred.type)}
                      </span>
                      {cred.expires_at && new Date(cred.expires_at) < new Date() ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Expirada
                        </span>
                      ) : cred.expires_at ? (
                        <span className="text-xs text-muted-foreground">Expira {formatDate(cred.expires_at)}</span>
                      ) : null}
                    </div>
                    {cred.username ? (
                      <p className="mt-1 text-sm text-muted-foreground font-mono">{cred.username}</p>
                    ) : null}
                    {cred.login_url ? (
                      <a
                        href={cred.login_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block text-xs text-blue-600 hover:underline dark:text-blue-400 truncate"
                      >
                        {cred.login_url}
                      </a>
                    ) : null}
                    {cred.notes ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">{cred.notes}</p>
                    ) : null}
                  </div>
                  <VaultCredentialActions
                    credentialId={cred.id}
                    hasSecret={cred.credential_mode === "encrypted"}
                    projectId={projectId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
