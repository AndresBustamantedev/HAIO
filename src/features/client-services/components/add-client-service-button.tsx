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

type AddClientServiceButtonProps = {
  clientId: string
  serviceOptions: ServiceOption[]
}

function AddClientServiceButton({ clientId, serviceOptions }: AddClientServiceButtonProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon className="size-3.5 mr-1.5" />
        Agregar servicio
      </Button>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title="Contratar servicio"
        description="Asocia un servicio del catálogo a este cliente."
      >
        <ClientServiceForm
          serviceOptions={serviceOptions}
          onSubmit={(values) => createClientService(clientId, values)}
          onSuccess={() => {
            toast.success("Servicio añadido.")
            setOpen(false)
            router.refresh()
          }}
          submitLabel="Contratar servicio"
        />
      </FormDrawer>
    </>
  )
}

export { AddClientServiceButton }
