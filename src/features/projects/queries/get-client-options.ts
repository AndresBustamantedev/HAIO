// Deprecated: moved to a shared location since every module that links
// records to a client needs this same lightweight option list. Kept as a
// re-export for backwards compatibility (file could not be deleted in this
// environment — safe to remove by hand).
export { getClientOptions } from "@/lib/supabase/queries/client-options"
export type { ClientOption } from "@/lib/supabase/queries/client-options"
