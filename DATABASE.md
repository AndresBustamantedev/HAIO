# DATABASE.md — HAIO Client & Web Operations

> Especificación funcional y técnica de la base de datos de HAIO.
>
> Objetivo: permitir que un agente de desarrollo genere las migraciones SQL de Supabase/PostgreSQL, configure autenticación, RLS, índices, funciones, triggers, Storage y tipos TypeScript sin inventar decisiones estructurales importantes.

---

## 1. Alcance

HAIO es una aplicación interna para gestionar una actividad de desarrollo y mantenimiento web:

- clientes y contactos;
- proyectos y sitios web;
- servicios contratados;
- dominios, hosting y correo;
- credenciales y accesos;
- presupuestos, facturas, cobros y suscripciones;
- documentos;
- copias de seguridad;
- tareas;
- incidencias y tickets;
- notificaciones;
- historial y auditoría;
- portal de cliente.

La base de datos se implementará en **Supabase**, utilizando PostgreSQL, Supabase Auth, Row Level Security y Supabase Storage.

---

## 2. Principios obligatorios

1. Usar UUID en todas las claves primarias.
2. Usar `timestamptz` para fechas con hora.
3. Guardar importes monetarios como `numeric(12,2)`, nunca como `float`.
4. Guardar códigos de moneda con `char(3)`, por defecto `EUR`.
5. Activar RLS en todas las tablas del esquema `public`.
6. No usar la clave de servicio en el navegador.
7. No guardar contraseñas en texto plano.
8. Usar borrado lógico en entidades de negocio importantes mediante `deleted_at`.
9. No borrar en cascada información financiera o de auditoría.
10. Crear índices para claves foráneas y campos usados en filtros.
11. Mantener `created_at`, `updated_at`, `created_by` y, cuando proceda, `updated_by`.
12. Las migraciones deben estar versionadas.
13. No modificar manualmente tablas internas de los esquemas `auth`, `storage` o `realtime`.
14. Los nombres SQL serán `snake_case`; los tipos TypeScript podrán usar `camelCase`.
15. Toda tabla que pertenezca a una organización debe incluir `organization_id`.

---

## 3. Modelo multiorganización

Aunque inicialmente exista una sola empresa, la base debe soportar varias organizaciones sin rehacer el esquema.

### organizations

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK, `default gen_random_uuid()` |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| legal_name | text | nullable |
| tax_id | text | nullable |
| email | text | nullable |
| phone | text | nullable |
| website | text | nullable |
| address_line_1 | text | nullable |
| address_line_2 | text | nullable |
| city | text | nullable |
| region | text | nullable |
| postal_code | text | nullable |
| country_code | char(2) | NOT NULL, default `ES` |
| currency_code | char(3) | NOT NULL, default `EUR` |
| timezone | text | NOT NULL, default `Europe/Madrid` |
| logo_path | text | nullable |
| settings | jsonb | NOT NULL, default `{}` |
| created_at | timestamptz | NOT NULL, default `now()` |
| updated_at | timestamptz | NOT NULL, default `now()` |
| deleted_at | timestamptz | nullable |

### organization_members

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations.id, NOT NULL |
| user_id | uuid | FK → auth.users.id, NOT NULL |
| role | organization_role | NOT NULL |
| status | membership_status | NOT NULL, default `active` |
| invited_by | uuid | FK → auth.users.id, nullable |
| invited_at | timestamptz | nullable |
| joined_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Restricción única:

```sql
unique (organization_id, user_id)
```

---

## 4. Autenticación y perfiles

Supabase Auth gestiona las cuentas en `auth.users`. La aplicación tendrá una tabla pública vinculada.

### profiles

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK y FK → auth.users.id, `on delete cascade` |
| full_name | text | nullable |
| first_name | text | nullable |
| last_name | text | nullable |
| avatar_path | text | nullable |
| phone | text | nullable |
| locale | text | NOT NULL, default `es-ES` |
| timezone | text | NOT NULL, default `Europe/Madrid` |
| is_active | boolean | NOT NULL, default true |
| last_seen_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Crear una función y trigger `handle_new_user()` que inserte un perfil al crearse un registro en `auth.users`.

