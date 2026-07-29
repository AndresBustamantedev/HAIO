import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusBadgeVariants = cva("", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      info: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      warning: "bg-warning/15 text-warning-foreground dark:text-warning",
      destructive: "bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
})

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  label: string
  className?: string
}

/**
 * Domain-agnostic status pill. Each feature module maps its own enum
 * (client_status, project_status, invoice_status, ...) to a `tone` + label
 * via a small helper in `features/<module>/utils`, then renders
 * `<StatusBadge tone={...} label={...} />`.
 */
function StatusBadge({ tone, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", statusBadgeVariants({ tone }), className)}
    >
      {label}
    </Badge>
  )
}

export { StatusBadge, statusBadgeVariants }
export type { StatusBadgeProps }
