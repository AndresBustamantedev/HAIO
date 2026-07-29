import Link from "next/link"
import { FolderPlusIcon, ReceiptTextIcon, UserPlusIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ACTIONS = [
  { label: "Nuevo cliente", href: "/clientes?new=1", icon: UserPlusIcon },
  { label: "Nuevo proyecto", href: "/proyectos?new=1", icon: FolderPlusIcon },
  { label: "Ver facturas", href: "/facturas", icon: ReceiptTextIcon },
]

function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <action.icon />
          {action.label}
        </Link>
      ))}
    </div>
  )
}

export { QuickActions }