El trigger debe:

- usar `security definer`;
- fijar explícitamente un `search_path` seguro;
- copiar `full_name`, `first_name` y `last_name` desde `raw_user_meta_data` cuando existan;
- estar probado porque un fallo podría bloquear el registro.

---

## 5. Enumeraciones

Crear estos enums en PostgreSQL.

```text
organization_role: owner, admin, manager, member, viewer, client
membership_status: invited, active, suspended, revoked
client_status: lead, prospect, active, inactive, archived
client_type: individual, company, association, other
project_status: draft, planned, active, on_hold, completed, cancelled, archived
project_type: website, ecommerce, landing_page, maintenance, redesign, seo, consulting, other
service_category: development, design, hosting, domain, email, maintenance, seo, analytics, support, consulting, other
service_billing_type: one_time, recurring, usage_based, free
billing_interval: weekly, monthly, quarterly, semiannual, annual, biennial, custom
domain_status: pending, active, expired, transferred, cancelled, unknown
hosting_status: pending, active, suspended, expired, cancelled
credential_type: website_admin, hosting_panel, domain_registrar, ftp, sftp, ssh, database, email, api, social_media, analytics, other
provider_category: registrar, hosting, email, dns, cms, cloud, other   ← (0016)
quote_status: draft, sent, viewed, accepted, rejected, expired, cancelled
invoice_status: draft, issued, sent, viewed, partially_paid, paid, overdue, void, refunded
payment_status: pending, processing, succeeded, failed, cancelled, refunded, partially_refunded
payment_method_type: bank_transfer, card, cash, paypal, stripe, direct_debit, other
subscription_status: trialing, active, past_due, paused, cancelled, expired
task_status: backlog, todo, in_progress, blocked, review, done, cancelled
task_priority: low, medium, high, urgent
ticket_status: open, in_progress, waiting_client, waiting_internal, resolved, closed, cancelled
ticket_priority: low, normal, high, urgent
notification_type: system, renewal, payment, invoice, task, ticket, backup, security, other
notification_channel: in_app, email, push, webhook
backup_status: pending, running, successful, failed, cancelled
document_category: contract, quote, invoice, receipt, brief, report, credential_export, legal, other
```

`credential_mode` (columna texto con CHECK en `credentials`): `encrypted`, `external_reference`, `none`.

---

## 6. Clientes y contactos

### clients

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| type | client_type | NOT NULL, default `company` |
| status | client_status | NOT NULL, default `lead` |
| display_name | text | NOT NULL |
| legal_name | text | nullable |
| tax_id | text | nullable |
| email | text | nullable |
| phone | text | nullable |
| website | text | nullable |
| address_line_1 | text | nullable |
| address_line_2 | text | nullable |
| city | text | nullable |
| region | text | nullable |
| postal_code | text | nullable |
| country_code | char(2) | NOT NULL, default `ES` |
| preferred_language | text | NOT NULL, default `es` |
| source | text | nullable |
| notes | text | nullable |
| metadata | jsonb | NOT NULL, default `{}` |
| created_by | uuid | FK → auth.users.id, nullable |
| updated_by | uuid | FK → auth.users.id, nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

Reglas:

- `display_name` no puede ser vacío.
- `tax_id` será único por organización cuando no sea nulo y el registro no esté eliminado.
- crear búsqueda por `display_name`, `legal_name`, `tax_id` y `email`.

### client_contacts

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK → clients.id, NOT NULL |
| full_name | text | NOT NULL |
| job_title | text | nullable |
| department | text | nullable |
| email | text | nullable |
| phone | text | nullable |
| mobile | text | nullable |
| is_primary | boolean | NOT NULL, default false |
| receives_billing | boolean | NOT NULL, default false |
| receives_support | boolean | NOT NULL, default false |
| notes | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

Solo podrá existir un contacto principal activo por cliente mediante índice único parcial.

### client_portal_access

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, NOT NULL |
| user_id | uuid | FK → auth.users.id, NOT NULL |
| can_view_projects | boolean | default true |
| can_view_invoices | boolean | default true |
| can_view_documents | boolean | default true |
| can_create_tickets | boolean | default true |
| created_at | timestamptz | NOT NULL |

