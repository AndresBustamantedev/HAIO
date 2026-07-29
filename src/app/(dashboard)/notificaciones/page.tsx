import Link from "next/link";
import { BellIcon } from "lucide-react";

import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TablePagination } from "@/components/common/table-pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { getNotifications } from "@/features/notifications/queries/get-notifications";
import { createClient } from "@/lib/supabase/server";

type NotificacionesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NotificacionesPage({ searchParams }: NotificacionesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Notificaciones" description="Tus notificaciones recientes." />
        <EmptyState icon={BellIcon} title="Inicia sesión para ver tus notificaciones" />
      </PageContainer>
    );
  }

  const page = Number(params.page ?? "1") || 1;
  const onlyUnread = params.unread === "1";

  let result;
  try {
    result = await getNotifications({ userId: user.id, onlyUnread, page });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Notificaciones" description="Tus notificaciones recientes." />
        <ErrorState description="No se pudieron cargar las notificaciones." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Notificaciones"
        description="Tus notificaciones recientes."
        actions={<MarkAllReadButton />}
      />

      <div className="flex items-center gap-2">
        <Link
          href="/notificaciones"
          className={cn(buttonVariants({ variant: onlyUnread ? "outline" : "secondary", size: "sm" }))}
        >
          Todas
        </Link>
        <Link
          href="/notificaciones?unread=1"
          className={cn(buttonVariants({ variant: onlyUnread ? "secondary" : "outline", size: "sm" }))}
        >
          No leídas
        </Link>
      </div>

      {result.notifications.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title={onlyUnread ? "No tienes notificaciones sin leer" : "Todavía no hay notificaciones"}
        />
      ) : (
        <NotificationsList notifications={result.notifications} />
      )}

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/notificaciones"
        searchParams={params as Record<string, string | undefined>}
      />
    </PageContainer>
  );
}
