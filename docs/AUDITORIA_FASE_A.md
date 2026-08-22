# Auditoría Fase A — Nubixor

**Fecha:** 2026-08-22
**Rama auditada:** `codex/nubixor-brand-pack` (base `master`, commit `16f96b7`)
**Alcance:** arquitectura, base de datos, backend, frontend, seguridad multiempresa,
inventario, caja, facturación electrónica, auditoría, respaldos y operación.
**Método:** lectura del código fuente y de las 77 migraciones; ejecución de las
pruebas unitarias. No se modificó código en esta fase.

---

## 0. Resumen ejecutivo

Nubixor **no es un prototipo**. Es un ERP/POS multiempresa con decisiones de
arquitectura correctas y poco frecuentes en proyectos de esta etapa: aislamiento
por empresa aplicado dentro de PostgreSQL, autorización que falla cerrada,
auditoría con cadena de hash e inmutabilidad forzada por la base de datos, y una
cola de facturación electrónica con arrendamiento (`lease`), reintentos y
`SKIP LOCKED`. El descuento de existencias del POS ya es atómico y resiste dos
cajeros vendiendo la última unidad.

El trabajo pendiente **no es reconstruir**: es cerrar un conjunto acotado de
brechas concretas, casi todas de cobertura (algo está bien hecho pero solo en
parte del sistema) y no de diseño.

Los tres hallazgos que más importan:

| # | Hallazgo | Impacto |
|---|----------|---------|
| **C-1** | El aislamiento por fila en PostgreSQL cubre **13 de 128 tablas**. Productos, inventario, ventas, clientes y cajas dependen todavía de que cada consulta escriba su filtro. | Un olvido en cualquier consulta futura filtra datos entre empresas sin que nada lo detecte. |
| **C-2** | El margen bruto suma el IVA. Se calcula `line_total − costo`, pero `line_total` **incluye impuesto** (los precios son IVA incluido). | Todo indicador de margen —dashboard, reportes, rotación, oportunidades— está inflado ~19 %. Las decisiones comerciales que el sistema recomienda parten de un número falso. |
| **C-4** | La venta multiempresa quedó rota por la migración 077: la contabilidad se registra a nombre de la empresa vendedora, pero la conexión declara la empresa activa y la política la rechaza. | No se puede cobrar un producto de otra empresa en una caja compartida; el error que ve el cajero habla de cuentas contables. |
| **C-3** | `POST /api/pos/sales` no tiene idempotencia. La restricción `UNIQUE(checkout_cart_id, company_id, idempotency_key)` no aplica al POS porque `checkout_cart_id` es NULL. | Un doble clic en "Cobrar", un reintento de red o una respuesta perdida crea **dos ventas** y descuenta el inventario dos veces. |

---

## 1. Arquitectura encontrada

**Stack:** Node.js 22 (ESM), Express 4, PostgreSQL, Redis, frontend en JavaScript
puro sin framework ni build. Docker + Caddy para despliegue en Hostinger.
Dependencias de producción: 6 (`express`, `pg`, `helmet`, `cors`, `dotenv`,
`qrcode`). Sin ORM: SQL escrito a mano.

```
src/
  server.js        arranque, apagado ordenado, planificadores
  app.js           cableado Express: 33 routers bajo /api
  config.js        validación de entorno al arrancar (falla si falta lo crítico)
  db.js            pool pg + inyección del alcance de empresa por conexión
  tenant-context.js  AsyncLocalStorage con la empresa activa
  authentication.js  sesiones en BD, scrypt, CSRF de doble envío
  authorization.js   catálogo de permisos, 10 roles base, mapa ruta→permiso
  audit.js         escritura de eventos (la cadena de hash la sella la BD)
  modules/         35 routers de dominio (27.066 líneas)
  electronic-billing/  adaptadores, worker de cola, reintentos
database/migrations/  77 migraciones, 128 tablas, 147 índices
public/          frontend: app-core.js (19.045 líneas), styles.css (19.367)
test/            15 archivos (unitarios + integración con PostgreSQL real)
```

**Flujo de una petición:**
`requestContext` (asigna `requestId`, lee `x-tenant-id`, abre el ámbito
`AsyncLocalStorage`) → `requestLogger` → `express.static` → `requireAuthenticatedSession`
(sesión en BD + CSRF en métodos de escritura) → `authorizeApiRequest`
(resuelve permisos exigidos por la ruta; **null ⇒ 403**) → router de dominio →
`errorHandler` (no expone mensajes en 5xx, devuelve `requestId`).

