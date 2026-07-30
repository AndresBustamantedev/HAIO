import { Badge } from '@/components/ui/badge'
import type { IntegrationStatus } from '@/features/integrations/types'

const STATUS_MAP: Record<
  IntegrationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  connected:    { label: 'Conectado',      variant: 'default' },
  disconnected: { label: 'Desconectado',   variant: 'secondary' },
  pending:      { label: 'Pendiente',      variant: 'outline' },
  degraded:     { label: 'Degradado',      variant: 'outline' },
  error:        { label: 'Error',          variant: 'destructive' },
  disabled:     { label: 'Desactivado',    variant: 'secondary' },
}

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  const { label, variant } = STATUS_MAP[status] ?? STATUS_MAP.disconnected
  return <Badge variant={variant}>{label}</Badge>
}
