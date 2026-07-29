# Propuesta — Inventario centralizado de infraestructura y accesos por cliente

> Documento de análisis. No se ha ejecutado ninguna migración. Complementa a `DATABASE.md`.

---

## 1. Auditoría del esquema actual

Tablas revisadas directamente en `supabase/migrations/0003…0010` (no se ha asumido nada desde los tipos TypeScript):

**`clients`** — entidad raíz, sin campos de infraestructura propios; todo se relaciona vía `client_id`.

**`domains`** — `client_id` NOT NULL, `project_id` nullable, `registrar_name` (texto libre), `registrar_account_reference` (texto libre), `renewal_price`, `expires_on`, `auto_renew`, `managed_by_us`. No existe ninguna entidad "proveedor"; el registrador se identifica solo por texto.

**`hosting_accounts`** — `client_id` NOT NULL, `project_id` **nullable y único** (una fila = una relación 1 hosting↔1 proyecto como máximo), `provider_name` (texto libre), `panel_url`, `renewal_price`, `expires_on`. No hay campo `is_shared` ni forma de vincular una misma cuenta de hosting a varios proyectos/sitios sin duplicar la fila completa (proveedor, coste, renovación).

**`email_services`** — el "contrato" de correo: `client_id` NOT NULL, `domain_id` nullable, `provider_name` (texto libre), `renewal_price`, `expires_on`.

**`email_accounts`** — los buzones individuales: `email_service_id` NOT NULL (el cliente se alcanza de forma transitiva, no tiene `client_id` propio), `address`, `display_name`, `quota_mb`, `status text`, `forwards_to[]`. **No tiene contraseña** (correcto, por diseño). No tiene columna `credential_id` propia, pero…

**`credentials`** — `client_id`, `project_id`, `domain_id`, `hosting_account_id`, `email_account_id` (todos nullable), `type`, `label`, `username`, `login_url`, `secret_reference` (texto libre, **solo un puntero** a un vault externo, no un secreto cifrado), `is_shared_with_client`, `last_verified_at`, `expires_at`. No existe `provider_account_id` ni ningún concepto de "cuenta de proveedor" ni de "instalación web/CMS".

**`credential_access_logs`** — append-only real: `credential_id`, `user_id`, `action` (`view|copy|update|rotate`), `ip`, `user_agent`, `created_at`. Triggers `forbid_modify()` bloquean `UPDATE`/`DELETE`. Políticas: `INSERT` solo `owner/admin/manager`, `SELECT` solo `owner/admin`.

**`client_services`** — `client_id`, `project_id` nullable, `service_id`, `unit_price` (lo que se cobra al cliente), `supplier_cost` (nullable, lo que cuesta al proveedor), `billing_interval`. **Este patrón de separación coste/precio ya existe aquí**, pero solo aquí.

**`subscriptions`** — recurrencia de facturación: `client_id`, `service_id`, `client_service_id` nullable, `amount`, `billing_interval`, `current_period_start/end`. Es la capa de cobro recurrente, no de infraestructura.

**`projects`** — `production_url`/`staging_url` como texto libre, sin vínculo estructurado a `hosting_accounts` ni a un CMS.

RLS: existe un bucle genérico en `0010_rls_policies.sql` que ya cubre `domains`, `hosting_accounts`, `email_services`, `email_accounts`, `client_services`, `credentials` con niveles `select/insert/update/delete` por rol (`credentials` ya restringido a `owner/admin/manager`, sin `viewer` ni `member`). `pgcrypto` y `citext` ya están habilitadas (`0001_extensions_and_enums.sql`); Vault no está habilitado.

---

## 2. Qué casos ya están cubiertos

