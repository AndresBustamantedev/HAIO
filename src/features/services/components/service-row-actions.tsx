"use client"

import * as React from "react"
import { MoreHorizontalIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ServiceFormDrawer } from "@/features/services/components/service-form-drawer"
import type { Service } from "@/features/services/types"

function ServiceRowActions({ service }: { service: Service }) {
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ServiceFormDrawer open={editOpen} onOpenChange={setEditOpen} service={service} />
    </>
  )
}

export { ServiceRowActions }
