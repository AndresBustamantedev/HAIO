import type { Database } from "@/types/database.types"

export type WebsiteInstallation = Database["public"]["Tables"]["website_installations"]["Row"]
export type HostingSite = Database["public"]["Tables"]["hosting_sites"]["Row"]

export type WebsiteInstallationWithClient = WebsiteInstallation & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
  hosting_sites: Pick<HostingSite, "id" | "site_label"> | null
}