**Aislamiento por empresa (dos capas):**
1. `db.js` declara `SET LOCAL app.tenant_id` en la transacción de cada consulta.
2. Las políticas RLS de la migración 077 filtran por ese valor, con
   `FORCE ROW LEVEL SECURITY` para que ni el dueño de la tabla las evada.
3. `server.js` verifica al arrancar que el rol de conexión **no** sea superusuario
   ni tenga `BYPASSRLS`, y lo registra como error si lo es.

Esta última comprobación es exactamente lo correcto y casi nadie la hace.

---

## 2. Lo que ya está bien resuelto (no tocar)

Documentado para evitar que una fase posterior lo reescriba por desconocimiento.

- **Autenticación.** `scrypt` N=16384, sesiones con token de 32 bytes almacenado
  solo como SHA-256, expiración, revocación, bloqueo por intentos fallidos,
  cookie `httpOnly` + `SameSite=strict` + `secure` en producción.
- **CSRF.** Doble envío con token hasheado en BD, exigido en todo método que no
  sea GET/HEAD/OPTIONS.
- **Autorización.** Falla cerrada: una ruta sin permisos declarados devuelve 403,
  no pasa. Incluye alcance por sucursal y permisos por bodega
  (`can_view/can_sell/can_receive/can_dispatch/can_adjust`).
- **Auditoría inmutable.** `audit_events` con `previous_hash`/`event_hash`
  encadenados, `audit_chain_heads`, y triggers `audit_events_append_only` que
  **rechazan UPDATE y DELETE en la base de datos**. Requisito 13 satisfecho en su
  parte difícil.
- **Concurrencia de venta.** El descuento es un `UPDATE ... WHERE on_hand −
  reserved >= cantidad`: atómico, sin lectura previa. Dos cajeros vendiendo la
  última unidad ⇒ uno recibe 409 `INSUFFICIENT_STOCK`. **Escenario 1 resuelto.**
- **Cierre de caja.** `FOR UPDATE` sobre la sesión, esperado vs. contado por
  denominaciones, y diferencia ≥ 0,01 exige nota obligatoria. **Escenario 7 resuelto.**
- **Cola de facturación.** `FOR UPDATE ... SKIP LOCKED`, estado `SENDING` con
  recuperación de arrendamiento vencido a los 10 min, `RETRYABLE` con backoff,
  `UNIQUE(billing_account_id, idempotency_key)` y `UNIQUE(sale_id, document_type)`.
  **Escenarios 2 y 8 resueltos.**
- **Transferencias.** Máquina de estados con orden de transferencia
  (`DISPATCHED` → `RECEIVED`), no un movimiento en un solo paso. **Escenario 5 resuelto.**
- **Importación.** `/commit` corre dentro de una transacción y revalida el archivo
  dentro de ella. **Escenario 6 resuelto en integridad** (no en experiencia).
- **Configuración.** `config.js` valida el entorno al arrancar y **rehúsa
  arrancar** en producción sin HTTPS, sin orígenes CORS explícitos o sin los
  secretos del webhook. Ningún secreto hardcodeado; `.env` fuera de git.
- **Inteligencia comercial.** Ya existe `commercial-planning` con clasificación de
  rotación configurable en BD (`commercial_rotation_settings`), cobertura en días,
  velocidad de venta, temporadas, campañas, presupuesto de marketing y bandeja de
  oportunidades. **Los requisitos 5, 6, 7, 9 y 10 están construidos en su mayor parte.**

Pruebas unitarias: **13/13 pasan**. Las de integración exigen PostgreSQL y no se
pudieron ejecutar en esta máquina (sin Docker); CI sí las corre.

---

## 3. Hallazgos por severidad

### CRÍTICO

**C-1 · El aislamiento en PostgreSQL cubre 13 de 128 tablas**
`database/migrations/077_tenant_row_level_security.sql`

Protegidas: `ar_invoices`, `ar_invoice_items`, `ar_payments`, `ap_invoices`,
`ap_payments`, `journal_entries`, `journal_entry_lines`, `cash_movements`,
`cash_count_lines`, `accounting_accounts`, `accounting_periods`,
`accounting_entry_counters`, `accounting_account_mappings`.

