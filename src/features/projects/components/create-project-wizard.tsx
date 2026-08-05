"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  AlertTriangleIcon,
  CheckIcon,
  BanknoteIcon,
  ClockIcon,
  SplitIcon,
  LayoutListIcon,
  HelpCircleIcon,
  Layers3Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/features/projects/schemas/project-schema"
import { createProjectWithPlan } from "@/features/projects/actions/create-project-with-plan"
import type { WizardMilestone, ProjectWizardInput } from "@/features/projects/actions/create-project-with-plan"
import type { ClientOption } from "@/lib/supabase/queries/client-options"

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingPlan = "single" | "half_half" | "thirds" | "hourly" | "custom" | "undefined"

type MilestoneRow = {
  key: string
  name: string
  amount: string
  billing_trigger: WizardMilestone["billing_trigger"]
  planned_date: string
}

type Step1 = {
  client_id: string
  name: string
  type: string
  status: string
  description: string
  start_date: string
  target_date: string
}

type Step2 = {
  budget: string
  currency_code: string
  tax_rate: string
  payment_method: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  website: "Sitio web",
  ecommerce: "E-commerce",
  landing_page: "Landing page",
  maintenance: "Mantenimiento",
  redesign: "Rediseño",
  seo: "SEO",
  consulting: "Consultoría",
  other: "Otro",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  planned: "Planificado",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
  archived: "Archivado",
}

const CURRENCIES = ["EUR", "USD", "GBP", "MXN", "COP"]

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "", label: "Sin definir" },
  { value: "bank_transfer", label: "Transferencia bancaria" },
  { value: "card", label: "Tarjeta" },
  { value: "stripe", label: "Stripe" },
  { value: "bizum", label: "Bizum" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Otro" },
]

const TRIGGER_LABELS: Record<WizardMilestone["billing_trigger"], string> = {
  manual: "Manual",
  project_created: "Al crear proyecto",
  scheduled_date: "En fecha prevista",
  milestone_completed: "Al completar",
  client_approved: "Aprobado por cliente",
}

const BILLING_PLANS: {
  id: BillingPlan
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: "single",     label: "Cobro único",   sublabel: "100% al cerrar",       icon: BanknoteIcon },
  { id: "half_half",  label: "50 / 50",        sublabel: "Anticipo + liquidación", icon: SplitIcon },
  { id: "thirds",     label: "30 / 40 / 30",   sublabel: "Reserva, avance, entrega", icon: Layers3Icon },
  { id: "hourly",     label: "Por horas",      sublabel: "Facturación flexible",  icon: ClockIcon },
  { id: "custom",     label: "Personalizado",  sublabel: "Configura tus hitos",  icon: LayoutListIcon },
  { id: "undefined",  label: "Sin definir",    sublabel: "Añadir plan después",   icon: HelpCircleIcon },
]