- Qué dominios tiene un cliente, dónde está "comprado" (texto), coste y renovación → `domains.client_id/registrar_name/renewal_price/expires_on`.
- Dónde está alojada una web, coste y renovación → `hosting_accounts.provider_name/panel_url/renewal_price/expires_on`.
- Proveedor de correo, coste, número de buzones, direcciones → `email_services` + `count(email_accounts)` + `email_accounts.address`.
- **Qué credencial corresponde a cada buzón** → ya es consultable hoy: `credentials.email_account_id` apunta al buzón (`select * from credentials where email_account_id = X`). Está soportado a nivel de esquema; falta exponerlo en la UI.
- Dónde se inicia sesión / credenciales que dan acceso a un recurso → `credentials.login_url` + FKs a `domain_id/hosting_account_id/email_account_id/project_id`.
- Registrar cada visualización de una credencial → `credential_access_logs` ya es append-only, con usuario, IP, user-agent y acción.
- **Coste interno vs. precio al cliente** → el patrón ya existe, pero solo en `client_services` (`unit_price` vs `supplier_cost`).
- Roles y RLS por tabla → ya aplicado de forma genérica a las tablas de infraestructura y a `credentials`.

---

## 3. Qué casos no están cubiertos

- **Proveedor como entidad normalizada.** `registrar_name` / `provider_name` es texto libre y repetido en tres tablas sin normalizar (riesgo: "GoDaddy" vs "Godaddy" vs "godaddy.com").
- **Cuenta de proveedor.** "Con qué cuenta se administra" no existe como concepto: no hay forma de decir "estos 5 dominios de distintos clientes se gestionan desde esta misma cuenta reseller".
- **Hosting compartido.** `hosting_accounts.project_id` es 1:1 nullable → una cuenta de hosting no puede representar varios sitios/proyectos sin duplicar proveedor/coste/renovación en varias filas. No hay flag `is_shared` ni forma de listar "qué sitios viven en esta cuenta".
- **Website / CMS como entidad propia.** No existe dónde guardar "usa WordPress 6.x, la URL de admin es X" de forma estructurada; hoy solo cabría en `notes` de una credencial genérica.
- **Cifrado real de secretos.** `secret_reference` es un puntero de texto a un vault externo, no un secreto cifrado en la propia base. No hay función de cifrado/descifrado, ni "acción de revelar", ni distinción entre metadatos (visibles) y secreto (oculto por defecto). Es la brecha más importante frente al requisito de seguridad.
- **Coste interno en infraestructura.** `domains`, `hosting_accounts` y `email_services` solo tienen `renewal_price` (ambiguo: ¿coste que pagamos o precio que cobramos?). El patrón coste/precio de `client_services` no se replica aquí.
- **Vínculo credencial ↔ cuenta de proveedor.** No existe `provider_account_id` en `credentials`.
- **Vista consolidada por cliente.** No existe una vista tipo `v_client_infrastructure` que agregue dominios + hosting + correo + CMS + credenciales de un cliente en un solo lugar.
- **UI de buzones.** El módulo "Correos" actual (build anterior) solo cubre `email_services` (el contrato); no hay CRUD de `email_accounts` (los buzones individuales) todavía.

---

## 4. Modelo de datos propuesto

Principio: **reutilizar antes que crear**. Se añaden 4 tablas nuevas (las mínimas para separar proveedor / cuenta / recurso / hosting compartido / CMS) y columnas puntuales sobre tablas existentes. `email_accounts` se reutiliza tal cual para buzones, sin tabla nueva.

**`providers`** (nueva) — catálogo normalizado.
`id, organization_id, name, category (registrar|hosting|email|cms|other), website, support_url, notes, created_at, updated_at, deleted_at`.

**`provider_accounts`** (nueva) — "la cuenta desde la que se administra".
`id, organization_id, provider_id → providers, label, account_reference (texto no sensible, ej. nº de cuenta), notes, created_at, updated_at, deleted_at`.
La credencial real de acceso a esta cuenta se referencia desde `credentials.provider_account_id` (dirección "muchas credenciales, ej. tras una rotación, apuntan a una cuenta"), no al revés.

**`hosting_sites`** (nueva, solo para resolver hosting compartido) — un sitio dentro de una cuenta de hosting.
`id, organization_id, hosting_account_id → hosting_accounts NOT NULL, client_id → clients NOT NULL, project_id nullable, domain_id nullable, site_label, document_root, is_primary boolean, notes, created_at, updated_at, deleted_at`.

**`website_installations`** (nueva) — el CMS de una web.
`id, organization_id, client_id NOT NULL, project_id nullable, domain_id nullable, hosting_site_id nullable, cms_type (wordpress|shopify|custom|other), cms_version nullable, admin_url, notes, created_at, updated_at, deleted_at`.
El acceso se referencia desde `credentials.website_installation_id`.

