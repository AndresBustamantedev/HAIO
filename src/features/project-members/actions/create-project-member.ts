"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

const schema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  email: z.string().trim().email("Email no válido.").optional().or(z.literal("")),
  role: z.enum(["owner", "developer", "designer", "marketing", "client", "seo", "other"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
})

type Input = z.infer<typeof schema>
type Result = { error: string | null; id?: string }

export async function createProjectMember(input: Input): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const org = await getCurrentOrganization()
  if (!org) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("project_members")
    .insert({
      organization_id: org.organizationId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      email: parsed.data.email || null,
      role: parsed.data.role,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single()

  if (error) return { error: "No se pudo añadir el acceso. " + error.message }

  revalidatePath(`/proyectos/${parsed.data.project_id}`)
  return { error: null, id: (data as { id: string }).id }
}
