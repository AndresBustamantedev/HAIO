"use client"

import { ChevronLeftIcon } from "lucide-react"

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronLeftIcon className="size-4" />
      Volver a facturas
    </button>
  )
}
