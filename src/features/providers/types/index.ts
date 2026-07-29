import type { Database } from "@/types/database.types"

export type Provider = Database["public"]["Tables"]["providers"]["Row"]
export type ProviderAccount = Database["public"]["Tables"]["provider_accounts"]["Row"]

export type ProviderWithAccounts = Provider & {
  provider_accounts: Pick<ProviderAccount, "id" | "label">[]
}

export type ProviderAccountWithProvider = ProviderAccount & {
  providers: Pick<Provider, "id" | "name" | "category"> | null
}
