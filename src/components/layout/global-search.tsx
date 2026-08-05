"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FolderIcon, Loader2Icon, ReceiptIcon, SearchIcon, UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type SearchResults = {
  clients: Array<{ id: string; display_name: string; email: string | null }>
  projects: Array<{ id: string; name: string; client_name: string | null }>
  invoices: Array<{ id: string; invoice_number: string; total: number; currency_code: string; client_name: string | null }>
}

function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResults | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Debounced fetch
  React.useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      setLoading(false)
      setOpen(false)
      return
    }
    setLoading(true)
    setOpen(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close on outside click
  React.useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  // Close on Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    setQuery("")
    setResults(null)
    router.push(href)
  }

  const hasResults = results &&
    (results.clients.length > 0 || results.projects.length > 0 || results.invoices.length > 0)

  const showDropdown = open && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative ml-2 hidden max-w-sm flex-1 md:block">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      {loading && (
        <Loader2Icon className="pointer-events-none absolute top-1/2 right-3 z-10 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        type="search"
        placeholder="Buscar clientes, proyectos, facturas..."
        className="pl-9"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results && query.trim().length >= 2) setOpen(true) }}
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border bg-popover shadow-xl">
          {/* Loading with no results yet */}
          {loading && !results && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Buscando...
            </div>
          )}

          {/* No results */}
          {!loading && results && !hasResults && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados para{" "}
              <span className="font-medium text-foreground">"{query}"</span>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="max-h-96 overflow-y-auto py-1">

              {results.clients.length > 0 && (
                <section>
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                    Clientes
                  </p>
                  {results.clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      onClick={() => navigate(`/clientes/${c.id}`)}
                    >
                      <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {c.display_name}
                        </p>
                        {c.email && (
                          <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {results.projects.length > 0 && (
                <section className={cn(results.clients.length > 0 && "border-t")}>
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                    Proyectos
                  </p>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      onClick={() => navigate(`/proyectos/${p.id}`)}
                    >
                      <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        {p.client_name && (
                          <p className="truncate text-xs text-muted-foreground">{p.client_name}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {results.invoices.length > 0 && (
                <section
                  className={cn(
                    (results.clients.length > 0 || results.projects.length > 0) && "border-t",
                  )}
                >
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                    Facturas
                  </p>
                  {results.invoices.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                      onClick={() => navigate(`/facturas/${i.id}`)}
                    >
                      <ReceiptIcon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {i.invoice_number}
                        </p>
                        {i.client_name && (
                          <p className="truncate text-xs text-muted-foreground">{i.client_name}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: i.currency_code ?? "EUR",
                        }).format(i.total ?? 0)}
                      </span>
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { GlobalSearch }
