"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

const schema = z.object({
  project_id: z.string().uuid(),
  type: z.enum(["note", "wiki", "changelog", "snippet"]),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "El contenido es obligatorio.").max(10000),
  pinned: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  entry_date: z.string().optional().or(z.literal("")),
})

type Input = z.infer<typeof schema>
type Result = { error: string | null; id?: string }

export async function createProjectNote(input: Input): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const org = await getCurrentOrganization()
  if (!org) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("project_notes")
    .insert({
      organization_id: org.organizationId,
      project_id: parsed.data.project_id,
      type: parsed.data.type,
      title: parsed.data.title || null,
      body: parsed.data.body,
      pinned: parsed.data.pinned ?? false,
      metadata: parsed.data.metadata ?? {},
      entry_date: parsed.data.entry_date || null,
      created_by: user?.id ?? null,
      updated_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (error) return { error: "No se pudo crear la nota. " + error.message }

  revalidatePath(`/proyectos/${parsed.data.project_id}`)
  return { error: null, id: (data as { id: string }).id }
}
