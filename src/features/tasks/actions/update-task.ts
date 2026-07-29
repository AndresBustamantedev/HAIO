"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { taskSchema, type TaskInput } from "@/features/tasks/schemas/task-schema"

type ActionResult = { error: string | null }

export async function updateTask(taskId: string, input: TaskInput): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      client_id: parsed.data.client_id || null,
      project_id: parsed.data.project_id || null,
      due_date: parsed.data.due_date || null,
      completed_at: parsed.data.status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)

  if (error) {
    return { error: "No se pudo actualizar la tarea. " + error.message }
  }

  revalidatePath("/tareas")
  revalidatePath("/dashboard")

  return { error: null }
}
