import { Badge } from '@/components/ui/badge'
import type { SyncRunStatus } from '@/features/integrations/types'

const STATUS_MAP: Record<
  SyncRunStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending:   { label: 'Pendiente',   variant: 'outline' },
  running:   { label: 'En curso',    variant: 'outline' },
  completed: { label: 'Completado',  variant: 'default' },
  partial:   { label: 'Parcial',     variant: 'outline' },
  failed:    { label: 'Fallido',     variant: 'destructive' },
}

export function SyncRunStatusBadge({ status }: { status: SyncRunStatus }) {
  const { label, variant } = STATUS_MAP[status] ?? STATUS_MAP.pending
  return <Badge variant={variant}>{label}</Badge>
}
