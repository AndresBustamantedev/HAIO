"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, ChevronUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProjectMember } from "@/features/project-members/actions/create-project-member"

type Role = "owner" | "developer" | "designer" | "marketing" | "client" | "seo" | "other"

const ROLES: { value: Role; label: string }[] = [
  { value: "developer",  label: "Desarrollador" },
  { value: "designer",   label: "Diseñador" },
  { value: "marketing",  label: "Marketing" },
  { value: "client",     label: "Cliente" },
  { value: "seo",        label: "SEO" },
  { value: "owner",      label: "Propietario" },
  { value: "other",      label: "Otro" },
]

type Props = { projectId: string; organizationId: string }

export function MemberAddForm({ projectId, organizationId: _ }: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<Role>("developer")
  const [notes, setNotes] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createProjectMember({
        project_id: projectId,
        name: name.trim(),
        email: email.trim() || undefined,
        role,
        notes: notes.trim() || undefined,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setName("")
      setEmail("")
      setRole("developer")
      setNotes("")
      setExpanded(false)
      toast.success("Acceso añadido.")
      router.refresh()
    })
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
        <PlusIcon className="mr-1.5 size-4" />
        Añadir persona
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input placeholder="Nombre *" value={name} onChange={(e) => setName(e.target.value)} required className="text-sm" />
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-sm" />
      </div>
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm" />
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          <ChevronUpIcon className="mr-1 size-4" />
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending ? "Guardando..." : "Añadir"}
        </Button>
      </div>
    </form>
  )
}