// ─── Plan generator ────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function generateMilestones(plan: BillingPlan, budget: number, currency: string): MilestoneRow[] {
  const b = budget > 0 ? budget : 0
  const cur = currency || "EUR"

  switch (plan) {
    case "single":
      return [{ key: uid(), name: "Pago único", amount: String(b), billing_trigger: "manual", planned_date: "" }]

    case "half_half":
      return [
        { key: uid(), name: "Anticipo (50%)",      amount: String(round2(b * 0.5)), billing_trigger: "project_created",    planned_date: "" },
        { key: uid(), name: "Liquidación (50%)",   amount: String(round2(b * 0.5)), billing_trigger: "milestone_completed", planned_date: "" },
      ]

    case "thirds":
      return [
        { key: uid(), name: "Reserva (30%)",       amount: String(round2(b * 0.3)), billing_trigger: "project_created",    planned_date: "" },
        { key: uid(), name: "Avance (40%)",        amount: String(round2(b * 0.4)), billing_trigger: "milestone_completed", planned_date: "" },
        { key: uid(), name: "Entrega final (30%)", amount: String(round2(b * 0.3)), billing_trigger: "milestone_completed", planned_date: "" },
      ]

    case "hourly":
      return [{ key: uid(), name: "Horas trabajadas", amount: String(b), billing_trigger: "manual", planned_date: "" }]

    case "custom":
      return [{ key: uid(), name: "", amount: "", billing_trigger: "manual", planned_date: "" }]

    case "undefined":
    default:
      return []
  }
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Información básica" },
    { n: 2, label: "Valor del proyecto" },
    { n: 3, label: "Plan de facturación" },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s.n < current
                  ? "bg-primary text-primary-foreground"
                  : s.n === current
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.n < current ? <CheckIcon className="size-3.5" /> : s.n}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                s.n === current ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-3 h-px flex-1 min-w-[24px] ${s.n < current ? "bg-primary" : "bg-border"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Field components ──────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputCls =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
const selectCls =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
const textareaCls =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"

// ─── Step 1 ────────────────────────────────────────────────────────────────────

function Step1Form({
  data,
  onChange,
  clientOptions,
}: {
  data: Step1
  onChange: (d: Partial<Step1>) => void
  clientOptions: ClientOption[]
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cliente *">
          <select
            value={data.client_id}
            onChange={e => onChange({ client_id: e.target.value })}
            className={selectCls}
          >
            <option value="">Seleccionar cliente...</option>
            {clientOptions.map(c => (
              <option key={c.id} value={c.id}>{c.display_name}</option>
            ))}
          </select>
        </Field>

        <Field label="Nombre del proyecto *">
          <input
            type="text"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Mi proyecto"
            className={inputCls}
            autoFocus
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <select
            value={data.type}
            onChange={e => onChange({ type: e.target.value })}
            className={selectCls}
          >
            {PROJECT_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
            ))}
          </select>
        </Field>

        <Field label="Estado">
          <select
            value={data.status}
            onChange={e => onChange({ status: e.target.value })}
            className={selectCls}
          >
            {PROJECT_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Descripción">
        <textarea
          value={data.description}
          onChange={e => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Descripción del proyecto..."
          className={textareaCls}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Fecha de inicio">
          <input
            type="date"
            value={data.start_date}
            onChange={e => onChange({ start_date: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Fecha objetivo">
          <input
            type="date"
            value={data.target_date}
            onChange={e => onChange({ target_date: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  )
}

// ─── Step 2 ────────────────────────────────────────────────────────────────────

function Step2Form({ data, onChange }: { data: Step2; onChange: (d: Partial<Step2>) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Presupuesto total">
          <input
            type="number"
            min="0"
            step="0.01"
            value={data.budget}
            onChange={e => onChange({ budget: e.target.value })}
            placeholder="0.00"
            className={inputCls}
          />
        </Field>

        <Field label="Moneda">
          <select
            value={data.currency_code}
            onChange={e => onChange({ currency_code: e.target.value })}
            className={selectCls}
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="IVA / Impuesto por defecto" hint="Porcentaje que se aplicará a los hitos (p.ej. 21)">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={data.tax_rate}
              onChange={e => onChange({ tax_rate: e.target.value })}
              placeholder="21"
              className={`${inputCls} pr-8`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </Field>

        <Field label="Forma de cobro">
          <select
            value={data.payment_method}
            onChange={e => onChange({ payment_method: e.target.value })}
            className={selectCls}
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {data.budget && Number(data.budget) > 0 && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          En el siguiente paso podrás elegir cómo distribuir{" "}
          <strong className="text-foreground font-semibold font-mono">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: data.currency_code || "EUR" }).format(
              Number(data.budget)
            )}
          </strong>{" "}
          en hitos de facturación.
        </div>
      )}
    </div>
  )
}

// ─── Step 3 ────────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: (typeof BILLING_PLANS)[number]
  selected: boolean
  onSelect: () => void
}) {
  const Icon = plan.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
      }`}
    >
      <Icon className={`size-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-foreground" : "text-foreground"}`}>{plan.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{plan.sublabel}</p>
      </div>
    </button>
  )
}