Restricción única: `unique (client_id, user_id)`.

---

## 7. Proyectos y servicios

### projects

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK → clients.id, NOT NULL |
| name | text | NOT NULL |
| slug | text | NOT NULL |
| type | project_type | NOT NULL |
| status | project_status | NOT NULL, default `draft` |
| description | text | nullable |
| production_url | text | nullable |
| staging_url | text | nullable |
| repository_url | text | nullable |
| start_date | date | nullable |
| target_date | date | nullable |
| completed_at | timestamptz | nullable |
| budget | numeric(12,2) | nullable, CHECK >= 0 |
| currency_code | char(3) | NOT NULL, default `EUR` |
| progress_percent | smallint | NOT NULL, default 0, CHECK entre 0 y 100 |
| assigned_to | uuid | FK → auth.users.id, nullable |
| metadata | jsonb | NOT NULL, default `{}` |
| created_by | uuid | nullable |
| updated_by | uuid | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

Restricción única: `unique (organization_id, slug)`.

### services

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| name | text | NOT NULL |
| code | text | NOT NULL |
| category | service_category | NOT NULL |
| billing_type | service_billing_type | NOT NULL |
| default_price | numeric(12,2) | nullable, CHECK >= 0 |
| currency_code | char(3) | NOT NULL, default `EUR` |
| default_interval | billing_interval | nullable |
| tax_rate | numeric(5,2) | NOT NULL, default 21.00, CHECK entre 0 y 100 |
| is_active | boolean | NOT NULL, default true |
| description | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Restricción única: `unique (organization_id, code)`.

### client_services

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, NOT NULL |
| project_id | uuid | FK, nullable |
| service_id | uuid | FK, NOT NULL |
| name_override | text | nullable |
| status | subscription_status | NOT NULL, default `active` |
| unit_price | numeric(12,2) | NOT NULL, CHECK >= 0 |
| quantity | numeric(10,2) | NOT NULL, default 1, CHECK > 0 |
| currency_code | char(3) | NOT NULL, default `EUR` |
| billing_interval | billing_interval | nullable |
| interval_count | integer | NOT NULL, default 1, CHECK > 0 |
| starts_on | date | nullable |
| ends_on | date | nullable |
| next_billing_date | date | nullable |
| auto_renew | boolean | NOT NULL, default true |
| supplier_cost | numeric(12,2) | nullable, CHECK >= 0 |
| notes | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

---

## 8. Dominios, hosting y correo

### domains

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, NOT NULL |
| project_id | uuid | FK, nullable |
| domain_name | citext | NOT NULL |
| status | domain_status | NOT NULL, default `unknown` |
| registrar_name | text | nullable |
| registrar_account_reference | text | nullable |
| registered_on | date | nullable |
| expires_on | date | nullable |
| renewal_price | numeric(12,2) | nullable — precio relevante para el cliente |
| currency_code | char(3) | NOT NULL, default `EUR` |
| auto_renew | boolean | NOT NULL, default false |
| managed_by_us | boolean | NOT NULL, default true |
| nameservers | text[] | NOT NULL, default `{}` |
| privacy_enabled | boolean | NOT NULL, default false |
| transfer_lock_enabled | boolean | nullable |
| provider_account_id | uuid | FK → provider_accounts.id, nullable ← (0016) |
| internal_cost | numeric(12,2) | nullable, CHECK >= 0 — coste real que paga HAIO ← (0016) |
| notes | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

Crear unicidad parcial por organización y dominio activo, e índices sobre `expires_on`, `status` y `client_id`.

`renewal_price` es el precio cobrado al cliente. `internal_cost` es el coste que paga HAIO al proveedor (separación coste/precio).

