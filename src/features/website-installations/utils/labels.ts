import { CMS_TYPES, ENVIRONMENTS, INSTALLATION_STATUSES } from "@/features/website-installations/schemas/website-installation-schema"

export function getCmsTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    wordpress: "WordPress",
    woocommerce: "WooCommerce",
    joomla: "Joomla",
    drupal: "Drupal",
    magento: "Magento",
    prestashop: "PrestaShop",
    shopify: "Shopify",
    custom: "Desarrollo a medida",
    other: "Otro",
  }
  return type ? (labels[type] ?? type) : "Desconocido"
}

export function getEnvironmentLabel(env: string | null): string {
  const labels: Record<string, string> = {
    production: "Producción",
    staging: "Preproducción",
    development: "Desarrollo",
  }
  return env ? (labels[env] ?? env) : "—"
}

export function getInstallationStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    maintenance: "Mantenimiento",
    deprecated: "Obsoleto",
  }
  return status ? (labels[status] ?? status) : "—"
}

export { CMS_TYPES, ENVIRONMENTS, INSTALLATION_STATUSES }
