"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type Input = {
  name: string
  description?: string
  due_date?: string
  external_url?: string
}

type Result = { error: string | null; id?: string }

export async function createDeliverable(
  milestoneId: string,
  projectId: string,
  data: Input,
): Promise<Result> {
  if (!data.name?.trim()) return { error: "El nombre es obligatorio." }

  const organization = await getCurrentOrganization()
  if (!organization) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: row, error } = await (supabase as any)
    .from("milestone_deliverables")
    .insert({
      organization_id: organization.organizationId,
      milestone_id: milestoneId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      due_date: data.due_date || null,
      external_url: data.external_url?.trim() || null,
      status: "pending",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/proyectos/${projectId}/hitos/${milestoneId}`)
  return { error: null, id: row.id }
}
