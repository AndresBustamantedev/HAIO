import { AlertTriangleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type ErrorStateProps = {
  title?: string
  description?: string
  /** Optional retry link/action. Server Components should link to the same route to re-fetch. */
  retryHref?: string
  className?: string
}

/** Clear error message + "Reintentar" action, per DESIGN_SYSTEM.md. */
function ErrorState({
  title = "No se pudo cargar la información",
  description,
  retryHref,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 py-16 text-center",
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {retryHref ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          render={<a href={retryHref} />}
        >
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
