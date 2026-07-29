import type { Database } from "@/types/database.types"

export type EmailAccount = Database["public"]["Tables"]["email_accounts"]["Row"]

export type EmailAccountWithService = EmailAccount & {
  email_services: Pick<
    Database["public"]["Tables"]["email_services"]["Row"],
    "id" | "provider_name"
  > | null
}

export type EmailServiceOption = {
  id: string
  provider_name: string
}
