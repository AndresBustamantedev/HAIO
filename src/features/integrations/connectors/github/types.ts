export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string | null
  language: string | null
  stargazers_count: number
  size: number
  default_branch: string
  archived: boolean
  disabled: boolean
  visibility: string
}
