"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PencilIcon, Trash2Icon, XIcon, CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProjectMember } from "@/features/project-members/actions/update-project-member"
import { deleteProjectMember } from "@/features/project-members/actions/delete-project-member"

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

type Props = {
  memberId: string
  projectId: string
  defaultValues: { name: string; email: string; role: Role; notes: string }
}

export function MemberActions({ memberId, projectId, defaultValues }: Props) {
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(defaultValues.name)
  const [email, setEmail] = React.useState(defaultValues.email)
  const [role, setRole] = React.useState<Role>(defaultValues.role)
  const [notes, setNotes] = React.useState(defaultValues.notes)
  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, startDelete] = React.useTransition()
  const router = useRouter()

  function handleSave() {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await updateProjectMember(memberId, projectId, { name: name.trim(), email: email || undefined, role, notes: notes || undefined })
      if (result.error) { toast.error(result.error); return }
      setEditing(false)
      toast.success("Acceso actualizado.")
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este acceso?")) return
    startDelete(async () => {
      const result = await deleteProjectMember(memberId, projectId)
      if (result.error) { toast.error(result.error); return }
      toast.success("Acceso eliminado.")
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 w-full mt-2 border-t pt-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *" className="text-sm" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="text-sm" />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" className="text-sm" />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
            <CheckIcon className="mr-1 size-4" />
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(defaultValues.name); setEmail(defaultValues.email); setRole(defaultValues.role); setNotes(defaultValues.notes) }}>
            <XIcon className="mr-1 size-4" />
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button variant="ghost" size="icon" onClick={() => setEditing(true)} title="Editar">
        <PencilIcon className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Eliminar">
        <Trash2Icon className="size-4 text-destructive" />
      </Button>
    </div>
  )
}
