import { z } from "zod"

export const MILESTONE_TYPES = ["development", "maintenance", "extra", "renewal", "other"] as const
export const MILESTONE_WORK_STATUSES = ["draft", "planned", "in_progress", "in_review", "completed", "cancelled"] as const
export const MILESTONE_BILLING_STATUSES = ["unbilled", "invoice_draft", "invoiced", "partially_paid", "paid", "credited", "cancelled"] as const
export const MILESTONE_BILLING_TRIGGERS = ["manual", "project_created", "scheduled_date", "milestone_completed", "client_approved"] as const
export const MILESTONE_CURRENCIES = ["EUR", "USD", "GBP", "MXN", "COP"] as const
export const MILESTONE_INTERVALS = ["weekly", "monthly", "quarterly", "semiannual", "annual", "biennial", "custom"] as const

export const milestoneSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  client_description: z.string().trim().max(2000).optional().or(z.literal("")),
  type: z.enum(MILESTONE_TYPES),
  work_status: z.enum(MILESTONE_WORK_STATUSES),
  billing_status: z.enum(MILESTONE_BILLING_STATUSES),
  billing_trigger: z.enum(MILESTONE_BILLING_TRIGGERS).optional().or(z.literal("")),
  amount: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Importe no válido."),
  currency_code: z.string().length(3),
  tax_rate: z.string().trim().optional().or(z.literal("")),
  internal_cost: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Coste no válido."),
  billing_interval: z.enum(MILESTONE_INTERVALS).optional().or(z.literal("")),
  planned_date: z.string().optional().or(z.literal("")),
  planned_invoice_date: z.string().optional().or(z.literal("")),
  billed_at: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  internal_notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

export type MilestoneInput = z.infer<typeof milestoneSchema>
