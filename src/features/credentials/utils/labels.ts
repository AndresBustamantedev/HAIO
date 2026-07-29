import type { Database } from "@/types/database.types"

type CredentialType = Database["public"]["Enums"]["credential_type"]

const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  website_admin: "Admin de sitio web",
  hosting_panel: "Panel de hosting",
  domain_registrar: "Registrador de dominio",
  ftp: "FTP",
  sftp: "SFTP",
  ssh: "SSH",
  database: "Base de datos",
  email: "Correo",
  api: "API",
  social_media: "Redes sociales",
  analytics: "Analítica",
  other: "Otro",
}

export function getCredentialTypeLabel(type: CredentialType) {
  return CREDENTIAL_TYPE_LABELS[type]
}
