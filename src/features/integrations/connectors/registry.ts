import type { ProviderConnector, ConnectorMeta } from './types'
import { UnknownConnectorError } from './errors'

import { GoDaddyConnector,          GODADDY_META }           from './godaddy/connector'
import { CloudflareConnector,       CLOUDFLARE_META }        from './cloudflare/connector'
import { HostingerConnector,        HOSTINGER_META }         from './hostinger/connector'
import { OvhConnector,              OVH_META }               from './ovh/connector'
import { NamecheapConnector,        NAMECHEAP_META }         from './namecheap/connector'
import { PorkbunConnector,          PORKBUN_META }           from './porkbun/connector'
import { VercelConnector,           VERCEL_META }            from './vercel/connector'
import { GitHubConnector,           GITHUB_META }            from './github/connector'
import { SupabaseConnector,         SUPABASE_META }          from './supabase/connector'
import { ZohoMailConnector,         ZOHO_MAIL_META }         from './zoho-mail/connector'
import { GoogleWorkspaceConnector,  GOOGLE_WORKSPACE_META }  from './google-workspace/connector'
import { Microsoft365Connector,     MICROSOFT_365_META }     from './microsoft-365/connector'
import { StripeConnector,           STRIPE_META }            from './stripe/connector'

// ── Registro de conectores ────────────────────────────────────────────────────
//
// Para añadir un nuevo conector:
//   1. Implementa ProviderConnector en connectors/{provider}/connector.ts
//   2. Exporta también su ConnectorMeta como {NAME}_META
//   3. Añade ambas entradas a los dos Maps de abajo

const connectorInstances = new Map<string, ProviderConnector>([
  ['godaddy',           new GoDaddyConnector()],
  ['cloudflare',        new CloudflareConnector()],
  ['hostinger',         new HostingerConnector()],
  ['ovh',               new OvhConnector()],
  ['namecheap',         new NamecheapConnector()],
  ['porkbun',           new PorkbunConnector()],
  ['vercel',            new VercelConnector()],
  ['github',            new GitHubConnector()],
  ['supabase',          new SupabaseConnector()],
  ['zoho-mail',         new ZohoMailConnector()],
  ['google-workspace',  new GoogleWorkspaceConnector()],
  ['microsoft-365',     new Microsoft365Connector()],
  ['stripe',            new StripeConnector()],
])

const connectorMetas = new Map<string, ConnectorMeta>([
  ['godaddy',           GODADDY_META],
  ['cloudflare',        CLOUDFLARE_META],
  ['hostinger',         HOSTINGER_META],
  ['ovh',               OVH_META],
  ['namecheap',         NAMECHEAP_META],
  ['porkbun',           PORKBUN_META],
  ['vercel',            VERCEL_META],
  ['github',            GITHUB_META],
  ['supabase',          SUPABASE_META],
  ['zoho-mail',         ZOHO_MAIL_META],
  ['google-workspace',  GOOGLE_WORKSPACE_META],
  ['microsoft-365',     MICROSOFT_365_META],
  ['stripe',            STRIPE_META],
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