Sin proteger, entre otras: `products`, `inventory_balances`, `inventory_movements`,
`sales`, `sale_items`, `customers`, `suppliers`, `purchases`, `cash_sessions`,
`electronic_documents`, `media_assets`, `secure_documents`, `audit_events`.

La propia migración explica la exclusión de ventas y sus pagos (una sesión de caja
compartida guarda ventas de varias empresas), y es una razón legítima. Pero el
resto quedó fuera sin motivo declarado. Hoy el aislamiento de esas tablas depende
por completo de la disciplina de cada consulta.

*Revisé el código actual: no encontré una consulta sin filtro de empresa que
produzca IDOR hoy.* El riesgo no es el presente, es que no hay red de seguridad
para la próxima línea de SQL que se escriba.

**Advertencia para la corrección:** el worker de facturación y los planificadores
corren **sin empresa declarada**. Al extender RLS a `electronic_documents` o
`electronic_document_transmissions` dejarán de ver filas y la cola se detendrá en
silencio. Deben envolverse en `runWithoutTenantIsolation()` *antes* de aplicar las
políticas, y la migración debe llegar acompañada de esa modificación.

**El obstáculo real (descubierto al empezar la corrección):** la caja compartida
lee y escribe legítimamente filas de varias empresas dentro de una misma
petición. `GET /api/pos/shared-catalog` (`pos.js:750`) consulta `products`,
`inventory_balances`, `warehouses`, `customers`, `sales_price_lists`,
`sales_promotions` y `product_images` de todas las empresas que comparten la
caja, autorizadas por la membresía del usuario en cada una. Una política que
filtre por la empresa activa deja ese catálogo vacío.

Es decir: extender RLS a las tablas del núcleo operativo **no es una migración
mecánica**, exige decidir antes cuál es el alcance que declara la conexión. Las
dos opciones se detallan en §9.

---

**C-2 · El margen bruto incluye el IVA**
`src/modules/reports.js:41`, `src/modules/dashboard.js:91`,
`src/modules/commercial-planning.js:299` y `:1126`

Los precios del POS son **IVA incluido**: `src/modules/pos.js:1449` extrae el
impuesto con `lineTotal × tasa / (100 + tasa)`. Es decir, `sale_items.line_total`
ya contiene el impuesto, y `sales.total = subtotal + tax_total`.

Los cuatro cálculos de margen restan el costo del total con impuesto:

```sql
-- reports.js:41
s.total - COALESCE(SUM(si.unit_cost * si.quantity), 0) margin
-- dashboard.js:91 y commercial-planning.js:299
SUM(item.line_total - (item.unit_cost * item.quantity))
```

Un producto que cuesta $100.000 y se vende a $119.000 (IVA 19 % incluido) tiene
margen bruto real **$0** y el sistema reporta **$19.000**. El error escala con el
volumen y contamina: el dashboard ejecutivo, el reporte de rentabilidad, el
`gross_margin_percent` de rotación, el filtro "buen margen" de oportunidades
comerciales y la recomendación *"inventario elevado, buen margen y baja rotación"*.

Es el hallazgo con peor relación daño/esfuerzo del sistema: la corrección es
restar `tax_amount`, y sin ella toda la capa de inteligencia comercial aconseja
sobre datos falsos.

Relacionado: **las devoluciones no se restan del margen** en dashboard ni en
reportes (sí se descuentan las unidades en rotación). Y `margin` no descuenta
`discount_amount` explícitamente —queda implícito en `line_total`, conviene
verificarlo al corregir.

---

**C-3 · La venta del POS no es idempotente**
`src/modules/pos.js:2037` (`POST /sales`) y `:1261` (`POST /sales/grouped`)

`sales` tiene columna `idempotency_key` y la restricción
`sales_checkout_company_idempotency_unique UNIQUE(checkout_cart_id, company_id, idempotency_key)`
(migración 021). Pero:

1. El POS **nunca envía** una clave de idempotencia.
2. Un trigger rellena `idempotency_key` con `'legacy-sale:' || id`, siempre distinta.
3. `checkout_cart_id` es NULL en ventas de POS y en PostgreSQL **los NULL son
   distintos entre sí**, así que la restricción no llega a evaluarse.

