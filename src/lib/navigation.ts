import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboardIcon,
  UsersIcon,
  ContactIcon,
  FolderKanbanIcon,
  PackageIcon,
  GlobeIcon,
  ServerIcon,
  MailIcon,
  KeyRoundIcon,
  FileTextIcon,
  ReceiptTextIcon,
  CreditCardIcon,
  RepeatIcon,
  FileIcon,
  DatabaseBackupIcon,
  CheckSquareIcon,
  TicketIcon,
  BellIcon,
  SettingsIcon,
  BuildingIcon,
  MonitorIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

/**
 * Single source of truth for the private navigation, shared by AppSidebar
 * and MobileSidebar. Every module listed here must resolve to a real route
 * (even if it's a provisional "under construction" page) — no dead links.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Clientes", href: "/clientes", icon: UsersIcon },
  { label: "Contactos", href: "/contactos", icon: ContactIcon },
  { label: "Proyectos", href: "/proyectos", icon: FolderKanbanIcon },
  { label: "Servicios", href: "/servicios", icon: PackageIcon },
  { label: "Dominios", href: "/dominios", icon: GlobeIcon },
  { label: "Hosting", href: "/hosting", icon: ServerIcon },
  { label: "Correos", href: "/correos", icon: MailIcon },
  { label: "Proveedores", href: "/proveedores", icon: BuildingIcon },
  { label: "Sitios web", href: "/sitios-web", icon: MonitorIcon },
  { label: "Credenciales", href: "/credenciales", icon: KeyRoundIcon },
  { label: "Presupuestos", href: "/presupuestos", icon: FileTextIcon },
  { label: "Facturas", href: "/facturas", icon: ReceiptTextIcon },
  { label: "Pagos", href: "/pagos", icon: CreditCardIcon },
  { label: "Suscripciones", href: "/suscripciones", icon: RepeatIcon },
  { label: "Documentos", href: "/documentos", icon: FileIcon },
  { label: "Backups", href: "/backups", icon: DatabaseBackupIcon },
  { label: "Tareas", href: "/tareas", icon: CheckSquareIcon },
  { label: "Tickets", href: "/tickets", icon: TicketIcon },
  { label: "Notificaciones", href: "/notificaciones", icon: BellIcon },
  { label: "Configuración", href: "/configuracion", icon: SettingsIcon },
]
