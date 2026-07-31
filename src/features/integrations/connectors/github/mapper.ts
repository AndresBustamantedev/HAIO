import { createHash } from 'crypto'
import type { NormalizedRepository } from '../types'
import type { GitHubRepoRaw } from './schemas'

export function mapGitHubRepo(raw: GitHubRepoRaw): NormalizedRepository {
  const status = raw.archived ? 'archived' : raw.disabled ? 'disabled' : 'active'

  const hashPayload = {
    status,
    defaultBranch: raw.default_branch,
    language: raw.language ?? null,
    private: raw.private,
  }
  const externalPayloadHash = createHash('sha256')
    .update(JSON.stringify(hashPayload))
    .digest('hex')

  return {
    resourceType: 'repository',
    externalId: String(raw.id),
    externalName: raw.full_name,
    externalStatus: status,
    externalPayloadHash,
    rawMetadata: {
      repoId: raw.id,
      name: raw.name,
      fullName: raw.full_name,
      private: raw.private,
      htmlUrl: raw.html_url,
      description: raw.description ?? null,
      fork: raw.fork,
      language: raw.language ?? null,
      stars: raw.stargazers_count,
      sizeKb: raw.size,
      defaultBranch: raw.default_branch,
      archived: raw.archived,
      disabled: raw.disabled,
      visibility: raw.visibility,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      pushedAt: raw.pushed_at ?? null,
    },
  } satisfies NormalizedRepository
}

export function mapGitHubRepos(raws: ReadonlyArray<GitHubRepoRaw>): NormalizedRepository[] {
  return raws.map(mapGitHubRepo)
}