La única protección es `elements.completeSaleButton.disabled = true` en
`public/app-core.js:17630`. Eso cubre el doble clic rápido; no cubre el reintento
del usuario tras un timeout, la respuesta perdida, la reconexión del móvil ni una
segunda pestaña. **Escenario 3 sin resolver.**

Consecuencia: dos ventas, doble descuento de inventario, doble asiento en caja y,
si la política es factura electrónica, dos consecutivos DIAN consumidos.

Nota: las **devoluciones sí** son idempotentes (`src/modules/returns.js:69`). El
patrón correcto ya existe en la casa; solo falta aplicarlo a la venta.

---

**C-4 · La venta multiempresa está rota desde la migración 077**
`src/modules/pos.js:1814` · `src/accounting.js:313` · migración 077

Descubierto al preparar la corrección de C-1. En el cobro agrupado, la
contabilidad se registra a nombre de cada **empresa vendedora**:

```js
await postSaleAccounting(client, { tenantId: companyId, ... }); // companyId = vendedora
```

Pero la conexión declara `app.tenant_id` con la empresa **activa** del cajero, y
desde la migración 077 `accounting_accounts`, `accounting_account_mappings`,
`accounting_periods`, `accounting_entry_counters`, `journal_entries` y
`journal_entry_lines` tienen políticas con `FORCE ROW LEVEL SECURITY`.

Cuando la vendedora no es la empresa activa, `mappedAccounts` no ve ninguna
cuenta de esa empresa y la venta muere con un mensaje que despista por completo:
*"Falta configurar una cuenta contable activa para: …"*. La transacción se
revierte entera, así que **no se puede cobrar un producto de otra empresa en una
caja compartida**.

La migración 077 dejó fuera `sales` y sus pagos precisamente por este motivo, y
lo explica en su encabezado; lo que no vio es que la contabilidad de esa misma
venta sí quedó dentro.

*Nota de honestidad:* esto está deducido leyendo la política, el parámetro y la
consulta, no ejecutado — no hay PostgreSQL en la máquina donde se hizo la
auditoría. La corrección incluye una prueba que lo demuestra en CI.

---

### ALTO

**A-1 · Los planificadores se duplican al escalar**
`src/backup-scheduler.js:31`, `src/electronic-billing/retry-scheduler.js:38`

Ambos arrancan dentro del proceso web. Con dos instancias se ejecutan dos veces.
El worker de facturación está protegido por `SKIP LOCKED`, pero **el respaldo no**:
dos `pg_dump` simultáneos compitiendo por disco y ancho de banda. Se resuelve con
`pg_try_advisory_lock` alrededor de cada ejecución.

**A-2 · El Kardex no registra saldo anterior ni resultante**
`inventory_movements` (migración 001)

Columnas actuales: `tenant_id, company_id, product_id, warehouse_id, movement_type,
quantity, unit_cost, reference_type, reference_id, reason, created_by, created_at`.

Faltan, respecto al requisito 4: **cantidad anterior**, **cantidad resultante**,
`branch_id` (hoy se deduce por la bodega) y `sale_id`/documento como referencia
tipada. Sin saldo anterior/posterior no se puede reconstruir el Kardex ni detectar
una divergencia entre el acumulado de movimientos y `inventory_balances`.

**A-3 · `inventory_balances.on_hand` admite negativos a nivel de esquema**

No hay `CHECK (on_hand >= 0)`. La venta sí lo impide por consulta y el ajuste en
`inventory.js:1388` también, pero es una regla repetida en cada ruta en vez de una
garantía de la base. Cualquier ruta nueva puede dejar inventario negativo.

**A-4 · Limitación de tasa insuficiente y no distribuida**
`src/middleware/rate-limiter.js`

Estado en un `Map` del proceso: con dos instancias el límite se duplica y un
reinicio lo borra. Solo se aplica en `auth` y `media`; el resto de la API —POS,
reportes, importación— no tiene ninguna. Redis está desplegado pero **solo se usa
para el chequeo de salud** (`src/redis.js` reimplementa el protocolo RESP a mano
únicamente para hacer PING).

**A-5 · Sin paginación en la API**

