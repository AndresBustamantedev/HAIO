import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { QuoteDetail, QuoteWithClient } from "@/features/quotes/types"

export async function getQuoteDetail(quoteId: string): Promise<QuoteDetail | null> {
  const supabase = await createClient()

  const quoteRes = await supabase
    .from("quotes")
    .select("*, clients(id, display_name)")
    .eq("id", quoteId)
    .is("deleted_at", null)
    .maybeSingle()

  if (quoteRes.error || !quoteRes.data) {
    return null
  }

  const itemsRes = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("position", { ascending: true })

  return {
    quote: quoteRes.data as QuoteWithClient,
    items: itemsRes.data ?? [],
  }
}