**Columnas nuevas sobre tablas existentes:**

| Tabla | Columna nueva | Motivo |
|---|---|---|
| `domains` | `provider_account_id → provider_accounts` (nullable), `internal_cost numeric(12,2)` | vincular a la cuenta real; separar coste/precio |
| `hosting_accounts` | `provider_account_id`, `internal_cost`, `is_shared boolean default false` | ídem + flag exclusivo/compartido |
| `email_services` | `provider_account_id`, `internal_cost` | ídem |
| `credentials` | `provider_account_id`, `website_installation_id`, `secret_ciphertext bytea` | vínculos nuevos + secreto cifrado real |

`renewal_price` existente se mantiene como el precio relevante para el cliente (así se usa ya en los formularios actuales); `internal_cost` es el dato nuevo, nullable, que falta.

**Cifrado de credenciales (satisface los 8 requisitos de seguridad literalmente):**

- `credentials.secret_ciphertext bytea` — cifrado con `pgcrypto` (`pgp_sym_encrypt`), ya habilitado.
- Clave simétrica guardada en Supabase Vault (no en variables de entorno de Next.js, no en `admin.ts`).
- Función `reveal_credential_secret(p_credential_id uuid) returns text`, `security definer`, `search_path` fijo, que: (1) comprueba `has_organization_role(org_id, '{owner,admin,manager}')`, (2) descifra con la clave de Vault, (3) inserta la fila en `credential_access_logs` (`action = 'view'`) en la misma transacción, (4) devuelve el texto plano.
- Se invoca **desde una Server Action de Next.js con el cliente `authenticated` normal (`server.ts`), nunca con `admin.ts`**. El `security definer` de la función — que corre dentro de Postgres, no en el navegador ni con la service role de la app — es el único punto que toca la clave; esto es compatible con "no utilizar la service role en operaciones normales" porque esa regla aplica a la capa de aplicación, no a una función SQL restringida por rol.
- Vista `v_credentials_safe` (sin `secret_ciphertext`) para los listados por defecto — así el secreto nunca viaja en el listado inicial ni en el HTML inicial, solo se pide bajo demanda.
- El botón "Revelar" en la UI es la única vía de acceso; sin clic, no hay llamada ni al RPC ni al log.

---

## 5. Migraciones necesarias

Una única migración nueva, `0012_infrastructure_inventory.sql`, con este contenido mínimo:

1. `create type provider_category as enum ('registrar','hosting','email','cms','other')`.
2. `create table providers` (+ índice `(organization_id, category)`, trigger `set_updated_at`).
3. `create table provider_accounts` (+ índice `(provider_id)`, trigger).
4. `create table hosting_sites` (+ índices `(hosting_account_id)`, `(client_id)`, trigger).
5. `create table website_installations` (+ índices `(client_id)`, `(domain_id)`, trigger).
6. `alter table domains add column provider_account_id uuid references provider_accounts(id) on delete set null, add column internal_cost numeric(12,2) check (internal_cost >= 0)`.
7. `alter table hosting_accounts add column provider_account_id ..., add column internal_cost ..., add column is_shared boolean not null default false`.
8. `alter table email_services add column provider_account_id ..., add column internal_cost ...`.
9. `alter table credentials add column provider_account_id ..., add column website_installation_id uuid references website_installations(id) on delete set null, add column secret_ciphertext bytea`.
10. `create or replace function reveal_credential_secret(...)` + `create or replace function set_credential_secret(...)` (para cifrar al guardar) — ambas `security definer`.
11. `create view v_credentials_safe with (security_invoker = true) as select ... (sin secret_ciphertext)`.
12. `create view v_client_infrastructure` — agregación opcional por cliente (recuento y coste de dominios/hosting/correo/CMS).
13. Añadir `providers`, `provider_accounts`, `hosting_sites`, `website_installations` al bloque `enable row level security` y al bucle genérico de políticas de `0010` (mismo patrón `select/insert/update/delete` por rol; `provider_accounts` restringido como mínimo a `owner/admin/manager`, igual que `credentials`).
14. Índices sobre las nuevas FKs (`credentials.provider_account_id`, `credentials.website_installation_id`, etc.).

