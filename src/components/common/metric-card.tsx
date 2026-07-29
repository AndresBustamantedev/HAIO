import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type MetricCardProps = {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  description?: string
  tone?: "neutral" | "success" | "warning" | "destructive"
  className?: string
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

/** Compact metric tile for dashboards: icon, label, value, optional caption. */
function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  tone = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
            <Icon className="size-4.5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { MetricCard }
