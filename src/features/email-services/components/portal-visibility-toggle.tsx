"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { GlobeIcon } from "lucide-react"
import { toast } from "sonner"

import { setEmailServicePortalVisibility } from "@/features/email-services/actions/set-email-service-portal-visibility"

export function PortalVisibilityToggle({
  serviceId,
  visible,
}: {
  serviceId: string
  visible: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [optimistic, setOptimistic] = React.useState(visible)

  async function handleChange(next: boolean) {
    setPending(true)
    setOptimistic(next)
    const result = await setEmailServicePortalVisibility(serviceId, next)
    if (result.error) {
      toast.error(result.error)
      setOptimistic(!next)
    } else {
      toast.success(next ? "Visible en portal del cliente." : "Oculto en portal del cliente.")
      router.refresh()
    }
    setPending(false)
  }

  return (
    <label
      className="flex cursor-pointer items-center gap-1.5 text-xs select-none"
      title={optimistic ? "Visible en el portal del cliente" : "No visible en el portal del cliente"}
    >
      <GlobeIcon className={`size-3.5 ${optimistic ? "text-primary" : "text-muted-foreground/40"}`} />
      <span className={optimistic ? "text-primary font-medium" : "text-muted-foreground"}>
        {optimistic ? "Compartido" : "Sin compartir"}
      </span>
      {/* visually hidden checkbox styled as toggle */}
      <span
        role="switch"
        aria-checked={optimistic}
        aria-disabled={pending}
        onClick={() => !pending && handleChange(!optimistic)}
        className={`relative ml-1 inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none ${
          optimistic ? "bg-primary" : "bg-input"
        } ${pending ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute size-3 rounded-full bg-white shadow-sm transition-transform ${
            optimistic ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </label>
  )
}
