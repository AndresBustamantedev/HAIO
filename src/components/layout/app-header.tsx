"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BellIcon,
  LogOutIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react"

import { NAV_ITEMS } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

type AppHeaderProps = {
  userEmail?: string | null
  organizationName?: string | null
  unreadNotifications?: number
  onSignOut?: () => void
}

function currentModuleLabel(pathname: string) {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  return match?.label ?? "HAIO"
}

/** Top bar: mobile menu, breadcrumb, global search, notifications, theme, user menu. */
function AppHeader({
  userEmail,
  organizationName,
  unreadNotifications = 0,
  onSignOut,
}: AppHeaderProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const moduleLabel = currentModuleLabel(pathname)
  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "?"

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
      <MobileSidebar />

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">{moduleLabel}</span>
        {organizationName ? (
          <span className="truncate text-xs text-muted-foreground">{organizationName}</span>
        ) : null}
      </div>

      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar clientes, proyectos, facturas..."
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar tema"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="block dark:hidden" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones" render={<Link href="/notificaciones" />}>
          <BellIcon />
          {unreadNotifications > 0 ? (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </Badge>
          ) : null}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-foreground">
                {userEmail ?? "Sin sesión"}
              </p>
              {organizationName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {organizationName}
                </p>
              ) : null}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/configuracion" />}>
                <UserIcon />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/configuracion" />}>
                <SettingsIcon />
                Configuración
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={onSignOut}>
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { AppHeader }
