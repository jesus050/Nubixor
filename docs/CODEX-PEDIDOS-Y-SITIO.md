# Instrucciones para Codex — Sitio comercial y control de pedidos

> Documento de trabajo. Dos entregables independientes: puedes hacerlos en cualquier
> orden, pero **no los mezcles en el mismo commit**.

---

## Contexto que debes leer antes de tocar código

| Cosa | Dónde |
|---|---|
| Esquema de pedidos (ya existe) | `database/migrations/039_billing_commercial_workflow.sql` |
| API del flujo comercial | `src/modules/billing-workflow.js` |
| Inventario y saldos | `src/modules/inventory.js` |
| Guard de módulos por empresa | `src/module-gates.js` |
| Sitio comercial nuevo | `site/` |
| Proxy y dominios | `Caddyfile`, `Caddy.Dockerfile` |

**Regla general:** el proyecto es multiempresa. Toda consulta filtra por
`company_id` / `tenant_id`. Cualquier endpoint nuevo que no lo haga es un bug de
seguridad, no un descuido.

---

# PARTE A — Sitio comercial (`nubixor.tech`)

## Estado actual

Ya está construido y verificado. Hay **dos versiones** de la misma página:

- `site/index.html` — versión original (hero oscuro, tarjetas con sombra)
- `site/index-stripe.html` — versión "ledger" (hero claro, hairlines, degradado reservado)

El `Caddyfile` ya tiene el bloque para `{$MARKETING_DOMAIN}` sirviendo `/srv/site`,
y `Caddy.Dockerfile` ya hornea `site/` en la imagen del proxy.
`prod.env` ya define `MARKETING_DOMAIN=nubixor.tech`.

## A.1 — Consolidar una sola versión

**Bloqueado:** esperando que Jesús elija versión. No avances sin esa decisión.

Cuando esté elegida:
1. Renombra la ganadora a `site/index.html`.
2. **Borra la otra.** No dejes las dos en producción.

## A.2 — Reemplazar los datos de ejemplo

Ambos archivos llevan el comentario `⚠️ VALORES DE EJEMPLO`. Antes de publicar:

- **Precios:** los valores `$89.000` / `$189.000` COP los inventó el asistente como
  referencia. Deben reemplazarse por los reales.
- **Correo:** `hola@nubixor.tech` **no existe todavía**. O se crea el buzón, o se
  cambian los tres CTA (`mailto:` en hero, CTA final y footer) por el canal real
  (WhatsApp, Calendly, otro correo).

No publiques con ninguno de los dos pendientes.

## A.3 — Corregir el hover del botón principal

En `site/index-stripe.html`, `.btn-primary::after` aplica `background:#000` con
`opacity:.12` en hover. Sobre el degradado de marca eso **apaga el botón** en vez de
resaltarlo: se ve gris y lavado.

Cámbialo por un realce, no un oscurecimiento. Por ejemplo `filter: brightness(1.08)`
sobre el elemento, o una capa blanca a baja opacidad. Verifica el resultado en hover
antes de darlo por bueno.

## A.4 — Publicar

1. `git push` a `master` → el CI reconstruye `nubixor-proxy:latest`.
2. `npm run deploy`.
3. Verifica que `https://nubixor.tech` responda 200 y que el certificado se emita
   (Caddy lo saca solo al primer arranque; el DNS ya apunta a `72.60.71.198`).
4. Verifica que `https://www.nubixor.tech` redirija con 301.

---

# PARTE B — Control de pedidos

## B.0 — Lo que YA existe (no lo reconstruyas)

Esto es lo más importante de este documento. **El módulo de pedidos está a medio
construir, no vacío.**

Ya existe en `039_billing_commercial_workflow.sql`:

```sql
commercial_sales_documents (
  document_type  IN ('QUOTE','ORDER'),
  status         IN ('DRAFT','SENT','ACCEPTED','CONFIRMED',
                     'READY_TO_INVOICE','CONVERTED','INVOICED',
                     'EXPIRED','CANCELLED'),
  source_document_id  -- enlaza el pedido con la cotización que lo originó
  ...
)
commercial_sales_document_items (quantity, unit_price, tax_rate, line_total, ...)
```

