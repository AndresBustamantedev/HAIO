import { PageContainer } from "@/components/common/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "@/components/common/loading-state";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <LoadingState variant="cards" rows={5} />
      <LoadingState variant="cards" rows={4} />
    </PageContainer>
  );
}
