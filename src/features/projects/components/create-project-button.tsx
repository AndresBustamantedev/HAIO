"use client"

import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** "+ Nuevo proyecto" button. Navigates to the 3-step wizard at /proyectos/nuevo. */
function CreateProjectButton() {
  const router = useRouter()

  return (
    <Button onClick={() => router.push("/proyectos/nuevo")}>
      <PlusIcon />
      Nuevo proyecto
    </Button>
  )
}

export { CreateProjectButton }
