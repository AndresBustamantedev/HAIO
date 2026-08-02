"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { XIcon } from "lucide-react"

import { createPortalTicket } from "@/features/tickets/actions/create-portal-ticket"

type Project = { id: string; name: string }

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
] as const

export function NewTicketForm({
  projects,
  onClose,
}: {
  projects: Project[]
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "")
  const [priority, setPriority] = React.useState<"low" | "normal" | "high" | "urgent">("normal")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) {
      toast.error("El asunto es obligatorio.")
      return
    }
    setPending(true)
    try {
      const result = await createPortalTicket({
        project_id: projectId || undefined,
        subject: subject.trim(),
        description: description.trim() || undefined,
        priority,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Ticket enviado. Te responderemos pronto.")
      onClose()
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground">Nuevo ticket de soporte</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Proyecto */}
        {projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Proyecto
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Asunto */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Asunto <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="Describe brevemente tu consulta"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Añade todos los detalles que nos ayuden a entender el problema"
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Prioridad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Prioridad</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !subject.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? "Enviando…" : "Enviar ticket"}
          </button>
        </div>
      </form>
    </div>
  )
}