### hosting_accounts

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, NOT NULL |
| project_id | uuid | FK, nullable |
| provider_name | text | NOT NULL |
| plan_name | text | nullable |
| status | hosting_status | NOT NULL |
| panel_url | text | nullable |
| server_hostname | text | nullable |
| server_ip | inet | nullable |
| starts_on | date | nullable |
| expires_on | date | nullable |
| renewal_price | numeric(12,2) | nullable — precio al cliente |
| currency_code | char(3) | NOT NULL, default `EUR` |
| billing_interval | billing_interval | nullable |
| auto_renew | boolean | NOT NULL, default false |
| storage_limit_mb | bigint | nullable, CHECK >= 0 |
| bandwidth_limit_mb | bigint | nullable, CHECK >= 0 |
| provider_account_id | uuid | FK → provider_accounts.id, nullable ← (0016) |
| internal_cost | numeric(12,2) | nullable, CHECK >= 0 ← (0016) |
| is_shared | boolean | NOT NULL, default false — si alojan varios clientes ← (0016) |
| notes | text | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | nullable |

Cuando `is_shared = true`, los sitios individuales se registran en `hosting_sites`.

### hosting_sites  ← (0016)

Cada sitio alojado dentro de una cuenta de hosting. Permite representar hosting compartido entre clientes sin duplicar el contrato.

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| hosting_account_id | uuid | FK → hosting_accounts.id, NOT NULL |
| client_id | uuid | FK → clients.id, NOT NULL |
| project_id | uuid | FK, nullable |
| domain_id | uuid | FK → domains.id, nullable |
| site_label | text | NOT NULL |
| document_root | text | nullable |
| is_primary | boolean | NOT NULL, default false |
| notes | text | nullable |
| created_at / updated_at / deleted_at | timestamptz | estándar |

### email_services

Incluye organización, cliente, proyecto, proveedor, dominio, plan, estado, fechas, renovación, moneda, autorrenovación y timestamps.

Columnas añadidas en 0016: `provider_account_id uuid`, `internal_cost numeric(12,2)`.

### email_accounts

Incluye organización, servicio de correo, dirección, nombre visible, cuota, estado, reenvíos, notas y timestamps. No almacenar la contraseña aquí.

---

## 9. Proveedores e inventario de infraestructura  ← (0016)

### providers

Catálogo normalizado de empresas proveedoras (Hostinger, Zoho, Cloudflare…).

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| name | text | NOT NULL |
| category | provider_category | NOT NULL, default `other` |
| website | text | nullable |
| support_url | text | nullable |
| notes | text | nullable |
| created_at / updated_at / deleted_at | timestamptz | estándar |

Unicidad parcial: `(organization_id, lower(name))` donde `deleted_at is null`.

### provider_accounts

Cuenta concreta que HAIO usa dentro de un proveedor. Puede administrar recursos de varios clientes.

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| provider_id | uuid | FK → providers.id, NOT NULL |
| label | text | NOT NULL — descripción legible (ej. "Cuenta reseller OVH") |
| account_reference | text | nullable — nº de cuenta, login de portal, no sensible |
| notes | text | nullable |
| created_at / updated_at / deleted_at | timestamptz | estándar |

Las credenciales de acceso a esta cuenta se guardan en `credentials.provider_account_id` (FK inversa).

RLS: solo `owner`, `admin` y `manager` pueden ver y modificar.

### website_installations

Instalación CMS/web asociada a un cliente, dominio y hosting.

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, NOT NULL |
| project_id | uuid | FK, nullable |
| domain_id | uuid | FK, nullable |
| hosting_site_id | uuid | FK → hosting_sites.id, nullable |
| name | text | NOT NULL |
| public_url | text | nullable |
| admin_url | text | nullable |
| cms_type | text | CHECK: `wordpress\|shopify\|prestashop\|joomla\|drupal\|magento\|woocommerce\|custom\|other` |
| cms_version | text | nullable |
| environment | text | CHECK: `production\|staging\|development\|testing`, default `production` |
| status | text | CHECK: `active\|maintenance\|inactive\|archived`, default `active` |
| notes | text | nullable |
| created_at / updated_at / deleted_at | timestamptz | estándar |

---

## 10. Credenciales y secretos

No guardar contraseñas, tokens API, claves privadas ni secretos en texto plano dentro de tablas públicas.

### credentials

| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| client_id | uuid | FK, nullable |
| project_id | uuid | FK, nullable |
| domain_id | uuid | FK, nullable |
| hosting_account_id | uuid | FK, nullable |
| email_account_id | uuid | FK, nullable |
| provider_account_id | uuid | FK → provider_accounts.id, nullable ← (0016) |
| website_installation_id | uuid | FK → website_installations.id, nullable ← (0016) |
| type | credential_type | NOT NULL |
| label | text | NOT NULL |
| username | text | nullable |
| login_url | text | nullable |
| secret_reference | text | nullable — puntero a gestor externo (modo `external_reference`) |
| secret_ciphertext | bytea | nullable — secreto cifrado AES-256-GCM ← (0016) |
| credential_mode | text | NOT NULL, default `none` — valores: `encrypted`, `external_reference`, `none` ← (0016) |
| secret_version | integer | NOT NULL, default 1 ← (0016) |
| encryption_key_version | integer | NOT NULL, default 1 ← (0016) |
| notes | text | nullable |
| is_shared_with_client | boolean | NOT NULL, default false |
| last_verified_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |
| created_by / updated_by | uuid | nullable |
| created_at / updated_at / deleted_at | timestamptz | estándar |

**Constraint de coherencia** `credentials_mode_coherence`:
- `encrypted` → `secret_ciphertext IS NOT NULL`, `secret_reference` vacío/nulo
- `external_reference` → `secret_reference` no vacío, `secret_ciphertext IS NULL`
- `none` → ambos nulos/vacíos

**Modelo de cifrado:**
- `secret_ciphertext` almacena el secreto cifrado con AES-256-GCM.
- La clave vive **únicamente** en `process.env.CREDENTIAL_ENCRYPTION_KEY` (servidor Next.js).
- **No existe ninguna función SQL que descifre.** El descifrado ocurre exclusivamente en Server Actions.
- Los listados deben usar `v_credentials_safe` (vista sin `secret_ciphertext`).
- El flujo "Revelar" es: Server Action → SELECT `secret_ciphertext` (tabla raw, servidor) → INSERT log → descifrar → devolver solo para esa petición.

### credential_access_logs

Registro append-only con `credential_id`, `user_id`, acción (`view`, `copy`, `update`, `rotate`), IP, user-agent y fecha. No permitir `UPDATE` ni `DELETE` desde la aplicación.

---

## 10. Presupuestos

### quotes

Incluye organización, cliente, proyecto, número, estado, fechas, moneda, subtotal, descuento, impuestos, total, notas, condiciones, aceptación, autor y timestamps.

Restricción única: `unique (organization_id, quote_number)`.

### quote_items

Incluye presupuesto, servicio opcional, descripción, cantidad, precio unitario, descuento, impuesto, subtotales y orden.

Los totales deben recalcularse en servidor o mediante función transaccional.

---

## 11. Facturación y pagos

### invoices

Incluye organización, cliente, proyecto, presupuesto relacionado, número, estado, fechas, moneda, subtotal, descuento, impuestos, total, cobrado, pendiente, notas, envío, visualización, pago, proveedor externo y timestamps.

Reglas:

- importes no negativos;
- número único por organización;
- no borrar físicamente facturas emitidas o pagadas;
- usar `status = 'void'` para anular.

### invoice_items

Misma estructura que `quote_items`, sustituyendo `quote_id` por `invoice_id`.

### payments

Incluye organización, cliente, factura opcional, estado, método, importe, moneda, fecha, referencia, proveedor externo, identificador externo, fallo, metadata y timestamps.

Crear índice único parcial para evitar pagos externos duplicados.

### subscriptions

Incluye organización, cliente, servicio, estado, importe, moneda, intervalo, periodo actual, cancelación y referencias externas.

---

## 12. Documentos y Storage

### documents

Incluye organización, cliente, proyecto, presupuesto, factura, categoría, título, descripción, bucket, ruta, nombre original, MIME, tamaño, checksum, visibilidad para cliente, usuario que subió y timestamps.

Buckets recomendados:

- `avatars`;
- `organization-assets`;
- `client-documents`;
- `project-files`;
- `invoice-files`;
- `backup-files`.

Ruta recomendada:

```text
{organization_id}/{client_id}/{document_id}/{filename}
```

Las políticas de Storage deben validar organización, usuario y visibilidad.

---

## 13. Copias de seguridad

