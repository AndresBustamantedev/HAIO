"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOutIcon, MenuIcon, MoonIcon, SunIcon, UserIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
  canViewEmails: boolean
  onSignOut?: () => void
}

function PortalHeader({
  clientName,
  userEmail,
  canViewProjects,
  canViewInvoices,
  canViewDocuments,
  canCreateTickets,
  canViewEmails,
  onSignOut,
}: PortalHeaderProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const initials = clientName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const navLinks = [
    { href: "/portal",           label: "Resumen",    always: true },
    { href: "/portal/proyectos", label: "Proyectos",  always: canViewProjects },
    { href: "/portal/facturas",  label: "Facturas",   always: canViewInvoices },
    { href: "/portal/documentos",label: "Documentos", always: canViewDocuments },
    { href: "/portal/correos",   label: "Correos",    always: canViewEmails },
    { href: "/portal/soporte",   label: "Soporte",    always: canCreateTickets },
  ].filter((l) => l.always)

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href)
  }

  // Close mobile menu on route change
  React.useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close on Escape
  React.useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">

          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </Button>

          {/* Brand */}
          <Link href="/portal" className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold tracking-tight text-foreground">HAIO</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">Portal</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
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
              <DropdownMenuTrigger className="rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-7">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium text-foreground">{clientName}</p>
                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  ) : null}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/portal/perfil" />}>
                    <UserIcon />
                    Mi perfil
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
        </div>
      </header>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <nav
            className="fixed left-0 right-0 top-16 z-40 border-b bg-background shadow-lg sm:hidden"
            aria-label="Menú de navegación"
          >
            <ul className="mx-auto flex max-w-5xl flex-col px-4 py-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  )
}

export { PortalHeader }
