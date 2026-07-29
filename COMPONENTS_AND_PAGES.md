# COMPONENTS_AND_PAGES.md

> HAIO UI Architecture
> Version: 1.0
> Last Update: 2026-07-29

---

# Objetivo

Este documento define cómo deben construirse todas las páginas, componentes y módulos de HAIO.

Su finalidad es mantener una arquitectura consistente, reutilizable y escalable.

Ningún agente (Claude, Trae, Codex, etc.) debe crear componentes o páginas sin seguir estas reglas.

---

# Filosofía

Antes de escribir código:

1. Buscar si el componente ya existe.
2. Reutilizar antes de crear.
3. Si no existe, construirlo de forma genérica.
4. Nunca crear componentes específicos para una sola página si pueden reutilizarse.

---

# Estructura

```
src/

app/

components/
    ui/
    layout/
    common/
    forms/
    tables/
    cards/
    feedback/

features/
    dashboard/
    clients/
    projects/
    invoices/
    domains/
    hosting/
    services/

hooks/

lib/

services/

types/

stores/
```

---

# Componentes

Los componentes deben clasificarse.

## UI

Componentes básicos.

Ejemplo

Button

Input

Select

Checkbox

Badge

Avatar

Dialog

Drawer

Tabs

Tooltip

Popover

Card

Skeleton

Spinner

---

## Layout

Sidebar

Header

PageHeader

Breadcrumb

Container

Section

---

## Common

Componentes reutilizables.

SearchBar

FilterBar

Pagination

EmptyState

ConfirmDialog

DeleteDialog

StatCard

MetricCard

StatusBadge

---

## Forms

ClientForm

ProjectForm

InvoiceForm

TaskForm

No deben contener consultas a Supabase.

Solo reciben props.

---

## Tables

Cada módulo tendrá su propia tabla.

Ejemplo

ClientsTable

ProjectsTable

InvoicesTable

DomainsTable

---

# Features

Toda lógica debe vivir dentro de su módulo.

Ejemplo

features/

clients/

components/

hooks/

services/

types/

utils/

---

# Páginas

Las páginas solo organizan componentes.

Nunca contienen lógica de negocio.

Incorrecto

page.tsx

300 líneas de código

Correcto

page.tsx

20-40 líneas

Importa componentes.

---

# Estructura de una página

Page

↓

PageHeader

↓

Toolbar

↓

Content

↓

Table o Cards

↓

Pagination

---

# PageHeader

Todas las páginas tendrán:

Título

Descripción

Botón principal

Acciones secundarias

Ejemplo

Clientes

Gestiona todos tus clientes.

[Nuevo Cliente]

---

# Toolbar

Debe incluir

Buscador

Filtros

Ordenación

Exportar

Vista

---

# Contenido

Puede ser

Tabla

Cards

Kanban

Calendario

Timeline

Dependiendo del módulo.

---

# Tablas

Todas las tablas deben soportar

Búsqueda

Ordenación

Paginación

Filtros

Selección múltiple

Acciones por fila

Loading

Empty State

Error State

---

# Drawer

Crear

Editar

Ver detalle

Siempre utilizar Drawer antes que Modal.

---

# Modal

Reservado para

Eliminar

Confirmaciones

Acciones críticas

---

# Formularios

Los formularios nunca consultan Supabase.

Reciben

defaultValues

onSubmit

loading

error

success

---

# Server Components

Por defecto

Todas las páginas serán Server Components.

---

# Client Components

Solo cuando sea necesario.

Ejemplos

Formularios

Dropdowns

Drag & Drop

Charts interactivos

---

# Consultas

Nunca consultar Supabase directamente desde un componente visual.

Utilizar

services/

o

Server Actions

---

# Hooks

Toda lógica reutilizable irá en hooks.

Ejemplo

useClients

useInvoices

useProjects

---

# Estados

Toda página debe implementar:

Loading

Error

Empty

Success

---

# Loading

Utilizar Skeleton.

No Spinner.

---

# Empty State

Siempre incluir

Icono

Título

Descripción

Botón

---

# Error State

Mostrar mensaje claro.

Botón

Reintentar

---

# Confirmaciones

Eliminar

Cancelar

Cerrar proyecto

Eliminar factura

Siempre requieren confirmación.

---

# Componentes reutilizables obligatorios

PageHeader

SearchBar

FilterBar

StatusBadge

StatCard

MetricCard

InfoCard

DeleteDialog

ConfirmDialog

Pagination

DataTable

EmptyState

LoadingState

ErrorState

Section

Container

---

# Reglas

Nunca duplicar componentes.

Nunca copiar código entre módulos.

Siempre reutilizar.

---

# Checklist antes de crear una página

□ Existe diseño.

□ Existe ruta.

□ Existe módulo.

□ Existe servicio.

□ Existe tipo.

□ Existe formulario.

□ Existe tabla.

□ Responsive.

□ Dark Mode.

□ Skeleton.

□ Empty State.

□ Error State.

□ Accesibilidad.

□ Componentes reutilizables.

---

# Checklist antes de crear un componente

□ Es reutilizable.

□ Está tipado.

□ Tiene props claras.

□ Funciona en móvil.

□ Funciona en Dark Mode.

□ Tiene estados Loading.

□ Tiene estados Error.

□ Tiene documentación.

□ No duplica otro componente.

---

# Regla de oro

Una página nunca debe superar las 100 líneas de código.

Un componente nunca debe mezclar presentación, lógica y acceso a datos.

Separar siempre:

- UI
- Lógica
- Datos

Cada pieza debe tener una única responsabilidad.