### backup_configurations

Incluye organización, cliente, proyecto, nombre, proveedor, frecuencia, retención, estado, última ejecución y próxima ejecución.

### backup_records

Incluye configuración, estado, inicio, finalización, ruta, tamaño, checksum, error, metadata y timestamps.

---

## 14. Tareas

### tasks

Incluye organización, cliente, proyecto, tarea padre, título, descripción, estado, prioridad, asignado, vencimiento, inicio, finalización, estimación, tiempo real, orden, autor y timestamps.

### task_comments

Incluye tarea, autor, contenido, visibilidad interna y borrado lógico.

---

## 15. Tickets e incidencias

### tickets

Incluye organización, cliente, proyecto, número, asunto, descripción, estado, prioridad, solicitante, contacto, asignado, primera respuesta, resolución, cierre y timestamps.

### ticket_messages

Incluye ticket, autor interno o contacto, cuerpo, marca interna y timestamps.

---

## 16. Notificaciones y correos

### notifications

Incluye usuario, tipo, título, cuerpo, URL, entidad relacionada, lectura, creación y expiración.

### notification_deliveries

Registra canal, estado, proveedor, envío, entrega y error.

### email_messages

Registra correos enviados por la aplicación: destinatarios, asunto, cuerpo, proveedor, estado, fechas y error. No almacenar credenciales SMTP.

---

## 17. Actividad y auditoría

### activity_logs

Historial legible para la interfaz: usuario, acción, entidad, resumen, metadata y fecha.

### audit_logs

Registro técnico append-only con tabla, registro, datos anteriores y nuevos, usuario, IP, user-agent y request ID.

Reglas:

- no permitir actualización ni borrado desde roles de aplicación;
- redactar columnas sensibles;
- no almacenar secretos.

---

## 18. Ajustes y secuencias

### organization_settings

Configuración por organización mediante clave y valor JSON. Los secretos reales no deben guardarse directamente.

### sequences

Controla numeración de facturas, presupuestos y tickets por organización, tipo y año.

Crear función transaccional `next_sequence_value(...)` para evitar duplicados concurrentes.

---

## 19. Reglas de borrado

Usar `ON DELETE CASCADE` solo en dependencias puras, como ítems de presupuestos y facturas.

Usar `ON DELETE RESTRICT` o `NO ACTION` en datos de negocio, facturación, pagos, credenciales y auditoría.

Usar `ON DELETE SET NULL` en responsables, asignaciones y autores históricos cuando proceda.

---

## 20. Funciones y triggers obligatorios

- `set_updated_at()` para todas las tablas con `updated_at`.
- `handle_new_user()` para crear perfiles desde Auth.
- `is_organization_member(org_id uuid)`.
- `has_organization_role(org_id uuid, allowed_roles organization_role[])`.
- `can_access_client(client_id uuid)`.
- función para recalcular presupuestos.
- función para recalcular facturas y saldos.
- función transaccional de secuencias.
- vista o consulta de próximos vencimientos.

Las funciones `security definer` deben fijar `search_path`, limitar permisos y evitar recursión en RLS.

---

## 21. Row Level Security

Activar RLS en todas las tablas públicas.

### Usuarios internos

- `owner` y `admin`: gestión completa, salvo restricciones de auditoría.
- `manager`: gestión operativa y acceso financiero según permisos.
- `member`: acceso limitado a datos y elementos asignados.
- `viewer`: solo lectura sin secretos.

### Portal del cliente

Un cliente solo puede ver:

- su perfil;
- clientes vinculados mediante `client_portal_access`;
- proyectos autorizados;
- presupuestos, facturas y documentos visibles;
- sus tickets y mensajes no internos.

Nunca puede ver notas internas, costes de proveedor, márgenes, credenciales internas, logs o auditorías.

### Credenciales

Los metadatos solo serán visibles para roles autorizados. Los secretos se recuperarán únicamente desde servidor y cada acceso se registrará.

### Auditoría

Solo `owner` y `admin` pueden consultar logs. Ningún rol normal puede modificarlos.

### Storage

Las políticas deben reflejar organización, cliente, visibilidad y rol. `backup-files` debe ser de acceso exclusivo de servidor.

