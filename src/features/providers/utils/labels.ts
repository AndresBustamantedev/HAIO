import type { Database } from "@/types/database.types"

type ProviderCategory = Database["public"]["Enums"]["provider_category"]

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  registrar: "Registrador de dominios",
  hosting: "Hosting",
  email: "Correo",
  dns: "DNS",
  cms: "CMS",
  cloud: "Cloud / Infraestructura",
  other: "Otro",
}

export function getProviderCategoryLabel(category: ProviderCategory | null): string {
  if (!category) return "Desconocido"
  return CATEGORY_LABELS[category] ?? category
}

export const PROVIDER_CATEGORIES: ProviderCategory[] = [
  "registrar",
  "hosting",
  "email",
  "dns",
  "cms",
  "cloud",
  "other",
]
