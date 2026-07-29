import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { signOut } from "@/features/auth/actions/sign-out";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    organization,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentOrganization()]);

  let unreadNotifications = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadNotifications = count ?? 0;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          userEmail={user?.email}
          organizationName={organization?.organizationName}
          unreadNotifications={unreadNotifications}
          onSignOut={signOut}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
