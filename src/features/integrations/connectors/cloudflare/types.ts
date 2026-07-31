export type CloudflareZoneStatus = 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated'

export type CloudflareZone = {
  id: string
  name: string
  status: CloudflareZoneStatus
  paused: boolean
  type: 'full' | 'partial' | 'secondary'
  name_servers: string[]
  original_name_servers: string[] | null
  created_on: string
  modified_on: string
  account: { id: string; name: string }
  plan?: { name: string }
}

export type CloudflareTokenVerify = {
  id: string
  status: 'active' | 'disabled' | 'expired'
}

export type CloudflareResultInfo = {
  page: number
  per_page: number
  total_pages: number
  count: number
  total_count: number
}

export type CloudflareResponse<T> = {
  result: T
  result_info?: CloudflareResultInfo
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: string[]
}
