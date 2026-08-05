"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { ClientServiceForm } from "@/features/client-services/components/client-service-form"
import { createClientService } from "@/features/client-services/actions/create-client-service"
import type { ServiceOption } from "@/features/services/queries/get-service-options"

type Props = {
  clientId: string
  projectId: string
  serviceOptions: ServiceOption[]
}

function CostAddService({ clientId, projectId, serviceOptions }: Props) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon className="size-3.5 mr-1.5" />
        Añadir servicio
      </Button>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Añadir servicio al proyecto"
        description="El servicio quedará vinculado al proyecto y al cliente."
      >
        <ClientServiceForm
          serviceOptions={serviceOptions}
          onSubmit={(values) => createClientService(clientId, values, projectId)}
          onSuccess={() => {
            toast.success("Servicio añadido al proyecto.")
            setOpen(false)
            router.refresh()
          }}
          submitLabel="Añadir servicio"
        />
      </FormDrawer>
    </>
  )
}

export { CostAddService }
