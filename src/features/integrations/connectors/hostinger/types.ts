export type HostingerVMState = 'running' | 'stopped' | 'starting' | 'stopping' | 'error'

export type HostingerVirtualMachine = {
  id: number
  hostname: string
  state: HostingerVMState
  cpus: number
  memory: number    // MB
  disk: number      // GB
  created_at: string
  ipv4: string | null
  template?: { name: string; description: string }
  plan?: { name: string }
}
