import { z } from 'zod'

export const githubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  private: z.boolean(),
  html_url: z.string(),
  description: z.string().nullable(),
  fork: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  stargazers_count: z.number().optional().default(0),
  size: z.number().optional().default(0),
  default_branch: z.string().optional().default('main'),
  archived: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
  visibility: z.string().optional().default('public'),
})

export const githubRepoListSchema = z.array(githubRepoSchema)

export type GitHubRepoRaw = z.infer<typeof githubRepoSchema>