---

## 23. Vistas recomendadas

- `v_dashboard_metrics`.
- `v_upcoming_renewals`.
- `v_invoice_balances`.
- `v_client_summary`.
- `v_credentials_safe` — igual que `credentials` pero sin `secret_ciphertext`. **Usar siempre en listados.** ← (0016)
- `v_client_infrastructure` — agregado por cliente: conteo y coste de dominios, hosting, correos, instalaciones web y credenciales. ← (0016)

Todas las vistas usan `WITH (security_invoker = true)` para que RLS se aplique con el rol del usuario llamante, no del propietario de la vista.

---

## 24. Migraciones

| # | Nombre | Contenido |
|---|---|---|
| 0001 | extensions_and_enums | pgcrypto, citext, pg_trgm; todos los enums |
| 0002 | auth_and_organizations | set_updated_at, organizations, organization_members, profiles |
| 0003 | clients_and_projects | clients, client_contacts, client_portal_access, projects, services, client_services |
| 0004 | infrastructure | domains, hosting_accounts, email_services, email_accounts |
| 0005 | credentials | credentials, credential_access_logs, forbid_modify() |
| 0006 | quotes_invoices_payments | quotes, quote_items, invoices, invoice_items, payments, subscriptions |
| 0007 | documents_and_backups | documents, backup_configurations, backup_records |
| 0008 | tasks_tickets_notifications | tasks, task_comments, tickets, ticket_messages, notifications, notification_deliveries, email_messages |
| 0009 | audit_settings_and_views | activity_logs, audit_logs, organization_settings, vistas v_ |
| 0010 | rls_policies | RLS enable + todas las políticas de acceso |
| 0011 | storage_policies | Buckets de Storage y políticas |
| 0012–0015 | security_hardening + fixes | Funciones has_organization_role, is_organization_member, can_access_client, next_sequence_value; revocaciones y correcciones |
| 0016 | infrastructure_inventory | providers, provider_accounts, hosting_sites, website_installations; columnas nuevas en domains/hosting_accounts/email_services/credentials; cifrado; vistas v_credentials_safe y v_client_infrastructure |

Las vistas no deben eludir RLS accidentalmente.

---

## 23. Índices obligatorios

Crear índices para claves foráneas y campos frecuentes:

```sql
(organization_id, status)
(organization_id, created_at desc)
(organization_id, client_id)
(organization_id, expires_on)
(organization_id, due_date)
(client_id, status)
(project_id, status)
```

Índices parciales recomendados:

```sql
where deleted_at is null
where status = 'active'
where read_at is null
where amount_due > 0
```

Habilitar `pg_trgm` solo si la búsqueda lo necesita.

---

## 24. Extensiones PostgreSQL

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;
```

Vault solo debe habilitarse si se decide guardar secretos en PostgreSQL.

---

## 25. Variables de entorno para Next.js

Crear `.env.local` y no subirlo a Git:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Compatibilidad con nombres anteriores:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La clave secreta solo puede utilizarse en servidor.

---

## 26. Integración en Next.js

Crear:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/admin.ts
src/lib/supabase/middleware.ts
src/types/database.types.ts
```

- `client.ts`: navegador con clave publicable.
- `server.ts`: Server Components, Server Actions y Route Handlers.
- `admin.ts`: clave secreta, con `import "server-only"`.
- `database.types.ts`: generado automáticamente.

Comando de tipos:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

---

## 27. Estructura Supabase en el repositorio

```text
supabase/
├── config.toml
├── migrations/
│   ├── 0001_extensions_and_enums.sql
│   ├── 0002_auth_and_organizations.sql
│   ├── 0003_clients_and_projects.sql
│   ├── 0004_infrastructure.sql
│   ├── 0005_credentials.sql
│   ├── 0006_quotes_invoices_payments.sql
│   ├── 0007_documents_backups.sql
│   ├── 0008_tasks_tickets_notifications.sql
│   ├── 0009_audit_and_views.sql
│   ├── 0010_rls_policies.sql
│   └── 0011_storage_policies.sql
└── seed.sql
```

---

## 28. Orden de migración

