import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ErrorState } from "@/components/common/error-state"
import { cn } from "@/lib/utils"

type DataTableColumn<T> = {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Extra trailing column, typically a row-level dropdown (edit/delete). */
  rowActions?: (row: T) => React.ReactNode
  isLoading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  className?: string
}

/**
 * Generic, server-renderable table. Search/sort/filter/pagination are driven
 * by the URL and resolved before the rows reach this component — it only
 * renders what it's given, plus the mandatory loading/empty/error states.
 */
function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowActions,
  isLoading,
  error,
  emptyTitle = "Sin resultados",
  emptyDescription = "No se ha encontrado nada con estos filtros.",
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState variant="table" />
  }

  if (error) {
    return <ErrorState description={error} />
  }

  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    )
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.headerClassName}>
                {column.header}
              </TableHead>
            ))}
            {rowActions ? <TableHead className="w-10" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.cellClassName}>
                  {column.cell(row)}
                </TableCell>
              ))}
              {rowActions ? (
                <TableCell className="text-right">{rowActions(row)}</TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
export type { DataTableColumn }
