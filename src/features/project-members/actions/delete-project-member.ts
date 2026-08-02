"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

type Result = { error: string | null }

export async function deleteProjectMember(memberId: string, projectId: string): Promise<Result> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("project_members")
    .delete()
    .eq("id", memberId)

  if (error) return { error: "No se pudo eliminar el acceso. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