1. Extensiones.
2. Enums.
3. Funciones generales.
4. Organizaciones y perfiles.
5. Clientes.
6. Proyectos y servicios.
7. Dominios, hosting y correo.
8. Credenciales.
9. Presupuestos.
10. Facturas, pagos y suscripciones.
11. Documentos y backups.
12. Tareas y tickets.
13. Notificaciones y correos.
14. Auditoría.
15. Índices.
16. Vistas.
17. RLS.
18. Storage.
19. Seed de desarrollo.

---

## 29. Datos de prueba

`seed.sql` debe crear datos ficticios de desarrollo:

- organización HAIO;
- administrador de prueba;
- cliente y contacto;
- proyecto;
- dominio y hosting;
- servicios;
- presupuesto;
- factura y pago parcial;
- tarea;
- ticket;
- notificación.

No incluir datos personales ni secretos reales.

---

## 30. Reglas para el agente

El agente debe:

1. leer este archivo completo;
2. no ejecutar migraciones remotas sin autorización;
3. crear migraciones pequeñas y ordenadas;
4. comprobar sintaxis localmente;
5. ejecutar `npx supabase db reset`, `npm run lint` y `npm run build`;
6. generar tipos TypeScript;
7. no desactivar RLS;
8. no usar políticas universales `using (true)` en datos privados;
9. no guardar secretos de ejemplo;
10. probar roles `anon`, `authenticated` y `service_role`;
11. usar transacciones en operaciones financieras;
12. no confiar en importes enviados por el navegador;
13. entregar resumen de cambios y decisiones pendientes.

---

## 31. Entregables esperados

- migraciones SQL;
- `seed.sql`;
- políticas RLS;
- políticas Storage;
- funciones y triggers;
- vistas;
- tipos TypeScript;
- `.env.example`;
- clientes Supabase para Next.js;
- documentación de conexión;
- comandos de prueba;
- lista de decisiones pendientes.

---

## 32. Decisiones que requieren aprobación humana

1. ¿La app será solo para HAIO o multicliente comercial?
2. ¿Emitirá facturas legales o solo las registrará?
3. ¿Qué proveedor de pagos se utilizará?
4. ¿Dónde se guardarán las credenciales?
5. ¿Quién puede anular facturas?
6. ¿Los clientes podrán descargar documentos?
7. ¿IVA fijo o múltiples impuestos?
8. ¿Series de facturación separadas?
9. ¿Numeración anual?
10. ¿Qué proveedor enviará correos?
11. ¿Dónde se almacenarán backups?
12. ¿Qué roles tendrá la primera versión?

---

## 33. MVP recomendado

Primera fase:

- profiles;
- organizations;
- organization_members;
- clients;
- client_contacts;
- projects;
- services;
- client_services;
- domains;
- hosting_accounts;
- tasks;
- activity_logs.

Segunda fase:

- quotes;
- invoices;
- invoice_items;
- payments;
- subscriptions;
- documents.

Tercera fase:

- credentials;
- backups;
- tickets;
- notifications;
- portal del cliente;
- auditoría avanzada.

---

## 34. Criterios de aceptación

La base estará correctamente implementada cuando:

- una organización no pueda leer datos de otra;
- un cliente solo vea datos autorizados;
- una factura no pueda quedar con saldo incoherente;
- ningún secreto aparezca en respuestas públicas;
- todas las tablas públicas tengan RLS;
- Storage respete las mismas reglas;
- `supabase db reset` reconstruya la base;
- los tipos TypeScript se generen sin errores;
- `npm run build` funcione;
- las migraciones funcionen en un proyecto Supabase vacío;
- exista seed local sin datos reales;
- las operaciones sensibles dejen auditoría.

---

## 35. Referencias oficiales

- Supabase Database: https://supabase.com/docs/guides/database/overview
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- User Management: https://supabase.com/docs/guides/auth/managing-user-data
- Database Migrations: https://supabase.com/docs/guides/local-development/database-migrations
- Local Development: https://supabase.com/docs/guides/local-development
- Secure Data: https://supabase.com/docs/guides/database/secure-data
- Vault: https://supabase.com/docs/guides/database/vault
- Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
