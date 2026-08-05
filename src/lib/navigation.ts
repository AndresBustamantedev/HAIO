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
  LinkIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const DASHBOARD_ITEM: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboardIcon,
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "CRM",
    items: [
      { label: "Clientes",    href: "/clientes",    icon: UsersIcon },
      { label: "Contactos",   href: "/contactos",   icon: ContactIcon },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Proyectos",      href: "/proyectos",      icon: FolderKanbanIcon },
      { label: "Tareas",         href: "/tareas",         icon: CheckSquareIcon },
      { label: "Tickets",        href: "/tickets",        icon: TicketIcon },
      { label: "Documentos",     href: "/documentos",     icon: FileIcon },
      { label: "Notificaciones", href: "/notificaciones", icon: BellIcon },
    ],
  },
  {
    label: "Infraestructura",
    items: [
      { label: "Dominios",      href: "/dominios",      icon: GlobeIcon },
      { label: "Hosting",       href: "/hosting",       icon: ServerIcon },
      { label: "Correos",       href: "/correos",       icon: MailIcon },
      { label: "Sitios web",    href: "/sitios-web",    icon: MonitorIcon },
      { label: "Backups",       href: "/backups",       icon: DatabaseBackupIcon },
      { label: "Credenciales",  href: "/credenciales",  icon: KeyRoundIcon },
      { label: "Integraciones", href: "/integraciones", icon: LinkIcon },
      { label: "Proveedores",   href: "/proveedores",   icon: BuildingIcon },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Presupuestos", href: "/presupuestos", icon: FileTextIcon },
      { label: "Facturas",     href: "/facturas",     icon: ReceiptTextIcon },
      { label: "Pagos",        href: "/pagos",        icon: CreditCardIcon },
      { label: "Suscripciones",href: "/suscripciones",icon: RepeatIcon },
      { label: "Servicios",    href: "/servicios",    icon: PackageIcon },
    ],
  },
  {
    label: "Administración",
    items: [
      { label: "Configuración", href: "/configuracion", icon: SettingsIcon },
    ],
  },
]

/** Flat list derived from sections — used for path matching in AppHeader. */
export const NAV_ITEMS: NavItem[] = [
  DASHBOARD_ITEM,
  ...NAV_SECTIONS.flatMap((s) => s.items),
]
