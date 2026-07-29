import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database.types"
import type { ProjectWithClient } from "@/features/projects/types"

export type ProjectDetail = {
  project: ProjectWithClient
  services: Array<
    Database["public"]["Tables"]["client_services"]["Row"] & {
      services: Pick<Database["public"]["Tables"]["services"]["Row"], "name" | "category"> | null
    }
  >
  tasks: Database["public"]["Tables"]["tasks"]["Row"][]
  documents: Database["public"]["Tables"]["documents"]["Row"][]
  activity: Database["public"]["Tables"]["activity_logs"]["Row"][]
}

/**
 * Everything the project detail page needs, fetched in parallel. Every table
 * is scoped to `project_id` and protected by RLS.
 */
export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createClient()

  const projectRes = await supabase
    .from("projects")
    .select("*, clients(id, display_name)")
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle()

  if (projectRes.error || !projectRes.data) {
    return null
  }

  const [services, tasks, documents, activity] = await Promise.all([
    supabase
      .from("client_services")
      .select("*, services(name, category)")
      .eq("project_id", projectId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("position", { ascending: true }),
    supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "project")
      .eq("entity_id", projectId)
      .order("created_at", { ascending: false })
      .limit(15),
  ])

  return {
    project: projectRes.data as ProjectWithClient,
    services: services.data ?? [],
    tasks: tasks.data ?? [],
    documents: documents.data ?? [],
    activity: activity.data ?? [],
  }
}
