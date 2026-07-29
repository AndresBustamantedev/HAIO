import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { getPortalSession } from "@/lib/supabase/queries/portal"
import { PortalHeader } from "@/components/layout/portal-header"
import { signOut } from "@/features/auth/actions/sign-out"

type PortalLayoutProps = {
  children: ReactNode
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const session = await getPortalSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <PortalHeader
        clientName={session.access.client.display_name}
        userEmail={session.userEmail}
        canViewProjects={session.access.can_view_projects}
        canViewInvoices={session.access.can_view_invoices}
        canViewDocuments={session.access.can_view_documents}
        canCreateTickets={session.access.can_create_tickets}
        onSignOut={signOut}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
