import type { Database } from "@/types/database.types"

export type Quote = Database["public"]["Tables"]["quotes"]["Row"]
export type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"]

export type QuoteWithClient = Quote & {
  clients: Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "display_name"> | null
}

export type QuoteDetail = {
  quote: QuoteWithClient
  items: QuoteItem[]
}

export type { ClientOption } from "@/lib/supabase/queries/client-options"
