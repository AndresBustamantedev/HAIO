"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FolderIcon } from "lucide-react"
import { toast } from "sonner"

import { setEmailServiceProject } from "@/features/email-services/actions/set-email-service-project"

export type ProjectOption = { id: string; name: string }

export function ProjectAssignSelect({
  serviceId,
  currentProjectId,
  projectOptions,
}: {
  serviceId: string
  currentProjectId: string | null
  projectOptions: ProjectOption[]
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null
    setPending(true)
    const result = await setEmailServiceProject(serviceId, value)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(value ? "Servicio asignado al proyecto." : "Asignación de proyecto eliminada.")
      router.refresh()
    }
    setPending(false)
  }

  return (
    <label className="flex items-center gap-1.5 text-xs">
      <FolderIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
      <select
        value={currentProjectId ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="max-w-[180px] truncate rounded border-0 bg-transparent py-0 pl-0 pr-5 text-xs text-muted-foreground outline-none hover:text-foreground focus:ring-0 disabled:opacity-50 cursor-pointer"
      >
        <option value="">Sin proyecto</option>
        {projectOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  )
}
