import { z } from 'zod'

export const googleWorkspaceUserSchema = z.object({
  id: z.string(),
  primaryEmail: z.string(),
  name: z.object({
    fullName: z.string().optional().default(''),
    givenName: z.string().optional(),
    familyName: z.string().optional(),
  }),
  suspended: z.boolean().optional().default(false),
  archived: z.boolean().optional().default(false),
  creationTime: z.string().optional().default(''),
  lastLoginTime: z.string().nullable().optional(),
  orgUnitPath: z.string().optional().default('/'),
  isAdmin: z.boolean().optional().default(false),
  isDelegatedAdmin: z.boolean().optional().default(false),
})

export const googleWorkspaceUsersResponseSchema = z.object({
  users: z.array(googleWorkspaceUserSchema).optional().default([]),
  nextPageToken: z.string().optional(),
})

export type GoogleWorkspaceUserRaw = z.infer<typeof googleWorkspaceUserSchema>
