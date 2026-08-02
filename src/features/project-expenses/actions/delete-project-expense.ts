"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

type Result = { error: string | null }

export async function deleteProjectExpense(expenseId: string, projectId: string): Promise<Result> {
  const org = await getCurrentOrganization()
  if (!org) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("project_expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId)
    .eq("organization_id", org.organizationId)

  if (error) return { error: "No se pudo eliminar el gasto." }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
