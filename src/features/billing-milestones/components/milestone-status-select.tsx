"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  updateMilestoneWorkStatus,
  updateMilestoneBillingStatus,
} from "@/features/billing-milestones/actions/update-milestone-status"

const WORK_STATUS_STYLE: Record<string, string> = {
  draft:       "bg-muted text-muted-foreground",
  planned:     "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  in_review:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  completed:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const WORK_STATUS_LABEL: Record<string, string> = {
  draft:       "Borrador",
  planned:     "Planificado",
  in_progress: "En progreso",
  in_review:   "En revisión",
  completed:   "Completado",
  cancelled:   "Cancelado",
}

const WORK_STATUSES = [
  "draft", "planned", "in_progress", "in_review", "completed", "cancelled",
] as const

const BILLING_STATUS_STYLE: Record<string, string> = {
  unbilled:       "bg-muted text-muted-foreground",
  invoice_draft:  "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  invoiced:       "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  partially_paid: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  paid:           "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  credited:       "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  cancelled:      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const BILLING_STATUS_LABEL: Record<string, string> = {
  unbilled:       "Sin facturar",
  invoice_draft:  "Borrador",
  invoiced:       "Facturado",
  partially_paid: "Parcial",
  paid:           "Cobrado",
  credited:       "Abonado",
  cancelled:      "Cancelado",
}

const BILLING_STATUSES = [
  "unbilled", "invoice_draft", "invoiced", "partially_paid", "paid", "credited", "cancelled",
] as const

type WorkStatusSelectProps = {
  milestoneId: string
  projectId: string
  value: string
}

export function WorkStatusSelect({ milestoneId, projectId, value }: WorkStatusSelectProps) {
  const router = useRouter()
  const [current, setCurrent] = React.useState(value)
  const [pending, setPending] = React.useState(false)

  async function handleSelect(newStatus: string) {
    if (newStatus === current || pending) return
    const prev = current
    setCurrent(newStatus)
    setPending(true)
    const result = await updateMilestoneWorkStatus(milestoneId, projectId, newStatus)
    setPending(false)
    if (result.error) {
      setCurrent(prev)
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity cursor-pointer",
              WORK_STATUS_STYLE[current] ?? "bg-muted text-muted-foreground",
              pending ? "opacity-50 cursor-wait" : "hover:opacity-75",
            ].join(" ")}
          />
        }
      >
        {WORK_STATUS_LABEL[current] ?? current}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {WORK_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleSelect(s)}
            className="flex items-center gap-2"
          >
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${WORK_STATUS_STYLE[s]}`}>
              {WORK_STATUS_LABEL[s]}
            </span>
            {current === s && <CheckIcon className="ml-auto size-3 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type BillingStatusSelectProps = {
  milestoneId: string
  projectId: string
  value: string
}

export function BillingStatusSelect({ milestoneId, projectId, value }: BillingStatusSelectProps) {
  const router = useRouter()
  const [current, setCurrent] = React.useState(value)
  const [pending, setPending] = React.useState(false)

  async function handleSelect(newStatus: string) {
    if (newStatus === current || pending) return
    const prev = current
    setCurrent(newStatus)
    setPending(true)
    const result = await updateMilestoneBillingStatus(milestoneId, projectId, newStatus)
    setPending(false)
    if (result.error) {
      setCurrent(prev)
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={pending}
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity cursor-pointer",
              BILLING_STATUS_STYLE[current] ?? "bg-muted text-muted-foreground",
              pending ? "opacity-50 cursor-wait" : "hover:opacity-75",
            ].join(" ")}
          />
        }
      >
        {BILLING_STATUS_LABEL[current] ?? current}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {BILLING_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleSelect(s)}
            className="flex items-center gap-2"
          >
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BILLING_STATUS_STYLE[s]}`}>
              {BILLING_STATUS_LABEL[s]}
            </span>
            {current === s && <CheckIcon className="ml-auto size-3 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
