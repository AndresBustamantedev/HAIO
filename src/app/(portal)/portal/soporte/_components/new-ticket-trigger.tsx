"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { NewTicketForm } from "./new-ticket-form"

type Project = { id: string; name: string }

export function NewTicketTrigger({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <PlusIcon className="size-3.5" />
        Nuevo ticket
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-lg">
            <NewTicketForm projects={projects} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