No se toca ninguna tabla existente de forma destructiva; todos los cambios son `ADD COLUMN` nullable o tablas nuevas. Cero pérdida de datos, cero downtime esperado.

---

## 6. Impacto en las páginas existentes

- **Dominios**: añadir selector "Cuenta de proveedor" y campo "Coste interno" al formulario; mostrar credenciales vinculadas (ya consultable, falta pintarlo).
- **Hosting**: añadir selector de cuenta de proveedor, "Coste interno", toggle "¿Compartido?"; si `is_shared = true`, nueva sub-tabla de `hosting_sites` bajo el detalle de la cuenta.
- **Correos**: hoy el módulo solo cubre `email_services` (el contrato). Hay que **añadir CRUD real de `email_accounts`** (buzones) y, por cada buzón, mostrar la credencial vinculada (`credentials.email_account_id`). Añadir "Cuenta de proveedor" y "Coste interno" a `email_services`.
- **Credenciales**: `get-credentials.ts` actualmente selecciona `secret_reference` directamente en el listado — al introducir `secret_ciphertext` debe pasar a usar `v_credentials_safe` (o una lista explícita de columnas que excluya el cifrado) para que el secreto nunca llegue al listado. Añadir selectores de "Cuenta de proveedor" e "Instalación web"; añadir el flujo de "Revelar" (botón → Server Action → RPC → log).
- **Nueva página `/proveedores`**: CRUD de `providers` + `provider_accounts` (patrón similar a Backups: lista de proveedores, cada uno expandible a sus cuentas).
- **Nueva página o sección `/sitios-web`**: CRUD de `website_installations`, probablemente anidada bajo Proyectos o bajo el propio detalle de cliente.
- **Detalle de cliente (`/clientes/[id]`)**: el entregable central del requisito de negocio. Nueva sección/tab "Infraestructura y accesos" que agregue dominios (con proveedor, cuenta, coste, renovación), hosting (con exclusivo/compartido, coste, renovación), correo (proveedor, nº de buzones, direcciones, credencial por buzón), instalaciones web (CMS, URL de admin, credencial) y las credenciales del cliente — alimentada por `v_client_infrastructure` más consultas puntuales.
- **Dashboard**: sin cambios obligatorios; `v_upcoming_renewals` ya une dominios/hosting/correo/client_services y puede ampliarse más adelante si se decide dar fecha de renovación a `website_installations` (no se propone ahora, por minimalismo).

---

## 7. Plan de implementación por fases

1. **Fase A — Esquema base**: `providers`, `provider_accounts`, `hosting_sites`, `website_installations` + FKs + RLS + índices + triggers. Sin UI todavía.
2. **Fase B — Cifrado de credenciales**: `secret_ciphertext`, funciones `reveal_credential_secret`/`set_credential_secret`, vista `v_credentials_safe`, flujo "Revelar" en el módulo Credenciales. Se prioriza justo después del esquema por ser el requisito de seguridad más sensible.
3. **Fase C — Coste interno**: columnas `internal_cost` en `domains`/`hosting_accounts`/`email_services` + campo en los 3 formularios existentes.
4. **Fase D — Cuentas de proveedor**: página `/proveedores` + selectores de `provider_account_id` en Dominios, Hosting, Correos y Credenciales.
5. **Fase E — Buzones**: CRUD completo de `email_accounts` dentro del módulo Correos, con credencial vinculada por buzón.
6. **Fase F — Sitios web / CMS**: entidad y UI de `website_installations`, vinculada a credenciales.
7. **Fase G — Hosting compartido**: UI de `hosting_sites` bajo Hosting cuando `is_shared = true`.
8. **Fase H — Vista consolidada de cliente**: sección "Infraestructura y accesos" en el detalle de cliente, usando `v_client_infrastructure` — es la culminación visible del objetivo de negocio y depende de que las fases anteriores ya tengan datos que agregar.

No se ejecuta ninguna migración ni cambio de código en este turno; queda pendiente de tu aprobación para empezar por la Fase A.
