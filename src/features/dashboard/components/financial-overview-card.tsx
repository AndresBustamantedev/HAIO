"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthlyRevenue } from "@/features/dashboard/queries/get-dashboard-data"

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value)
}

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return ""
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const dx = curr[0] - prev[0]
    const cp1x = prev[0] + dx / 3
    const cp2x = curr[0] - dx / 3
    d += ` C ${cp1x.toFixed(2)} ${prev[1].toFixed(2)} ${cp2x.toFixed(2)} ${curr[1].toFixed(2)} ${curr[0].toFixed(2)} ${curr[1].toFixed(2)}`
  }
  return d
}

function FinancialOverviewCard({ series }: { series: MonthlyRevenue[] }) {
  const W = 560
  const H = 180
  const PAD_T = 12
  const PAD_B = 30
  const PAD_L = 42
  const PAD_R = 12
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  const revenues = series.map((d) => d.revenue)
  const maxVal = Math.max(...revenues, 1)

  const totalRevenue = revenues.reduce((a, b) => a + b, 0)

  function pt(i: number, val: number): [number, number] {
    const x = PAD_L + (i / 11) * chartW
    const y = PAD_T + chartH - (val / maxVal) * chartH
    return [x, y]
  }

  const points: [number, number][] = revenues.map((v, i) => pt(i, v))
  const linePath = smoothPath(points)
  const baseY = PAD_T + chartH
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${baseY} L ${PAD_L.toFixed(2)} ${baseY} Z`
    : ""

  // Y axis grid: 4 lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD_T + chartH - pct * chartH,
    label: formatCurrency(pct * maxVal),
  }))

  const [hovered, setHovered] = React.useState<number | null>(null)
  const HOVER_RADIUS = 28

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Resumen financiero</CardTitle>
        <span className="text-xs text-muted-foreground">Este año</span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* SVG chart */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: H }}
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLines.map(({ y, label }, i) => (
              <g key={i}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                {i > 0 ? (
                  <text
                    x={PAD_L - 4}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="9"
                    fill="currentColor"
                    opacity="0.4"
                  >
                    {label}
                  </text>
                ) : null}
              </g>
            ))}

            {/* Area fill */}
            {areaPath ? (
              <path d={areaPath} fill="url(#revenueGrad)" />
            ) : null}

            {/* Line */}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Hover zones + dots */}
            {points.map(([x, y], i) => (
              <g key={i}>
                <rect
                  x={x - HOVER_RADIUS / 2}
                  y={PAD_T}
                  width={HOVER_RADIUS}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                />
                {hovered === i ? (
                  <>
                    <line
                      x1={x}
                      y1={PAD_T}
                      x2={x}
                      y2={PAD_T + chartH}
                      stroke="currentColor"
                      strokeOpacity="0.15"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                    />
                    <circle cx={x} cy={y} r="4" fill="hsl(var(--success))" />
                    <rect
                      x={Math.min(x - 36, W - PAD_R - 80)}
                      y={y - 26}
                      width="80"
                      height="20"
                      rx="4"
                      fill="hsl(var(--popover))"
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />
                    <text
                      x={Math.min(x - 36, W - PAD_R - 80) + 40}
                      y={y - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                    >
                      {formatCurrency(revenues[i])}
                    </text>
                  </>
                ) : (
                  revenues[i] > 0 ? (
                    <circle cx={x} cy={y} r="2.5" fill="hsl(var(--success))" opacity="0.7" />
                  ) : null
                )}
              </g>
            ))}

            {/* X axis labels */}
            {MONTHS.map((m, i) => {
              const x = PAD_L + (i / 11) * chartW
              return (
                <text
                  key={m}
                  x={x}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.5"
                >
                  {m}
                </text>
              )
            })}
          </svg>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-6 border-t pt-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-500" />
            Ingresos cobrados
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { FinancialOverviewCard }