De 674 `SELECT` en `src/modules/`, 92 tienen `LIMIT`. El módulo de reportes sí
pagina (`page`/`pageSize` con `COUNT(*) OVER()`), y es el modelo a seguir; el
resto de la API no. Casos concretos: la consulta de rotación de
`commercial-planning.js:231` devuelve **todo el catálogo** sin límite;
`logistics.js:144` tiene un `LIMIT 100` fijo que silenciosamente oculta datos.
Con un año de operación, inventario, movimientos y auditoría se degradan.

**A-6 · El inicio de sesión no queda auditado**
`src/modules/auth.js` no llama a `writeAudit` ni una vez.

El requisito 13 pide registrar inicio de sesión y cambio de contraseña. Además,
`writeAudit()` no acepta **IP** ni **user-agent**, así que ningún evento del
sistema los guarda. La cadena de hash es excelente, pero le faltan dos campos que
son justo los que se piden en una investigación.

---

### MEDIO

- **M-1 · Frontend monolítico.** `app-core.js` 19.045 líneas, `styles.css` 19.367,
  `index.html` 7.454. Sin build ni módulos; el `Cache-Control: no-store` de
  `app.js:104` obliga a descargar ~500 KB en cada carga. Versionado manual con
  `?v=20260821-DASHBOARD-v1`, que hay que recordar cambiar a mano. Cero pruebas
  de frontend.
- **M-2 · Sin linter ni formateador.** `npm run check` solo hace `node --check` de
  tres archivos. El CI no valida estilo. No hay typecheck (proyecto sin tipos).
- **M-3 · Cobertura de pruebas desbalanceada.** 15 archivos para 35 módulos. Los
  dos más grandes, `pos.js` (2.629 líneas) y `audit.js` (2.164), no tienen prueba
  propia. No hay prueba de apertura/cierre de caja con diferencia, ni de
  concurrencia de venta, ni de devolución.
- **M-4 · Documentos protegidos solo por membresía.** `src/modules/secure-assets.js`
  verifica que el usuario pertenezca a la empresa dueña —correcto contra IDOR—
  pero no exige permiso. Cualquier miembro puede leer cualquier documento de su
  empresa, incluidos los de nómina y contabilidad.
- **M-5 · Módulos que mezclan capas.** `pos.js` y `electronic-billing.js` combinan
  rutas, reglas de negocio y SQL en un solo archivo, lo que impide probar la
  lógica sin levantar HTTP.
- **M-6 · Comparación de CSRF no es de tiempo constante.**
  `authentication.js:210` usa `!==` sobre el hash. Riesgo teórico y bajo, pero
  `timingSafeEqual` ya se usa en el mismo archivo para contraseñas.
- **M-7 · Ruido en el repositorio.** ~600 KB de `hostinger-*.json` y
  `tmp/import-legacy-catalog-20260816.sql` en el árbol de trabajo (ignorados por
  git, pero presentes).

---

## 4. Funcionalidad incompleta o ausente (frente a los requisitos 1–28)

Ningún `TODO`, `FIXME` ni módulo simulado en `src/`. **No encontré pantallas
desconectadas:** los 33 routers reciben llamadas desde el frontend (255 llamadas a
`/api/` en `app-core.js`). Lo que falta, falta de verdad, no está a medio hacer.

