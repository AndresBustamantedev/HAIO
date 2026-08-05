"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormDrawer } from "@/components/common/form-drawer"
import { CredentialForm } from "@/features/credentials/components/credential-form"
import { createProjectCredential } from "@/features/credentials/actions/create-project-credential"

type Props = { projectId: string; clientId: string; defaultShared?: boolean }

export function VaultAddCredential({ projectId, clientId, defaultShared = false }: Props) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-1.5 size-4" />
        Añadir
      </Button>

      <FormDrawer
        open={open}
        onOpenChange={setOpen}
        title={defaultShared ? "Nueva credencial — Portal cliente" : "Nueva credencial — Solo admin"}
        description={
          defaultShared
            ? "El cliente podrá ver esta credencial en su portal."
            : "Solo los administradores podrán ver esta credencial."
        }
      >
        <CredentialForm
          clientOptions={[]}
          projectOptions={[]}
          defaultValues={{ client_id: clientId, is_shared_with_client: defaultShared }}
          onSubmit={(values) => createProjectCredential(projectId, clientId, values)}
          onSuccess={() => {
            toast.success("Credencial creada.")
            setOpen(false)
            router.refresh()
          }}
          submitLabel="Crear credencial"
        />
      </FormDrawer>
    </>
  )
}
