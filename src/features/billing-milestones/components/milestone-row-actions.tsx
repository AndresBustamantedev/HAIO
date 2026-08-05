"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLinkIcon, FileTextIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteDialog } from "@/components/common/delete-dialog"
import { FormDrawer } from "@/components/common/form-drawer"
import { MilestoneForm } from "@/features/billing-milestones/components/milestone-form"
import { updateMilestone } from "@/features/billing-milestones/actions/update-milestone"
import { deleteMilestone } from "@/features/billing-milestones/actions/delete-milestone"
import { generateInvoiceFromMilestone } from "@/features/billing-milestones/actions/generate-invoice-from-milestone"
import type { MilestoneInput } from "@/features/billing-milestones/schemas/milestone-schema"
import type { ProjectMilestone } from "@/features/billing-milestones/queries/get-project-milestones"

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  sent: "Enviada",
  viewed: "Vista",
  partially_paid: "Parcialmente cobrada",
  paid: "Cobrada",
  overdue: "Vencida",
  void: "Anulada",
  refunded: "Reembolsada",
}

type MilestoneRowActionsProps = {
  milestone: ProjectMilestone
  projectId: string
  clientId: string
}

function MilestoneRowActions({ milestone, projectId, clientId }: MilestoneRowActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)

  const defaultValues: Partial<MilestoneInput> = {
    name: milestone.name,
    type: milestone.type,
    work_status: milestone.work_status,
    billing_status: milestone.billing_status,
    amount: String(milestone.amount),
    currency_code: milestone.currency_code,
    internal_cost: milestone.internal_cost != null ? String(milestone.internal_cost) : "",
    billing_interval: (milestone.billing_interval as MilestoneInput["billing_interval"]) ?? "",
    planned_date: milestone.planned_date ?? "",
    billed_at: milestone.billed_at ?? "",
    notes: milestone.notes ?? "",
    internal_notes: milestone.internal_notes ?? "",
  }

  async function handleGenerateInvoice() {
    setGenerating(true)
    const result = await generateInvoiceFromMilestone(milestone.id, projectId, clientId)
    setGenerating(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Factura ${result.invoiceNumber} creada como borrador.`)
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones del hito" disabled={generating} />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {milestone.invoice_id ? (
            <DropdownMenuItem render={<Link href={`/facturas/${milestone.invoice_id}`} />}>
              <ExternalLinkIcon />
              Ver factura {milestone.invoice_number ?? ""}
              {milestone.invoice_status && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {INVOICE_STATUS_LABEL[milestone.invoice_status] ?? milestone.invoice_status}
                </span>
              )}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleGenerateInvoice} disabled={generating}>
              <FileTextIcon />
              {generating ? "Generando..." : "Generar factura borrador"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar hito de facturación"
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
          router.refresh()
        }}
      />
    </>
  )
}

export { MilestoneRowActions }