Ya existe en `src/modules/billing-workflow.js`:

- `POST /quotes` — crear cotización
- `POST /quotes/:quoteId/convert-order` — cotización → pedido
- `POST /orders/:orderId/ready-to-invoice` — marcar listo para facturar
- `GET  /overview` — resumen del flujo

Y `inventory_balances` **ya tiene la columna `reserved`**, que `src/modules/inventory.js`
usa para calcular disponible:

```sql
COALESCE(SUM(GREATEST(ib.on_hand - ib.reserved, 0)), 0) AS available_units
```

## B.1 — Los huecos reales

| # | Hueco | Gravedad |
|---|---|---|
| 1 | **Nadie escribe en `inventory_balances.reserved`.** El flujo de pedidos nunca la toca. | 🔴 Crítico |
| 2 | No se puede crear un pedido directo: sólo convirtiendo una cotización. | 🟠 Alto |
| 3 | No hay listado de pedidos con filtros. Sólo `/overview`. | 🟠 Alto |
| 4 | No se puede editar ni cancelar un pedido. | 🟠 Alto |
| 5 | No hay despacho parcial: los ítems no tienen cantidad entregada. | 🟡 Medio |

El **#1 es el que hace daño hoy**: la columna existe y el inventario la resta del
disponible, pero como nadie la llena, un pedido confirmado no aparta nada. Puedes
comprometer las mismas 10 unidades con tres clientes distintos y el sistema no dice
nada. Es el bug clásico que se descubre el día que no hay con qué despachar.

## B.2 — Reserva de inventario  ← empieza por aquí

**Objetivo:** que confirmar un pedido aparte el stock, y que cancelarlo o facturarlo
lo libere.

### Migración nueva

Tabla de reservas por línea, para poder liberar con precisión y auditar:

```sql
CREATE TABLE commercial_order_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  commercial_document_id UUID NOT NULL
    REFERENCES commercial_sales_documents(id) ON DELETE RESTRICT,
  document_item_id UUID NOT NULL
    REFERENCES commercial_sales_document_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  quantity NUMERIC(18,4) NOT NULL CHECK(quantity > 0),
  released_at TIMESTAMPTZ,
  release_reason TEXT CHECK(release_reason IN ('INVOICED','CANCELLED','EXPIRED','MANUAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_item_id, warehouse_id)
);

CREATE INDEX commercial_order_reservations_active
  ON commercial_order_reservations(company_id, product_id, warehouse_id)
  WHERE released_at IS NULL;
```

### Reglas

- **Al pasar a `CONFIRMED`:** por cada línea, crea la reserva y suma a
  `inventory_balances.reserved`. Todo dentro de **una sola transacción**.
- **Si no hay disponible suficiente** (`on_hand - reserved < cantidad`): rechaza con
  `409` y código `INSUFFICIENT_AVAILABLE_STOCK`, detallando qué producto y cuánto
  falta. No permitas reservas parciales silenciosas.
- **Al facturar** (`INVOICED`): marca `released_at` con motivo `INVOICED` y resta de
  `reserved`. El movimiento real de inventario lo sigue haciendo la facturación —
  no lo dupliques.
- **Al cancelar o expirar:** libera con el motivo correspondiente.
- **Bloqueo:** usa `SELECT ... FOR UPDATE` sobre `inventory_balances` al reservar.
  Dos pedidos simultáneos sobre el mismo producto no pueden pasar los dos.

### Prueba obligatoria

Un test que confirme dos pedidos concurrentes sobre un stock de 10 unidades pidiendo
8 cada uno: uno debe pasar, el otro debe fallar con `409`. Sin ese test no des la
tarea por terminada.

## B.3 — Endpoints faltantes

Todos en `src/modules/billing-workflow.js`, respetando el estilo del archivo
(`asyncHandler`, `AppError`, filtrado por `company_id`).

