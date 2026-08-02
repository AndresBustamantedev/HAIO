"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

const TABS = [
  { id: "resumen",         label: "Resumen" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "vault",           label: "Vault" },
  { id: "wordpress",       label: "WordPress" },
  { id: "costes",          label: "Costes" },
  { id: "wiki",            label: "Wiki" },
  { id: "diario",          label: "Diario" },
  { id: "backups",         label: "Backups" },
  { id: "accesos",         label: "Accesos" },
] as const

export function TabNav({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "resumen"

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <Link
            key={tab.id}
            href={`/proyectos/${projectId}?tab=${tab.id}`}
            className={[
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