function MilestoneEditor({
  milestones,
  currency,
  onChange,
  allowAdd,
}: {
  milestones: MilestoneRow[]
  currency: string
  onChange: (rows: MilestoneRow[]) => void
  allowAdd: boolean
}) {
  function update(key: string, field: Partial<MilestoneRow>) {
    onChange(milestones.map(m => (m.key === key ? { ...m, ...field } : m)))
  }

  function remove(key: string) {
    onChange(milestones.filter(m => m.key !== key))
  }

  function add() {
    onChange([...milestones, { key: uid(), name: "", amount: "", billing_trigger: "manual", planned_date: "" }])
  }

  if (milestones.length === 0 && !allowAdd) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No se crearán hitos. Podrás añadirlos después desde la pestaña Finanzas.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {milestones.map((m, i) => (
        <div key={m.key} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
          <input
            type="text"
            value={m.name}
            onChange={e => update(m.key, { name: e.target.value })}
            placeholder={`Hito ${i + 1}`}
            className={inputCls}
          />
          <div className="relative w-32">
            <input
              type="number"
              min="0"
              step="0.01"
              value={m.amount}
              onChange={e => update(m.key, { amount: e.target.value })}
              placeholder="0.00"
              className={`${inputCls} pr-10`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {currency}
            </span>
          </div>
          <input
            type="date"
            value={m.planned_date}
            onChange={e => update(m.key, { planned_date: e.target.value })}
            className={`${inputCls} w-36`}
          />
          <select
            value={m.billing_trigger}
            onChange={e => update(m.key, { billing_trigger: e.target.value as WizardMilestone["billing_trigger"] })}
            className={`${selectCls} w-44`}
          >
            {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(m.key)}
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      ))}

      {allowAdd && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mt-1"
        >
          <PlusIcon className="size-3.5" />
          Añadir hito
        </button>
      )}
    </div>
  )
}

