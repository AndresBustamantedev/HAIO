import type { Database } from "@/types/database.types"

type DocumentCategory = Database["public"]["Enums"]["document_category"]

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: "Contrato",
  quote: "Presupuesto",
  invoice: "Factura",
  receipt: "Recibo",
  brief: "Brief",
  report: "Informe",
  credential_export: "Exportación de credenciales",
  legal: "Legal",
  other: "Otro",
}

export function getDocumentCategoryLabel(category: DocumentCategory) {
  return CATEGORY_LABELS[category]
}

export function formatFileSize(bytes: number | null) {
  if (!bytes) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}
