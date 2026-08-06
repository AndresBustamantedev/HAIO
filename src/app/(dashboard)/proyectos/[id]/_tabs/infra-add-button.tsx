"use client"

import * as React from "react"
import { PlusIcon, GlobeIcon, ServerIcon, MailIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DomainFormDrawer } from "@/features/domains/components/domain-form-drawer"
import { HostingFormDrawer } from "@/features/hosting/components/hosting-form-drawer"
import { EmailServiceFormDrawer } from "@/features/email-services/components/email-service-form-drawer"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

type Props = {
  projectId: string
  projectName: string
  clientId: string
  clientOptions: ClientOption[]
}

export function InfraAddButton({ projectId, projectName, clientId, clientOptions }: Props) {
  const [domainOpen, setDomainOpen] = React.useState(false)
  const [hostingOpen, setHostingOpen] = React.useState(false)
  const [emailOpen, setEmailOpen] = React.useState(false)

  const projectOptions = [{ id: projectId, name: projectName, client_id: clientId }]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
          <PlusIcon className="mr-1.5 size-4" />
          Añadir
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDomainOpen(true)}>
            <GlobeIcon className="mr-2 size-4" />
            Dominio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setHostingOpen(true)}>
            <ServerIcon className="mr-2 size-4" />
            Hosting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailOpen(true)}>
            <MailIcon className="mr-2 size-4" />
            Correo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DomainFormDrawer
        open={domainOpen}
        onOpenChange={setDomainOpen}
        clientOptions={clientOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
        projectOptions={projectOptions}
      />
      <HostingFormDrawer
        open={hostingOpen}
        onOpenChange={setHostingOpen}
        clientOptions={clientOptions}
        projectOptions={projectOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
      />
      <EmailServiceFormDrawer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        clientOptions={clientOptions}
        defaultClientId={clientId}
        defaultProjectId={projectId}
      />
    </>
  )
}
