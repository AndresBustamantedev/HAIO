import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { isStaffMember, getPortalSession } from "@/lib/supabase/queries/portal"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [staff, portalSession] = await Promise.all([isStaffMember(), getPortalSession()])

  if (staff) redirect("/dashboard")
  if (portalSession) redirect("/portal")

  // Authenticated but no membership and no portal access → back to login
  redirect("/login")
}
