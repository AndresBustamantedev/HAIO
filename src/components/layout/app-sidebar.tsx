"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOutIcon, PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { DASHBOARD_ITEM, NAV_SECTIONS } from "@/lib/navigation"
import type { NavItem } from "@/lib/navigation"
import { signOut } from "@/features/auth/actions/sign-out"
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

function NavLink({
  item,
  collapsed,
  pathname,
  onClick,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  onClick?: () => void
}) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip key={item.href}>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
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
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            {!collapsed && <span className="truncate text-base font-semibold">HAIO</span>}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto p-2">
          {/* Dashboard */}
          <NavLink item={DASHBOARD_ITEM} collapsed={collapsed} pathname={pathname} />

          {/* Sections */}
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mt-2">
              {/* Section divider + label */}
              {collapsed ? (
                <div className="my-1 mx-1 h-px bg-sidebar-border/60" />
              ) : (
                <div className="px-2 pt-1 pb-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
                    {section.label}
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="flex flex-col gap-0.5 mt-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
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
          <div className={cn("flex gap-1 p-2 pt-0", collapsed && "flex-col")}>
            <form action={signOut} className="flex-1">
              <Button
                type="submit"
                variant="ghost"
                size="icon-sm"
                className="w-full justify-center text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
                aria-label="Cerrar sesión"
              >
                <LogOutIcon />
                {!collapsed && <span className="ml-1 text-xs">Salir</span>}
              </Button>
            </form>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              onClick={() => setCollapsed((v) => !v)}
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
