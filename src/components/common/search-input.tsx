"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type SearchInputProps = {
  placeholder?: string
  paramKey?: string
  className?: string
}

/**
 * Text search bound to the URL (?q=...), debounced, resets pagination.
 * Server Components downstream read `searchParams.q` and query Supabase with
 * it — no client-side data fetching happens here.
 */
function SearchInput({
  placeholder = "Buscar...",
  paramKey = "q",
  className,
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState(searchParams.get(paramKey) ?? "")

  React.useEffect(() => {
    setValue(searchParams.get(paramKey) ?? "")
  }, [searchParams, paramKey])

  const updateQuery = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.set(paramKey, next)
      } else {
        params.delete(paramKey)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, paramKey, router, searchParams]
  )

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== (searchParams.get(paramKey) ?? "")) {
        updateQuery(value)
      }
    }, 350)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className="pl-9"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setValue("")}
        >
          <XIcon />
          <span className="sr-only">Limpiar búsqueda</span>
        </Button>
      ) : null}
    </div>
  )
}

export { SearchInput }
