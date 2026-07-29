"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectFormDrawer } from "@/features/projects/components/project-form-drawer"
import type { ClientOption } from "@/features/projects/types"

/** "+ Nuevo proyecto" button. Also opens automatically via ?new=1 (dashboard quick action). */
function CreateProjectButton({ clientOptions }: { clientOptions: ClientOption[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(searchParams.get("new") === "1")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next && searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("new")
      router.replace(params.toString() ? `/proyectos?${params.toString()}` : "/proyectos")
    }
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <PlusIcon />
        Nuevo proyecto
      </Button>
      <ProjectFormDrawer open={open} onOpenChange={handleOpenChange} clientOptions={clientOptions} />
    </>
  )
}

export { CreateProjectButton }
