import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TablePaginationProps = {
  page: number
  pageSize: number
  total: number
  /** Current path (e.g. "/clientes"), used to build prev/next links. */
  basePath: string
  /** Current URL search params, so filters/search survive page changes. */
  searchParams: Record<string, string | undefined>
}

/**
 * Server-rendered prev/next pagination driven entirely by ?page= in the URL
 * — no client state, works with JS disabled.
 */
function TablePagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function hrefForPage(target: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    )
    params.set("page", String(target))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-1 py-3 text-sm text-muted-foreground sm:flex-row">
      <p>
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefForPage(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page <= 1 && "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeftIcon />
          Anterior
        </Link>
        <span className="px-1 tabular-nums">
          Página {page} de {pageCount}
        </span>
        <Link
          href={hrefForPage(Math.min(pageCount, page + 1))}
          aria-disabled={page >= pageCount}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            page >= pageCount && "pointer-events-none opacity-50"
          )}
        >
          Siguiente
          <ChevronRightIcon />
        </Link>
      </div>
    </div>
  )
}

export { TablePagination }
