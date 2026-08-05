"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { MilestoneForm } from "@/features/billing-milestones/components/milestone-form"
import { createMilestone } from "@/features/billing-milestones/actions/create-milestone"

type Props = {
  projectId: string
  clientId: string
  organizationId: string
}

function CostAddMilestone({ projectId, clientId, organizationId }: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PlusIcon />
        Añadir hito
      </Button>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Nuevo hito de facturación"
        description="Desarrollo, mantenimiento, extra o renovación dentro de este proyecto."
      >
        <MilestoneForm
          onSubmit={(values) => createMilestone(projectId, clientId, organizationId, values)}
          onSuccess={() => {
            toast.success("Hito creado.")
            setOpen(false)
            router.refresh()
          }}
        />
      </FormDrawer>
    </>
  )
}

export { CostAddMilestone }
