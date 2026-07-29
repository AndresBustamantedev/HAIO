import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type LoadingStateProps = {
  variant?: "table" | "cards" | "lines"
  rows?: number
  className?: string
}

/** Skeleton-based loading placeholder. Never a spinner, per DESIGN_SYSTEM.md. */
function LoadingState({ variant = "lines", rows = 5, className }: LoadingStateProps) {
  if (variant === "table") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  )
}

export { LoadingState }
