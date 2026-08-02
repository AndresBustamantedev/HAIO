"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  email: z.string().trim().email("Email no válido.").optional().or(z.literal("")),
  role: z.enum(["owner", "developer", "designer", "marketing", "client", "seo", "other"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})

type Input = z.infer<typeof schema>
type Result = { error: string | null }

export async function updateProjectMember(memberId: string, projectId: string, input: Input): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("project_members")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      role: parsed.data.role,
      notes: parsed.data.notes || null,
    })
    .eq("id", memberId)

  if (error) return { error: "No se pudo actualizar el acceso. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