| Requisito | Estado | Qué falta exactamente |
|---|---|---|
| 4 Kardex | **Parcial** | Saldo anterior/resultante, `branch_id`, `CHECK(on_hand >= 0)` |
| 5 Rotación | **Casi completo** | Clasifica solo por unidades vendidas; la cobertura y los días en inventario se **calculan pero no clasifican**. Falta el estado "producto nuevo" como clase propia y los períodos 7/30/60/90 (hoy un único `analysis_period_days`) |
| 6 Temporadas | **Completo** | — |
| 7 Inteligencia | **Parcial** | Existen baja rotación, exceso y temporada. Faltan **riesgo de agotamiento** (días restantes) y **comparación entre sucursales con transferencia sugerida** |
| 8 Capital inmovilizado | **Ausente** | Ningún cálculo de `stock × costo` agregado por producto/categoría/sucursal |
| 9 Bandeja de oportunidades | **Completo** | Prioridad, campaña, observación, responsable y resolución ya existen |
| 10 Presupuesto marketing | **Completo** | — |
| 11 Dashboard ejecutivo | **Parcial** | `/dashboard/executive`, `/trends` y `/attention` existen. `attention` cubre turnos abiertos, documentos rechazados, stock bajo y cartera vencida; **no** cubre productos sin rotación, diferencias de caja, transferencias sugeridas ni estado del respaldo |
| 15 Importación | **Parcial** | Solo CSV; **sin XLSX**, sin mapeo de columnas, sin importador de clientes/proveedores. Rechaza el archivo completo si una fila falla |
| 16 Onboarding | **Parcial** | `/dashboard/onboarding` calcula el progreso; no existe el asistente guiado de 9 pasos |
| 19 Buscador global | **Ausente** | — |
| 20 Respaldos | **Parcial** | Existen `backup.js`, `verify-backup.js` y `restore-backup.js`. Falta registro de último respaldo/tamaño/duración/estado consultable, y **prueba real de restauración documentada** |
| 21 Panel superadmin | **Ausente** | No existe ningún concepto de administrador de plataforma |
| 24 Offline/PWA | **Ausente por diseño** | Solo hay cola offline de escaneos en logística (`app-core.js:1777`). Ver §6 |
| 25 API e-commerce | **Ausente** | Existe `user_access_tokens` en el esquema, sin rutas públicas ni versionado |
| 27 Observabilidad | **Parcial** | Log estructurado JSON con `requestId` correlacionado. Solo niveles INFO/ERROR (faltan WARN y CRITICAL). Sin métricas ni IDs de correlación de proceso de negocio (venta, factura, importación) |

---

## 5. Verificación de los 8 escenarios exigidos

| # | Escenario | Resultado |
|---|---|---|
| 1 | Dos cajeros venden la última unidad | **Resuelto.** `UPDATE ... WHERE on_hand − reserved >= cantidad`; el segundo recibe 409 |
| 2 | Factus no responde durante una venta | **Resuelto.** La venta se confirma, el documento queda `PENDING` y la cola reintenta |
| 3 | Se pulsa cobrar dos veces | **NO resuelto.** Sin idempotencia de servidor (C-3) |
| 4 | Admin consulta otra empresa cambiando un ID | **Resuelto.** La membresía se valida contra `tenant_users` en cada petición con permisos; RLS refuerza las tablas de dinero |
| 5 | Transferencia falla a mitad | **Resuelto.** Orden de transferencia con estados, dentro de transacción |
| 6 | Importación con 300 filas inválidas | **Resuelto en integridad** (todo o nada). Experiencia mejorable |
| 7 | Cerrar caja con diferencia | **Resuelto.** Exige nota; queda registrada |
| 8 | Worker reiniciado durante el envío | **Resuelto.** Arrendamiento vencido a 10 min → `RETRYABLE` |

Seis de ocho ya se sostienen. El 3 es el único que puede costar dinero hoy.

---

## 6. Nota sobre operación offline (requisito 24)

**Recomendación: no implementarlo todavía, y no es una postergación cómoda.**

El POS actual depende de tres cosas que no existen fuera de línea: el descuento
atómico de `inventory_balances`, el consecutivo DIAN
(`UPDATE billing_resolutions SET current_number = current_number + 1`) y la sesión
de caja. Una cola offline ingenua produciría inventario negativo, consecutivos
duplicados y arqueos irreconciliables —exactamente el daño que este proyecto
quiere evitar.

Lo que sí conviene hacer ahora, y prepara el terreno sin comprometer nada:
resolver C-3 (idempotencia de venta con clave generada en el cliente). Es el
mismo mecanismo que después permite reenviar una venta encolada sin duplicarla.
Cuando exista, la discusión de offline se puede retomar con base.

---

## 7. Prioridades propuestas

Ordenadas por daño evitado sobre esfuerzo, no por el orden de las fases del brief.

**Fase B — Seguridad e integridad inmediata**
1. **C-3** Idempotencia de venta (`Idempotency-Key` + índice único parcial). Migración + POS + frontend.
2. **C-2** Corregir el margen en los cuatro puntos y restar devoluciones.
3. **C-1** Extender RLS por tandas, empezando por `products`, `inventory_balances`,
   `inventory_movements`, `customers`, `suppliers`, `audit_events`; envolver antes
   los workers en `runWithoutTenantIsolation()`.
4. **A-6** Auditar inicio de sesión, cambio de contraseña y roles; añadir IP y
   user-agent a `writeAudit`.

