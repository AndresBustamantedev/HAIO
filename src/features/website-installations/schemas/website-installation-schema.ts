import { z } from "zod"

export const CMS_TYPES = [
  "wordpress",
  "woocommerce",
  "joomla",
  "drupal",
  "magento",
  "prestashop",
  "shopify",
  "custom",
  "other",
] as const

export const ENVIRONMENTS = ["production", "staging", "development"] as const

export const INSTALLATION_STATUSES = ["active", "inactive", "maintenance", "deprecated"] as const

export const websiteInstallationSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente."),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  cms_type: z.enum(CMS_TYPES),
  cms_version: z.string().trim().max(50).optional().or(z.literal("")),
  environment: z.enum(ENVIRONMENTS),
  status: z.enum(INSTALLATION_STATUSES),
  public_url: z.string().trim().url("Introduce una URL válida.").max(500).optional().or(z.literal("")),
  admin_url: z.string().trim().url("Introduce una URL válida.").max(500).optional().or(z.literal("")),
  hosting_site_id: z.string().uuid().optional().or(z.literal("")),
  domain_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type WebsiteInstallationInput = z.infer<typeof websiteInstallationSchema>
