"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { DASHBOARD_ITEM, NAV_SECTIONS } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Drawer navigation for small screens, opened from AppHeader's menu button. */
function MobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú" />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>HAIO</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 pb-4">
          {/* Dashboard */}
          {(() => {
            const active = isActive(pathname, DASHBOARD_ITEM.href)
            const Icon = DASHBOARD_ITEM.icon
            return (
              <Link
                href={DASHBOARD_ITEM.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span className="truncate">{DASHBOARD_ITEM.label}</span>
              </Link>
            )
          })()}

          {/* Sections */}
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mt-3">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/35 select-none">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
                        active && "bg-muted text-foreground"
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export { MobileSidebar }
