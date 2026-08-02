import { createClient } from "@/lib/supabase/server"
import { EmptyState } from "@/components/common/empty-state"
import { CostAddExpense } from "./cost-add-expense"
import { CostExpenseActions } from "./cost-expense-actions"

type Props = { projectId: string; clientId: string; budget: number | null; currencyCode: string | null }

type Expense = {
  id: string
  description: string
  amount: number
  currency_code: string
  category: string
  incurred_at: string
  notes: string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Hosting", domain: "Dominio", license: "Licencia",
  tool: "Herramienta", design: "Diseño", development: "Desarrollo", other: "Otro",
}

function formatCurrency(v: number | null, cur: string | null) {
  if (v == null) return "—"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur ?? "EUR" }).format(v)
}

function formatDate(v: string | null) {
  if (!v) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v))
}

export async function TabCostes({ projectId, clientId, budget, currencyCode }: Props) {
  const cur = currencyCode ?? "EUR"
  const supabase = await createClient()

  const [servicesRes, hostingRes, domainsRes, expensesRes] = await Promise.all([
    supabase
      .from("client_services")
      .select("id, name_override, quantity, unit_price, currency_code, billing_interval, status, services(name, category)")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("hosting_accounts")
      .select("id, provider_name, plan_name, internal_cost, currency_code, billing_interval, status, expires_on")
      .or(`project_id.eq.${projectId},client_id.eq.${clientId}`)
      .not("internal_cost", "is", null)
      .is("deleted_at", null),
    supabase
      .from("domains")
      .select("id, domain_name, internal_cost, currency_code, expires_on")
      .or(`project_id.eq.${projectId},client_id.eq.${clientId}`)
      .not("internal_cost", "is", null)
      .is("deleted_at", null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("project_expenses")
      .select("id, description, amount, currency_code, category, incurred_at, notes")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("incurred_at", { ascending: false }),
  ])

  const services = servicesRes.data ?? []
  const hosting = hostingRes.data ?? []
  const domains = domainsRes.data ?? []
  const expenses = (expensesRes.data ?? []) as Expense[]

  const servicesTotal = services.reduce((acc, s) => acc + (s.unit_price * s.quantity), 0)
  const internalTotal = [
    ...hosting.map((h) => h.internal_cost ?? 0),
    ...domains.map((d) => d.internal_cost ?? 0),
    ...expenses.map((e) => e.amount),
  ].reduce((a, b) => a + b, 0)

  const margin = budget != null ? budget - internalTotal : null

  return (
    <div className="flex flex-col gap-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Presupuesto" value={formatCurrency(budget, cur)} />
        <Stat label="Servicios facturados" value={formatCurrency(servicesTotal, cur)} />
        <Stat label="Costes internos" value={formatCurrency(internalTotal, cur)} />
        <Stat
          label="Margen estimado"
          value={formatCurrency(margin, cur)}
          highlight={margin != null && margin >= 0 ? "positive" : margin != null ? "negative" : undefined}
        />
      </div>

      {/* Servicios */}
      <Section title={`Servicios contratados (${services.length})`}>
        {services.length === 0 ? (
          <EmptyState title="Sin servicios" description="Añade servicios desde la ficha del cliente." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Servicio</th>
                  <th className="pb-2 text-left font-medium">Ciclo</th>
                  <th className="pb-2 text-right font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-foreground">
                      {(s.services as { name?: string } | null)?.name ?? s.name_override ?? "—"}
                    </td>
                    <td className="py-2.5 text-muted-foreground capitalize">{s.billing_interval ?? "—"}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(s.unit_price * s.quantity, s.currency_code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Hosting */}
      {hosting.length > 0 ? (
        <Section title="Hosting (coste interno)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Proveedor</th>
                  <th className="pb-2 text-left font-medium">Plan</th>
                  <th className="pb-2 text-left font-medium">Vence</th>
                  <th className="pb-2 text-right font-medium">Coste</th>
                </tr>
              </thead>
              <tbody>
                {hosting.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{h.provider_name}</td>
                    <td className="py-2.5 text-muted-foreground">{h.plan_name ?? "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(h.expires_on)}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(h.internal_cost, h.currency_code ?? cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* Dominios */}
      {domains.length > 0 ? (
        <Section title="Dominios (coste interno)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Dominio</th>
                  <th className="pb-2 text-left font-medium">Vence</th>
                  <th className="pb-2 text-right font-medium">Coste</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{d.domain_name}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(d.expires_on)}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(d.internal_cost, d.currency_code ?? cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* Gastos adicionales */}
      <Section
        title={`Gastos adicionales (${expenses.length})`}
        action={<CostAddExpense projectId={projectId} />}
      >
        {expenses.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Sin gastos adicionales. Úsalos para costes de último momento que no encajan en las categorías anteriores.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Descripción</th>
                  <th className="pb-2 text-left font-medium">Categoría</th>
                  <th className="pb-2 text-left font-medium">Fecha</th>
                  <th className="pb-2 text-right font-medium">Importe</th>
                  <th className="pb-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 group">
                    <td className="py-2.5 font-medium text-foreground">
                      {e.description}
                      {e.notes ? (
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">— {e.notes}</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-muted-foreground">{CATEGORY_LABEL[e.category] ?? e.category}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(e.incurred_at)}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(e.amount, e.currency_code)}</td>
                    <td className="py-2.5 text-right">
                      <CostExpenseActions expenseId={e.id} projectId={projectId} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-xs text-muted-foreground">Total gastos adicionales</td>
                  <td className="pt-3 text-right font-mono font-semibold text-foreground">
                    {formatCurrency(expenses.reduce((a, e) => a + e.amount, 0), cur)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: "positive" | "negative" }) {
  const colorClass =
    highlight === "positive" ? "text-green-600 dark:text-green-400"
    : highlight === "negative" ? "text-red-600 dark:text-red-400"
    : "text-foreground"
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-semibold ${colorClass}`}>{value}</p>
    </div>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}