```
POST   /orders                    Crear pedido directo, sin cotización previa.
                                  Mismo cuerpo que POST /quotes pero sin valid_until
                                  y con expected_date. Nace en DRAFT.

GET    /orders                    Listado paginado. Filtros: status, customer_id,
                                  branch_id, date_from, date_to, search
                                  (por document_number o nombre de cliente).
                                  Ordenado por created_at DESC.

GET    /orders/:orderId           Detalle con ítems, reservas activas y el documento
                                  origen si vino de una cotización.

PATCH  /orders/:orderId           Editar. SÓLO en DRAFT. Si el pedido ya está
                                  CONFIRMED, responde 409 CANNOT_EDIT_CONFIRMED_ORDER.

POST   /orders/:orderId/confirm   DRAFT|ACCEPTED → CONFIRMED. Dispara la reserva (B.2).

POST   /orders/:orderId/cancel    → CANCELLED. Exige `reason` en el cuerpo.
                                  Libera reservas. Prohibido si ya está INVOICED.
```

### Transiciones válidas

Escríbelas como una tabla en el código, no como `if` sueltos:

```
DRAFT            → SENT, CONFIRMED, CANCELLED
SENT             → ACCEPTED, CANCELLED, EXPIRED
ACCEPTED         → CONFIRMED, CANCELLED
CONFIRMED        → READY_TO_INVOICE, CANCELLED
READY_TO_INVOICE → INVOICED, CANCELLED
INVOICED         → (terminal)
CANCELLED        → (terminal)
EXPIRED          → (terminal)
```

Cualquier transición fuera de esa tabla: `409` con código `INVALID_STATUS_TRANSITION`.

## B.4 — Despacho parcial

Sólo cuando B.2 y B.3 estén funcionando. Es la parte menos urgente.

Añade a `commercial_sales_document_items`:

```sql
ALTER TABLE commercial_sales_document_items
  ADD COLUMN delivered_quantity NUMERIC(18,4) NOT NULL DEFAULT 0
    CHECK(delivered_quantity >= 0),
  ADD CONSTRAINT delivered_not_over_ordered
    CHECK(delivered_quantity <= quantity);
```

Y `POST /orders/:orderId/deliveries` que registre una entrega parcial, descuente
inventario real y libere la reserva proporcional. El avance del pedido se **deriva**
de las líneas — no agregues un estado `PARTIALLY_DELIVERED` a la columna `status`,
que ya tiene nueve valores.

## B.5 — Frontend

En `public/index.html` + `public/app-core.js`, siguiendo el patrón de los módulos
existentes (mira cómo está resuelto Compras, que es el flujo más parecido).

- Vista de listado con los filtros de `GET /orders`.
- Detalle con las líneas y **cuánto hay reservado de cada una**.
- Botones de confirmar y cancelar, con el motivo obligatorio en cancelar.
- En el error `INSUFFICIENT_AVAILABLE_STOCK`, muestra qué producto falta y cuánto.
  Ese mensaje es la mitad del valor de la función.

⚠️ `public/index.html` ya pesa 377 KB. No lo engordes más de lo necesario.

## B.6 — Permisos y auditoría

- Registra en `audit_events` las transiciones de estado y las cancelaciones, con
  usuario y motivo. Sigue el patrón de `src/audit.js`.
- Los permisos van por rol, como el resto del sistema. Confirma con Jesús si crear
  un pedido y confirmarlo deben ser permisos separados — **confirmar aparta stock,
  así que probablemente sí**.

---

## Definición de terminado

- [ ] `npm run check` pasa (incluye `node --test`).
- [ ] Test de concurrencia de B.2 incluido y en verde.
- [ ] Ningún endpoint nuevo consulta sin filtrar por `company_id`.
- [ ] Las transiciones inválidas devuelven `409`, no `500`.
- [ ] Migraciones numeradas siguiendo la secuencia de `database/migrations/`.
- [ ] Nada de esto se mezcla con los commits del sitio comercial.

## Orden sugerido

1. **B.2** — la reserva. Es el bug real, y lo demás se apoya en ella.
2. **B.3** — los endpoints.
3. **B.5** — el frontend.
4. **A.2 / A.3 / A.4** — cerrar el sitio cuando Jesús decida versión y datos.
5. **B.4** — despacho parcial, al final.
