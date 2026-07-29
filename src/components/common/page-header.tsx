import * as React from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * Every page starts with: title, description, primary action + secondary
 * actions (rendered together via <PageActions>).
 */
function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export { PageHeader }
