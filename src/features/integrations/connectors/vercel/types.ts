export type VercelProject = {
  id: string
  name: string
  framework: string | null
  createdAt: number    // Unix ms
  updatedAt: number
  link?: { type: string; repo?: string }
}

export type VercelDeployment = {
  uid: string
  name: string
  url: string
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED' | 'DELETED'
  createdAt: number
  target: 'production' | 'staging' | null
  meta?: Record<string, string>
}