function Step3Form({
  plan,
  onPlanChange,
  milestones,
  onMilestonesChange,
  budget,
  currency,
}: {
  plan: BillingPlan
  onPlanChange: (p: BillingPlan) => void
  milestones: MilestoneRow[]
  onMilestonesChange: (rows: MilestoneRow[]) => void
  budget: number
  currency: string
}) {
  const sum = milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0)
  const mismatch = budget > 0 && milestones.length > 0 && Math.abs(sum - budget) > 0.01

  const hasAutoInvoice = milestones.some(m => m.billing_trigger === "project_created")

  return (
    <div className="flex flex-col gap-6">
      {/* Plan selector */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Selecciona un plan de facturación</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BILLING_PLANS.map(p => (
            <PlanCard key={p.id} plan={p} selected={plan === p.id} onSelect={() => onPlanChange(p.id)} />
          ))}
        </div>
      </div>

      {/* Milestones */}
      {plan !== "undefined" && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Hitos de facturación
            {milestones.length > 0 && (
              <span className="ml-1.5 font-normal text-muted-foreground">({milestones.length})</span>
            )}
          </p>

          {milestones.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 mb-1 px-0">
              <p className="text-xs font-medium text-muted-foreground">Nombre</p>
              <p className="text-xs font-medium text-muted-foreground w-32">Importe</p>
              <p className="text-xs font-medium text-muted-foreground w-36">Fecha prevista</p>
              <p className="text-xs font-medium text-muted-foreground w-44">Cuándo facturar</p>
              <div className="w-8" />
            </div>
          )}

          <MilestoneEditor
            milestones={milestones}
            currency={currency}
            onChange={onMilestonesChange}
            allowAdd={plan === "custom"}
          />
        </div>
      )}

      {/* Budget mismatch warning */}
      {mismatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
          <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            La suma de los hitos (
            <span className="font-mono font-semibold">
              {new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "EUR" }).format(sum)}
            </span>
            ) no coincide con el presupuesto (
            <span className="font-mono font-semibold">
              {new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "EUR" }).format(budget)}
            </span>
            ). Puedes continuar igualmente.
          </p>
        </div>
      )}

      {/* Auto-invoice notice */}
      {hasAutoInvoice && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
          <CheckIcon className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Se generará automáticamente una factura en borrador para los hitos marcados como{" "}
            <strong>"Al crear proyecto"</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Wizard ────────────────────────────────────────────────────────────────────

type Props = {
  clientOptions: ClientOption[]
}

export function CreateProjectWizard({ clientOptions }: Props) {
  const router = useRouter()
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = React.useState(false)

  const [s1, setS1] = React.useState<Step1>({
    client_id: "",
    name: "",
    type: "website",
    status: "draft",
    description: "",
    start_date: "",
    target_date: "",
  })

  const [s2, setS2] = React.useState<Step2>({
    budget: "",
    currency_code: "EUR",
    tax_rate: "",
    payment_method: "",
  })

  const [plan, setPlan] = React.useState<BillingPlan>("undefined")
  const [milestones, setMilestones] = React.useState<MilestoneRow[]>([])

  // Regenerate milestones when plan or budget changes
  function handlePlanChange(newPlan: BillingPlan) {
    setPlan(newPlan)
    setMilestones(generateMilestones(newPlan, Number(s2.budget) || 0, s2.currency_code))
  }

  // Step 1 validation
  const step1Valid = s1.name.trim().length > 0 && s1.client_id.length > 0

  // Step 2 validation
  const step2Valid = !s2.budget || !Number.isNaN(Number(s2.budget))

  async function handleSubmit() {
    setSubmitting(true)

    const projectData: ProjectWizardInput = {
      client_id: s1.client_id,
      name: s1.name,
      type: s1.type,
      status: s1.status,
      description: s1.description || undefined,
      start_date: s1.start_date || undefined,
      target_date: s1.target_date || undefined,
      budget: s2.budget ? Number(s2.budget) : undefined,
      currency_code: s2.currency_code,
      tax_rate: s2.tax_rate ? Number(s2.tax_rate) : undefined,
      payment_method: s2.payment_method || undefined,
    }

    const wizardMilestones: WizardMilestone[] = milestones
      .filter(m => m.name.trim())
      .map(m => ({
        name: m.name.trim(),
        amount: Number(m.amount) || 0,
        currency_code: s2.currency_code,
        billing_trigger: m.billing_trigger,
        planned_date: m.planned_date || undefined,
        tax_rate: s2.tax_rate ? Number(s2.tax_rate) : undefined,
      }))

    const result = await createProjectWithPlan(projectData, wizardMilestones)
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.autoInvoiceError) {
      toast.warning("Proyecto creado, pero hubo un error al generar la factura automática: " + result.autoInvoiceError)
    } else {
      toast.success("Proyecto creado correctamente.")
    }

    router.push(`/proyectos/${result.projectId}`)
  }

  function goNext() {
    if (step === 1 && step1Valid) setStep(2)
    else if (step === 2 && step2Valid) setStep(3)
  }

  function goBack() {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const budget = Number(s2.budget) || 0
  const currency = s2.currency_code || "EUR"

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex h-14 items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/proyectos")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Proyectos</span>
            </button>
            <div className="h-4 w-px bg-border" />
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Step heading */}
        <div className="mb-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">Información básica</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Los datos generales del proyecto y el cliente al que pertenece.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">Valor del proyecto</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Presupuesto, moneda e impuestos por defecto.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-semibold text-foreground">Plan de facturación</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Elige cómo distribuir los cobros y genera los hitos del proyecto.
              </p>
            </>
          )}
        </div>

        {/* Step form */}
        <div className="rounded-xl border bg-card px-6 py-6">
          {step === 1 && <Step1Form data={s1} onChange={d => setS1(p => ({ ...p, ...d }))} clientOptions={clientOptions} />}
          {step === 2 && <Step2Form data={s2} onChange={d => setS2(p => ({ ...p, ...d }))} />}
          {step === 3 && (
            <Step3Form
              plan={plan}
              onPlanChange={handlePlanChange}
              milestones={milestones}
              onMilestonesChange={setMilestones}
              budget={budget}
              currency={currency}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={goBack} disabled={submitting}>
                <ArrowLeftIcon className="size-4" />
                Atrás
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/proyectos")} disabled={submitting}>
              Cancelar
            </Button>
            {step < 3 ? (
              <Button onClick={goNext} disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creando proyecto..." : "Crear proyecto"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
