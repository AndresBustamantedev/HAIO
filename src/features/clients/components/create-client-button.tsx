"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClientFormDrawer } from "@/features/clients/components/client-form-drawer"

/** "+ Nuevo cliente" button. Also opens automatically via ?new=1 (dashboard quick action). */
function CreateClientButton() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(searchParams.get("new") === "1")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next && searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("new")
      router.replace(params.toString() ? `/clientes?${params.toString()}` : "/clientes")
    }
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <PlusIcon />
        Nuevo cliente
      </Button>
      <ClientFormDrawer open={open} onOpenChange={handleOpenChange} />
    </>
  )
}

export { CreateClientButton }
