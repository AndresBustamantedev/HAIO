import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Consistent max-width/padding wrapper for every private page. Use once per
 * page, directly under the route's `<main>`.
 */
function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6", className)}
      {...props}
    />
  )
}

export { PageContainer }
