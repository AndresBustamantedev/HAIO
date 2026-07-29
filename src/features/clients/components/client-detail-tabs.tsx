"use client"

import Link from "next/link"

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common/empty-state"
import { StatusBadge } from "@/components/common/status-badge"
import { getInvoiceStatusBadge } from "@/features/invoices/utils/status"
import type { ClientDetail } from "@/features/clients/queries/get-client-detail"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  )
}

function formatCurrency(value: number | null, currency: string | null) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency ?? "EUR" }).format(
    value ?? 0
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center justify-between gap-3 py-2.5 text-sm">{children}</li>
}

function ClientDetailTabs({ detail }: { detail: ClientDetail }) {
  return (
    <Tabs defaultValue="contacts">
      <TabsList className="flex-wrap">
        <TabsTrigger value="contacts">Contactos ({detail.contacts.length})</TabsTrigger>
        <TabsTrigger value="projects">Proyectos ({detail.projects.length})</TabsTrigger>
        <TabsTrigger value="services">Servicios ({detail.services.length})</TabsTrigger>
        <TabsTrigger value="infra">Dominios y hosting</TabsTrigger>
        <TabsTrigger value="invoices">Facturas ({detail.invoices.length})</TabsTrigger>
        <TabsTrigger value="documents">Documentos ({detail.documents.length})</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
      </TabsList>

      <TabsPanel value="contacts">
        {detail.contacts.length === 0 ? (
          <EmptyState title="Sin contactos" description="Todavía no se ha registrado ningún contacto." />
        ) : (
          <ul className="divide-y">
            {detail.contacts.map((contact) => (
              <Row key={contact.id}>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {contact.full_name} {contact.is_primary ? "· Principal" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contact.job_title ?? "—"} · {contact.email ?? "sin email"}
                  </span>
                </div>
                <span className="text-muted-foreground">{contact.phone ?? "—"}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="projects">
        {detail.projects.length === 0 ? (
          <EmptyState title="Sin proyectos" description="Este cliente todavía no tiene proyectos." />
        ) : (
          <ul className="divide-y">
            {detail.projects.map((project) => (
              <Row key={project.id}>
                <Link href={`/proyectos/${project.id}`} className="font-medium text-foreground hover:underline">
                  {project.name}
                </Link>
                <span className="text-muted-foreground">{project.status}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="services">
        {detail.services.length === 0 ? (
          <EmptyState title="Sin servicios" description="No hay servicios contratados todavía." />
        ) : (
          <ul className="divide-y">
            {detail.services.map((service) => (
              <Row key={service.id}>
                <span className="font-medium text-foreground">{service.services?.name ?? "Servicio"}</span>
                <span className="text-muted-foreground">{formatCurrency(service.unit_price, service.currency_code)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="infra">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Dominios</p>
            {detail.domains.length === 0 ? (
              <EmptyState title="Sin dominios" />
            ) : (
              <ul className="divide-y">
                {detail.domains.map((domain) => (
                  <Row key={domain.id}>
                    <span className="font-medium text-foreground">{domain.domain_name}</span>
                    <span className="text-muted-foreground">{formatDate(domain.expires_on)}</span>
                  </Row>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Hosting</p>
            {detail.hostingAccounts.length === 0 ? (
              <EmptyState title="Sin hosting" />
            ) : (
              <ul className="divide-y">
                {detail.hostingAccounts.map((hosting) => (
                  <Row key={hosting.id}>
                    <span className="font-medium text-foreground">{hosting.provider_name}</span>
                    <span className="text-muted-foreground">{formatDate(hosting.expires_on)}</span>
                  </Row>
                ))}
              </ul>
            )}
          </div>
        </div>
      </TabsPanel>

      <TabsPanel value="invoices">
        {detail.invoices.length === 0 ? (
          <EmptyState title="Sin facturas" description="Este cliente todavía no tiene facturas." />
        ) : (
          <ul className="divide-y">
            {detail.invoices.map((invoice) => {
              const badge = invoice.status ? getInvoiceStatusBadge(invoice.status) : null
              return (
                <Row key={invoice.invoice_id}>
                  <span className="font-medium text-foreground">{invoice.invoice_number}</span>
                  <div className="flex items-center gap-2">
                    {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
                    <span className="text-muted-foreground">
                      {formatCurrency(invoice.total, invoice.currency_code)}
                    </span>
                  </div>
                </Row>
              )
            })}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="documents">
        {detail.documents.length === 0 ? (
          <EmptyState title="Sin documentos" description="No hay documentos visibles todavía." />
        ) : (
          <ul className="divide-y">
            {detail.documents.map((document) => (
              <Row key={document.id}>
                <span className="font-medium text-foreground">{document.title}</span>
                <span className="text-muted-foreground">{formatDate(document.created_at)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>

      <TabsPanel value="activity">
        {detail.activity.length === 0 ? (
          <EmptyState title="Sin actividad reciente" />
        ) : (
          <ul className="divide-y">
            {detail.activity.map((entry) => (
              <Row key={entry.id}>
                <span className="text-foreground">{entry.summary}</span>
                <span className="text-muted-foreground">{formatDate(entry.created_at)}</span>
              </Row>
            ))}
          </ul>
        )}
      </TabsPanel>
    </Tabs>
  )
}

export { ClientDetailTabs }
