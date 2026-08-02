"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "El contenido es obligatorio.").max(10000),
  pinned: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

type Input = z.infer<typeof schema>
type Result = { error: string | null }

export async function updateProjectNote(noteId: string, projectId: string, input: Input): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("project_notes")
    .update({
      title: parsed.data.title || null,
      body: parsed.data.body,
      pinned: parsed.data.pinned,
      metadata: parsed.data.metadata,
      updated_by: user?.id ?? null,
    })
    .eq("id", noteId)
    .is("deleted_at", null)

  if (error) return { error: "No se pudo actualizar la nota. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
