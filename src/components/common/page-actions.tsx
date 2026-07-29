import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Generic group of buttons. Use inside <PageHeader actions={...}> or in a
 * toolbar to keep spacing between primary/secondary actions consistent.
 */
function PageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-actions"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export { PageActions }
