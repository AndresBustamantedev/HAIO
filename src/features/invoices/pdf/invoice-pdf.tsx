import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvoicePDFData = {
  org: {
    name: string
    legal_name: string | null
    tax_id: string | null
    email: string | null
    phone: string | null
    address_line_1: string | null
    city: string | null
    postal_code: string | null
  }
  invoice: {
    number: string
    status: string
    issue_date: string | null
    due_date: string | null
    currency: string
    subtotal: number
    tax_amount: number
    discount_amount: number
    total: number
    amount_paid: number
    amount_due: number
    notes: string | null
  }
  client: {
    name: string
    legal_name: string | null
    tax_id: string | null
    email: string | null
    phone: string | null
    city: string | null
  }
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    tax_rate: number
    discount_percent: number
    line_total: number | null
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(amount)
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  )
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  sent: "Enviada",
  viewed: "Vista",
  partially_paid: "Pago parcial",
  paid: "Pagada",
  overdue: "Vencida",
  void: "Anulada",
  refunded: "Reembolsada",
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
  },

  // Header row
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  companyName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 4 },
  companyDetail: { color: "#475569", marginBottom: 2 },
  invoiceLabel: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#94a3b8", textAlign: "right" },
  invoiceNumber: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f172a", textAlign: "right", marginTop: 4 },
  invoiceMeta: { color: "#475569", textAlign: "right", marginTop: 3 },

  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 18 },

  // Client section
  sectionLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#94a3b8", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 3 },
  clientEmail: { color: "#475569" },

  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colDesc: { flex: 1 },
  colQty: { width: 40, textAlign: "right" },
  colPrice: { width: 64, textAlign: "right" },
  colTax: { width: 40, textAlign: "right" },
  colTotal: { width: 70, textAlign: "right" },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b" },
  tdText: { color: "#1e293b" },
  tdMuted: { color: "#64748b" },

  // Totals
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", marginBottom: 5, width: 220, justifyContent: "space-between" },
  totalLabel: { color: "#64748b" },
  totalValue: { fontFamily: "Helvetica-Bold", color: "#0f172a" },
  grandTotalRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    marginTop: 2,
    marginBottom: 8,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },

  // Status badge
  paidBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-end",
  },
  paidText: { fontFamily: "Helvetica-Bold", color: "#15803d", fontSize: 10 },
  pendingBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-end",
  },
  pendingText: { fontFamily: "Helvetica-Bold", color: "#b45309", fontSize: 10 },

  // Notes
  notesBlock: { marginTop: 20, backgroundColor: "#f8fafc", borderRadius: 6, padding: 10 },
  notesLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#94a3b8", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  notesText: { color: "#475569", lineHeight: 1.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#94a3b8" },
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicePDF({ org, invoice, client, items }: InvoicePDFData) {
  const isPaid = invoice.status === "paid"
  const isVoid = invoice.status === "void"
  const showAmountDue = !isPaid && !isVoid && invoice.amount_due > 0

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.headerRow}>
          {/* Left: company */}
          <View>
            <Text style={s.companyName}>{org.name}</Text>
            {org.legal_name && <Text style={s.companyDetail}>{org.legal_name}</Text>}
            {org.tax_id && <Text style={s.companyDetail}>{org.tax_id}</Text>}
            {org.address_line_1 && (
              <Text style={s.companyDetail}>
                {org.address_line_1}
                {org.city ? `, ${org.city}` : ""}
                {org.postal_code ? ` ${org.postal_code}` : ""}
              </Text>
            )}
            {org.email && <Text style={s.companyDetail}>{org.email}</Text>}
            {org.phone && <Text style={s.companyDetail}>{org.phone}</Text>}
          </View>

          {/* Right: invoice meta */}
          <View>
            <Text style={s.invoiceLabel}>FACTURA</Text>
            <Text style={s.invoiceNumber}>{invoice.number}</Text>
            <Text style={s.invoiceMeta}>Emitida: {fmtDate(invoice.issue_date)}</Text>
            <Text style={s.invoiceMeta}>Vence: {fmtDate(invoice.due_date)}</Text>
            <Text style={s.invoiceMeta}>Estado: {STATUS_LABEL[invoice.status] ?? invoice.status}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Client ─────────────────────────────────────────────────────── */}
        <View>
          <Text style={s.sectionLabel}>Facturar a</Text>
          <Text style={s.clientName}>{client.name}</Text>
          {client.legal_name && client.legal_name !== client.name && (
            <Text style={s.clientEmail}>{client.legal_name}</Text>
          )}
          {client.tax_id && <Text style={s.clientEmail}>NIF/CIF: {client.tax_id}</Text>}
          {client.city && <Text style={s.clientEmail}>{client.city}</Text>}
          {client.email && <Text style={s.clientEmail}>{client.email}</Text>}
          {client.phone && <Text style={s.clientEmail}>{client.phone}</Text>}
        </View>

        <View style={s.divider} />

        {/* ── Items table ────────────────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colDesc]}>Concepto</Text>
          <Text style={[s.thText, s.colQty]}>Cant.</Text>
          <Text style={[s.thText, s.colPrice]}>P. unit.</Text>
          <Text style={[s.thText, s.colTax]}>IVA</Text>
          <Text style={[s.thText, s.colTotal]}>Total</Text>
        </View>

        {items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tdText, s.colDesc]}>{item.description}</Text>
            <Text style={[s.tdMuted, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.tdMuted, s.colPrice]}>{fmt(item.unit_price, invoice.currency)}</Text>
            <Text style={[s.tdMuted, s.colTax]}>{item.tax_rate}%</Text>
            <Text style={[s.tdText, s.colTotal]}>{fmt(item.line_total ?? 0, invoice.currency)}</Text>
          </View>
        ))}

        {/* ── Totals ─────────────────────────────────────────────────────── */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>

          {invoice.discount_amount > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Descuento</Text>
              <Text style={s.totalValue}>-{fmt(invoice.discount_amount, invoice.currency)}</Text>
            </View>
          )}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA</Text>
            <Text style={s.totalValue}>{fmt(invoice.tax_amount, invoice.currency)}</Text>
          </View>

          <View style={s.grandTotalRow}>
            <Text style={s.grandLabel}>Total</Text>
            <Text style={s.grandValue}>{fmt(invoice.total, invoice.currency)}</Text>
          </View>

          {showAmountDue && (
            <View style={[s.totalRow, { marginBottom: 8 }]}>
              <Text style={s.totalLabel}>Pendiente de pago</Text>
              <Text style={s.totalValue}>{fmt(invoice.amount_due, invoice.currency)}</Text>
            </View>
          )}

          {isPaid && (
            <View style={s.paidBadge}>
              <Text style={s.paidText}>✓  Pagada</Text>
            </View>
          )}

          {!isPaid && !isVoid && invoice.status === "partially_paid" && (
            <View style={s.pendingBadge}>
              <Text style={s.pendingText}>Pago parcial</Text>
            </View>
          )}

          {isVoid && (
            <View style={s.pendingBadge}>
              <Text style={s.pendingText}>Anulada</Text>
            </View>
          )}
        </View>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        {invoice.notes && (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>Notas</Text>
            <Text style={s.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Factura generada por {org.name}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
