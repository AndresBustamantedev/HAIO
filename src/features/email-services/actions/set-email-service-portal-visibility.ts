"use server"

import { createClient } from "@/lib/supabase/server"
import { isStaffMember } from "@/lib/supabase/queries/portal"

export async function setEmailServicePortalVisibility(
  serviceId: string,
  visible: boolean,
): Promise<{ error: string | null }> {
  const isStaff = await isStaffMember()
  if (!isStaff) return { error: "Sin permisos." }

  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from("email_services")
    .update({ visible_in_portal: visible })
    .eq("id", serviceId)

  if (error) return { error: error.message }
  return { error: null }
}
