import { z } from "zod"

export const TASK_STATUSES = ["backlog", "todo", "in_progress", "blocked", "review", "done", "cancelled"] as const
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().trim().optional().or(z.literal("")),
})

export type TaskInput = z.infer<typeof taskSchema>
