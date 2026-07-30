import type { ProviderConnector, ConnectorMeta } from './types'
import { UnknownConnectorError } from './errors'
import { GoDaddyConnector, GODADDY_META } from './godaddy/connector'

// ── Registro de conectores ────────────────────────────────────────────────────
//
// Para añadir un nuevo conector:
//   1. Implementa ProviderConnector en connectors/{provider}/connector.ts
//   2. Exporta también su ConnectorMeta como {NAME}_META
//   3. Añade ambas entradas aquí

const connectorInstances = new Map<string, ProviderConnector>([
  ['godaddy', new GoDaddyConnector()],
  // ['cloudflare', new CloudflareConnector()],
  // ['namecheap',  new NamecheapConnector()],
])

const connectorMetas = new Map<string, ConnectorMeta>([
  ['godaddy', GODADDY_META],
  // ['cloudflare', CLOUDFLARE_META],
])

/** Devuelve el conector para el tipo dado. Lanza UnknownConnectorError si no existe. */
export function getConnector(connectorType: string): ProviderConnector {
  const connector = connectorInstances.get(connectorType)
  if (!connector) throw new UnknownConnectorError(connectorType)
  return connector
}

/** Devuelve la metadata del conector para la UI. */
export function getConnectorMeta(connectorType: string): ConnectorMeta | undefined {
  return connectorMetas.get(connectorType)
}

/** Lista todos los tipos de conectores registrados. */
export function listConnectorTypes(): string[] {
  return Array.from(connectorInstances.keys())
}

/** Lista todos los conectores con su metadata (para la pantalla de nueva integración). */
export function listConnectorMetas(): ConnectorMeta[] {
  return Array.from(connectorMetas.values())
}
