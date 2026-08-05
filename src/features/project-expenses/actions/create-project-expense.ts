"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getCurrentOrganization } from "@/lib/supabase/queries/organizations"

const schema = z.object({
  description: z.string().trim().min(1, "La descripción es obligatoria.").max(300),
  amount: z.coerce.number().min(0, "El importe no puede ser negativo."),
  currency_code: z.string().length(3).default("EUR"),
  category: z.enum(["hosting", "domain", "license", "tool", "design", "development", "other"]).default("other"),
  incurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().slice(0, 10)),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  milestone_id: z.string().uuid().optional(),
})

export type CreateExpenseInput = z.infer<typeof schema>
type Result = { error: string | null }

export async function createProjectExpense(projectId: string, input: CreateExpenseInput): Promise<Result> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos no válidos." }

  const org = await getCurrentOrganization()
  if (!org) return { error: "No perteneces a ninguna organización." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("project_expenses").insert({
    organization_id: org.organizationId,
    project_id: projectId,
    milestone_id: parsed.data.milestone_id ?? null,
    description: parsed.data.description,
    amount: parsed.data.amount,
    currency_code: parsed.data.currency_code,
    category: parsed.data.category,
    incurred_at: parsed.data.incurred_at,
    notes: parsed.data.notes || null,
    created_by: user?.id ?? null,
  })

  if (error) return { error: "No se pudo guardar el gasto. " + error.message }

  revalidatePath(`/proyectos/${projectId}`)
  return { error: null }
}
