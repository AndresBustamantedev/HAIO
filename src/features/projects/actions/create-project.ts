"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"
import { projectSchema, type ProjectInput } from "@/features/projects/schemas/project-schema"

type ActionResult = { error: string | null; projectId?: string }

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input)
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

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organization.organizationId,
      client_id: parsed.data.client_id,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      type: parsed.data.type,
      status: parsed.data.status,
      description: parsed.data.description || null,
      budget: parsed.data.budget ? Number(parsed.data.budget) : null,
      start_date: parsed.data.start_date || null,
      target_date: parsed.data.target_date || null,
      repository_url: parsed.data.repository_url || null,
      production_url: parsed.data.production_url || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: "No se pudo crear el proyecto. " + error.message }
  }

  revalidatePath("/proyectos")
  revalidatePath("/dashboard")
  revalidatePath(`/clientes/${parsed.data.client_id}`)

  return { error: null, projectId: data.id }
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}
