"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { taskSchema, type TaskInput } from "@/features/tasks/schemas/task-schema"

type ActionResult = { error: string | null }

export async function createTask(input: TaskInput): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const organization = await getCurrentOrganization()
  if (!organization) {
    return { error: "No perteneces a ninguna organización." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("tasks").insert({
    organization_id: organization.organizationId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    client_id: parsed.data.client_id || null,
    project_id: parsed.data.project_id || null,
    due_date: parsed.data.due_date || null,
    created_by: user?.id ?? null,
  })

  if (error) {
    return { error: "No se pudo crear la tarea. " + error.message }
  }

  revalidatePath("/tareas")
  revalidatePath("/dashboard")

  return { error: null }
}