**Fase C — Integridad operativa**
5. **A-2/A-3** Kardex con saldo anterior/resultante + `CHECK(on_hand >= 0)` + prueba de conciliación.
6. **A-1** `pg_try_advisory_lock` en ambos planificadores.
7. **M-3** Pruebas de las operaciones que mueven dinero: concurrencia de venta,
   devolución, cierre de caja con diferencia, idempotencia.

**Fase D — Operación**
8. **A-4** Limitación de tasa sobre Redis + límite global por empresa.
9. **A-5** Paginación por cursor en inventario, auditoría, ventas y rotación.
10. **20** Registro de estado de respaldos y prueba real de restauración documentada.

**Fase E — Inteligencia (sobre base ya construida)**
11. Capital inmovilizado (requisito 8).
12. Riesgo de agotamiento y transferencia sugerida entre sucursales (requisito 7).
13. Rotación multi-período (7/30/60/90) y clasificación por cobertura, no solo por unidades.
14. Tarjetas faltantes de "Necesitan tu atención".

**Fase F — UX y rendimiento**
15. Buscador global (Cmd/Ctrl + K).
16. División del frontend por dominio con carga diferida y caché por hash.
17. Atajos de teclado del POS.
18. Panel superadmin y Nubixor Health.

---

## 8. Lo que esta auditoría no cubrió

Para que no se lea como una garantía que no es:

- **No se ejecutaron las pruebas de integración** (sin PostgreSQL en esta máquina).
  Solo las 13 unitarias, que pasan.
- **No se hicieron pruebas dinámicas de penetración.** El análisis de IDOR es por
  lectura de código, no por explotación real contra un entorno desplegado.
- **No se revisó el rendimiento con datos reales.** No hay `EXPLAIN ANALYZE`
  contra un volumen representativo; los hallazgos de rendimiento son estructurales
  (ausencia de paginación, N+1 en bucles de escritura), no medidos.
- **No se auditaron en profundidad** nómina, contabilidad NIIF ni conciliación
  bancaria, por indicación explícita del requisito 29.

---

## 9. Decisión pendiente: alcance del aislamiento en PostgreSQL (C-1)

Extender las políticas al núcleo operativo choca con el modelo multiempresa de
la caja compartida. Hoy la conexión declara **una** empresa (`app.tenant_id`),
pero una petición legítima toca varias. Hay dos formas de resolverlo y la
elección cambia la garantía de seguridad que ofrece el sistema.

**Opción A — Alcance por conjunto de empresas.**
La conexión declara la lista de empresas que la petición puede tocar (la activa
más las que comparten la caja), y las políticas usan `tenant_id = ANY(...)`. El
middleware calcula ese conjunto a partir de `cash_register_companies` y la
membresía del usuario.
*A favor:* la garantía sigue siendo estricta y explícita — lo que no está en la
lista no existe para esa petición.
*En contra:* hay que decidir en cada ruta qué empresas entran; una ruta que
olvide declararlas se rompe (falla cerrada, que es el lado correcto del error,
pero se nota en producción).

**Opción B — Alcance por membresía del usuario.**
La conexión declara el usuario, y la política admite las filas de cualquier
empresa donde ese usuario tenga membresía activa.
*A favor:* nada que declarar por ruta; el catálogo compartido funciona solo.
*En contra:* la garantía baja de "solo la empresa activa" a "cualquier empresa
del usuario". Sigue bloqueando la fuga hacia empresas ajenas —que es el riesgo
real— pero no separa entre las empresas del propio usuario. Además añade un
`EXISTS` sobre `tenant_users` a cada fila evaluada.

**Recomendación: opción A**, aplicada por tandas y empezando por las tablas que
no participan del catálogo compartido (`purchases`, `business_expenses`,
`payroll_*`, `inventory_counts`, `inventory_lots`, `inventory_reservations`),
donde el alcance es siempre la empresa activa y el riesgo de romper algo es
nulo. Las tablas del catálogo compartido —`products`, `inventory_balances`,
`customers`, `warehouses`, `sales`, `sale_items`— entran después, ya con el
conjunto de empresas declarado en el middleware y con la venta multiempresa
cubierta por pruebas.

Mientras tanto, `withDeclaredTenant()` (`src/db.js`) resuelve el caso puntual de
escribir a nombre de otra empresa dentro de una transacción, y es la pieza que
la opción A reutiliza.
