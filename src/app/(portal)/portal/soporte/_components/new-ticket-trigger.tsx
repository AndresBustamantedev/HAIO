"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { NewTicketForm } from "./new-ticket-form"

type Project = { id: string; name: string }

export function NewTicketTrigger({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false)

  if (open) {
    return <NewTicketForm projects={projects} onClose={() => setOpen(false)} />
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <PlusIcon className="size-3.5" />
      Nuevo ticket
    </button>
  )
}
