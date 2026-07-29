import { notFound } from "next/navigation"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/page-header"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBackupConfigDetail } from "@/features/backups/queries/get-backup-config-detail"
import { getBackupStatusBadge } from "@/features/backups/utils/status"
import { formatFileSize } from "@/features/documents/utils/labels"

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

type BackupDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function BackupDetailPage({ params }: BackupDetailPageProps) {
  const { id } = await params
  const detail = await getBackupConfigDetail(id)

  if (!detail) {
    notFound()
  }

  const { config, records } = detail
  const badge = getBackupStatusBadge(config.status)

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Backups", href: "/backups" }, { label: config.name }]} />

      <PageHeader
        title={config.name}
        description={config.clients?.display_name ?? "Configuración interna"}
        actions={<StatusBadge tone={badge.tone} label={badge.label} />}
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-foreground">Detalles de la configuración</p>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Proveedor</dt>
            <dd className="text-foreground">{config.provider_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Frecuencia</dt>
            <dd className="text-foreground">{config.frequency}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Retención</dt>
            <dd className="text-foreground">{config.retention_days} días</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Próxima ejecución</dt>
            <dd className="text-foreground">{formatDateTime(config.next_run_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Historial de ejecuciones</p>
        {records.length === 0 ? (
          <EmptyState title="Sin ejecuciones registradas" description="Todavía no se ha registrado ninguna copia de seguridad." />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const recordBadge = getBackupStatusBadge(record.status)
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground">{formatDateTime(record.started_at)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(record.finished_at)}</TableCell>
                      <TableCell>
                        <StatusBadge tone={recordBadge.tone} label={recordBadge.label} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatFileSize(record.size_bytes)}</TableCell>
                      <TableCell className="text-destructive">{record.error_message ?? "—"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
