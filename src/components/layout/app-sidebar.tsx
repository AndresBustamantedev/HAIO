"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

type AppSidebarProps = {
  organizationName?: string | null
  userEmail?: string | null
}

function AppSidebar({ organizationName, userEmail }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <TooltipProvider delay={200}>
      <aside
        data-slot="app-sidebar"
        className={cn(
          "hidden shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            {!collapsed ? (
              <span className="truncate text-base font-semibold">HAIO</span>
            ) : null}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon

            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )

            if (!collapsed) {
              return link
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border">
          {(organizationName || userEmail) && (
            <div className={cn(
              "flex items-center gap-2.5 px-3 py-3",
              collapsed && "justify-center"
            )}>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold">
                {(organizationName ?? userEmail ?? "?")[0].toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-sidebar-accent-foreground leading-tight">
                    {organizationName ?? "Mi organización"}
                  </p>
                  {userEmail && (
                    <p className="truncate text-xs text-sidebar-foreground/50 leading-tight">
                      {userEmail}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="p-2 pt-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {collapsed ? <PanelLeftIcon /> : <PanelLeftCloseIcon />}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export { AppSidebar }
