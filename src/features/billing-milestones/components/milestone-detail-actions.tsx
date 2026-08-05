"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { MilestoneForm } from "@/features/billing-milestones/components/milestone-form"
import { updateMilestone } from "@/features/billing-milestones/actions/update-milestone"
import { deleteMilestone } from "@/features/billing-milestones/actions/delete-milestone"
import type { MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"
import type { MilestoneDetail } from "@/features/billing-milestones/queries/get-milestone-detail"

type Props = {
  milestone: MilestoneDetail
  projectId: string
}

export function MilestoneDetailActions({ milestone, projectId }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const defaultValues: Partial<MilestoneInput> = {
    name: milestone.name,
    type: milestone.type as MilestoneInput["type"],
    work_status: milestone.work_status as MilestoneInput["work_status"],
    billing_status: milestone.billing_status as MilestoneInput["billing_status"],
    amount: String(milestone.amount),
    currency_code: milestone.currency_code,
    internal_cost: milestone.internal_cost != null ? String(milestone.internal_cost) : "",
    billing_interval: (milestone.billing_interval ?? "") as MilestoneInput["billing_interval"],
    planned_date: milestone.planned_date ?? "",
    billed_at: milestone.billed_at ?? "",
    notes: milestone.notes ?? "",
    internal_notes: milestone.internal_notes ?? "",
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <PencilIcon className="size-3.5" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="size-3.5" />
          Eliminar
        </Button>
      </div>

      <FormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar hito"
        description={milestone.name}
      >
        <MilestoneForm
          defaultValues={defaultValues}
          onSubmit={(values) => updateMilestone(milestone.id, projectId, values)}
          onSuccess={() => {
            toast.success("Hito actualizado.")
            setEditOpen(false)
            router.refresh()
          }}
          submitLabel="Guardar cambios"
        />
      </FormDrawer>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={milestone.name}
        onConfirm={async () => {
          const result = await deleteMilestone(milestone.id, projectId)
          if (result.error) { toast.error(result.error); return }
          toast.success("Hito eliminado.")
          router.push(`/proyectos/${projectId}?tab=finanzas&view=hitos`)
        }}
      />
    </>
  )
}
