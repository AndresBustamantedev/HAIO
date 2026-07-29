"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { projectSchema, type ProjectInput } from "@/features/projects/schemas/project-schema"

type ActionResult = { error: string | null }

export async function updateProject(projectId: string, input: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from("projects")
    .update({
      client_id: parsed.data.client_id,
      name: parsed.data.name,
      type: parsed.data.type,
      status: parsed.data.status,
      description: parsed.data.description || null,
      budget: parsed.data.budget ? Number(parsed.data.budget) : null,
      start_date: parsed.data.start_date || null,
      target_date: parsed.data.target_date || null,
      repository_url: parsed.data.repository_url || null,
      production_url: parsed.data.production_url || null,
      updated_by: user?.id ?? null,
    })
    .eq("id", projectId)

  if (error) {
    return { error: "No se pudo actualizar el proyecto. " + error.message }
  }

  revalidatePath("/proyectos")
  revalidatePath(`/proyectos/${projectId}`)
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null }
}
