import { redirect } from "next/navigation"
import { FileTextIcon } from "lucide-react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { createClient } from "@/lib/supabase/server"
import type { PortalDocument } from "@/features/portal/queries/get-portal-overview"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d))
}

function formatBytes(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CATEGORY_LABEL: Record<string, string> = {
  contract: "Contrato", proposal: "Propuesta", invoice: "Factura",
  report: "Informe", brief: "Briefing", other: "Otro",
}

export default async function PortalDocumentosPage() {
  const session = await getPortalSession()
  if (!session || !session.access.can_view_documents) redirect("/portal")

  const supabase = await createClient()
  const { data } = await supabase
    .from("documents")
    .select("id, title, category, created_at, storage_path, size_bytes")
    .eq("client_id", session.access.client_id)
    .eq("is_visible_to_client", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const documents = (data ?? []) as PortalDocument[]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Documentos</h1>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
          <FileTextIcon className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No hay documentos compartidos contigo todavía.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 border-b p-4 last:border-b-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileTextIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[doc.category ?? ""] ?? doc.category ?? "Documento"} ·{" "}
                  {formatDate(doc.created_at)}
                  {doc.size_bytes ? ` · ${formatBytes(doc.size_bytes)}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
