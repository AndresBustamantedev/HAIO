"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type PortalHeaderProps = {
  clientName: string
  userEmail?: string
  canViewProjects: boolean
  canViewInvoices: boolean
  canViewDocuments: boolean
  canCreateTickets: boolean
  onSignOut?: () => void
}

function PortalHeader({
  clientName,
  userEmail,
  canViewProjects,
  canViewInvoices,
  canViewDocuments,
  canCreateTickets,
  onSignOut,
}: PortalHeaderProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const initials = clientName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  const navLinks = [
    { href: "/portal", label: "Resumen", always: true },
    { href: "/portal/proyectos", label: "Proyectos", always: canViewProjects },
    { href: "/portal/facturas", label: "Facturas", always: canViewInvoices },
    { href: "/portal/documentos", label: "Documentos", always: canViewDocuments },
    { href: "/portal/soporte", label: "Soporte", always: canCreateTickets },
  ].filter((l) => l.always)

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/portal" className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tracking-tight text-foreground">HAIO</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">Portal</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = link.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

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

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
                <span className="truncate text-sm font-medium text-foreground">{clientName}</span>
                {userEmail ? (
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/portal/perfil" />}>
                <UserIcon />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onSignOut}>
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export { PortalHeader }
