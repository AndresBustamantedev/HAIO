import { CheckCircle2Icon, CloudIcon, HardDriveIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type StatusItem = {
  label: string
  status: "active" | "operative" | "storage"
  icon?: React.ElementType
  storageUsed?: number
  storageTotal?: number
}

const SERVICES: StatusItem[] = [
  { label: "Backups automáticos", status: "active" },
  { label: "Monitor de sitios", status: "active" },
  { label: "Notificaciones", status: "active" },
  { label: "Integración correo", status: "active" },
  { label: "Almacenamiento", status: "storage", icon: HardDriveIcon, storageUsed: 2.4, storageTotal: 20 },
  { label: "API Supabase", status: "operative", icon: CloudIcon },
]

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  operative: "Operativo",
}

function ServiceStatusCard() {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-sm font-semibold text-foreground">Estado de servicios</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map((service) => (
            <div key={service.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-xs">
                {service.status === "storage" ? (
                  <HardDriveIcon className="size-3.5 text-muted-foreground" />
                ) : service.icon ? (
                  <service.icon className="size-3.5 text-muted-foreground" />
                ) : (
                  <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                )}
                <span className="font-medium text-foreground">{service.label}</span>
              </div>
              {service.status === "storage" ? (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${((service.storageUsed ?? 0) / (service.storageTotal ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {service.storageUsed} GB / {service.storageTotal} GB
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {STATUS_LABEL[service.status] ?? service.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { ServiceStatusCard }
