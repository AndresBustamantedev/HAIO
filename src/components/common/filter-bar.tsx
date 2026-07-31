"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { SearchInput } from "@/components/common/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FilterOption = {
  label: string
  value: string
}

type FilterConfig = {
  key: string
  label: string
  placeholder?: string
  options: FilterOption[]
}

type FilterBarProps = {
  searchPlaceholder?: string
  searchParamKey?: string
  /** Set to false when the page has no search query wired up server-side. */
  showSearch?: boolean
  filters?: FilterConfig[]
  className?: string
}

/**
 * SearchInput + one <Select> per filter definition, all bound to the URL
 * search params (?status=active&client=...). Every list page defines its own
 * `filters` array and reads the resolved values server-side.
 */
function FilterBar({
  searchPlaceholder,
  searchParamKey,
  showSearch = true,
  filters = [],
  className,
}: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {showSearch ? <SearchInput placeholder={searchPlaceholder} paramKey={searchParamKey} /> : null}
      {filters.map((filter) => {
        const currentValue = searchParams.get(filter.key) ?? "all"
        // Base UI SelectValue no puede resolver labels de valores programáticos
        // porque el popup (portal) es lazy y los items no están registrados al abrir.
        // Calculamos el label aquí y lo pasamos como children para forzar el override.
        const displayLabel =
          currentValue !== "all"
            ? (filter.options.find((o) => o.value === currentValue)?.label ?? currentValue)
            : (filter.placeholder ?? filter.label)

        return (
          <Select
            key={filter.key}
            value={currentValue}
            onValueChange={(value) => setFilter(filter.key, String(value))}
          >
            <SelectTrigger>
              <SelectValue>{displayLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}: todos</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}
    </div>
  )
}

export { FilterBar }
export type { FilterConfig, FilterOption }
