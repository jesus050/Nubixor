# Ejemplos

## Autenticación local

En la primera apertura, `GET /api/auth/status` indica
`"setupRequired": true`. La interfaz solicita definir la contraseña del
propietario; no existe una clave predeterminada.

El inicio de sesión crea una cookie `HttpOnly` y devuelve un token CSRF. Las
operaciones de escritura posteriores requieren esa cookie y el encabezado
`x-csrf-token`. Las rutas principales son:

- `GET /api/auth/status`
- `POST /api/auth/bootstrap`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/activate`

La invitación devuelve una sola vez `activationToken`. La interfaz construye
un enlace local para que la persona establezca su contraseña. Un administrador
puede regenerarlo con `POST /api/users/:id/access-link`; el enlace anterior
queda invalidado.

## Salud

```bash
curl http://localhost:4100/
curl http://localhost:4100/api/health
curl -i http://localhost:4100/api/health/ready
```

La prueba de vida no consulta dependencias. La prueba de disponibilidad devuelve
`503` si PostgreSQL o Redis no responden, pero la API continúa en ejecución.

## Crear producto
```bash
curl -X POST http://localhost:4100/api/products \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -d '{"sku":"BOL-001","name":"Bolso escolar","salePrice":100000}'
```

## Clasificar IVA con trazabilidad
```bash
curl -X PATCH http://localhost:4100/api/products/PRODUCT_ID/tax \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -d '{"taxCategoryId":"30000000-0000-0000-0000-000000000001","reason":"Clasificación revisada por contabilidad"}'
```

## Compra a proveedor sin factura electrónica
```json
{
  "supplierId": "...",
  "branchId": "10000000-0000-0000-0000-000000000001",
  "documentType": "SUPPORT_DOCUMENT",
  "electronicInvoice": false,
  "supportDocumentRequired": true
}
```

## Cuentas por cobrar

Todas las rutas de cartera requieren la empresa activa:

```bash
curl http://localhost:4100/api/receivables/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/receivables/invoices \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

El flujo operativo disponible en `/#cartera` es:

1. Registrar un cliente.
2. Crear una factura con uno o más conceptos y fecha de vencimiento.
3. Consultar el saldo y su edad de cartera.
4. Aplicar abonos parciales o el pago total.

La API también expone:

- `POST /api/receivables/customers`
- `POST /api/receivables/invoices`
- `GET /api/receivables/invoices/:id`
- `POST /api/receivables/invoices/:id/payments`

## Inventario

```bash
curl http://localhost:4100/api/inventory/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/inventory/balances \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/inventory/movements?limit=40 \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

Un ajuste puntual usa una cantidad positiva para agregar y negativa para
retirar:

```bash
curl -X POST http://localhost:4100/api/inventory/adjustments \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -d '{"productId":"PRODUCT_ID","warehouseId":"WAREHOUSE_ID","quantity":-2,"reason":"Avería confirmada"}'
```

Una transferencia requiere bodegas distintas y existencia disponible:

```bash
curl -X POST http://localhost:4100/api/inventory/transfers \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -d '{"productId":"PRODUCT_ID","sourceWarehouseId":"ORIGIN_ID","destinationWarehouseId":"DESTINATION_ID","quantity":5,"reason":"Reposición de punto de venta"}'
```

## Compras y recepción

El espacio operativo está disponible en `/#compras`. El flujo recomendado es:

1. Registrar el proveedor y sus condiciones.
2. Emitir una orden con productos, cantidades y costos.
3. Seleccionar la orden cuando llegue mercancía.
4. Registrar una recepción parcial o total en la bodega de la sucursal.
5. Consultar la entrada en Inventario y en el kardex.

```bash
curl http://localhost:4100/api/purchases/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/purchases/suppliers \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/purchases \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

La creación de una orden usa `POST /api/purchases`; la recepción utiliza
`POST /api/purchases/:id/receipts`. Una recepción genera movimientos
`PURCHASE`, incrementa el saldo de la bodega y recalcula el costo promedio.

## Cuentas por pagar

El espacio operativo está disponible en `/#cuentas-pagar`. Una obligación
puede tomar el proveedor y el total de una compra recibida, o registrarse
manualmente cuando no existe una orden previa.

```bash
curl http://localhost:4100/api/payables/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/payables/sources \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/payables/invoices \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

Para registrar una obligación manual:

```bash
curl -X POST http://localhost:4100/api/payables/invoices \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -d '{"supplierId":"SUPPLIER_ID","issueDate":"2026-07-26","dueDate":"2026-08-25","subtotal":500000,"tax":95000,"notes":"Factura del proveedor"}'
```

Un pago se aplica con `POST /api/payables/invoices/:id/payments`, enviando
`amount`, `paymentDate`, `method`, `reference` y `notes`. La API impide pagar
por encima del saldo pendiente y actualiza el estado a `PARTIAL` o `PAID`.

## Usuarios, roles y permisos

El centro está disponible en `/#usuarios`. Las rutas protegidas requieren la
cookie de sesión y la empresa activa:

```bash
curl http://localhost:4100/api/users/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -b cookies.txt

curl http://localhost:4100/api/users/roles \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -b cookies.txt
```

Una invitación usa `POST /api/users/invite` con `fullName`, `email`, `roleId`
y, opcionalmente, `jobTitle`, `phone`, `branchId` y `reason`. La membresía se
actualiza con `PATCH /api/users/:id`.

Los roles personalizados usan `POST /api/users/roles`; sus permisos pueden
actualizarse con `PATCH /api/users/roles/:id`. Los roles base no se editan y la
API impide suspender o degradar al último propietario activo.

## Dashboard ejecutivo y caja

```bash
curl http://localhost:4100/api/dashboard/executive \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/pos/sessions \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

Durante un turno abierto se pueden registrar ingresos, gastos menores y
retiros:

```bash
curl -X POST http://localhost:4100/api/pos/sessions/CASH_SESSION_ID/movements \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -H 'x-csrf-token: CSRF_TOKEN' -b cookies.txt \
 -d '{"movementType":"EXPENSE","category":"Mensajería","amount":18000,"reference":"RC-18","notes":"Entrega urgente a cliente"}'
```

El cierre acepta un conteo por denominaciones. Si el total contado difiere del
efectivo esperado, `notes` es obligatorio:

```bash
curl -X POST http://localhost:4100/api/pos/sessions/CASH_SESSION_ID/close \
 -H 'Content-Type: application/json' \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001' \
 -H 'x-csrf-token: CSRF_TOKEN' -b cookies.txt \
 -d '{"counts":[{"denomination":100000,"quantity":5},{"denomination":50000,"quantity":1}],"notes":"Arqueo confirmado"}'
```

`GET /api/pos/sessions/:id` entrega el detalle consolidado del turno,
movimientos, ventas y denominaciones contadas.

## Conteos físicos programados

```bash
curl http://localhost:4100/api/physical-counts \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/physical-counts/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

El flujo está dentro de la pestaña `Conteo físico` de `/#inventario`. No forma
parte del trabajo diario; se abre cuando se programa una toma física:

1. Crear una jornada y seleccionar la bodega.
2. Iniciar el conteo.
3. Registrar la cantidad encontrada en cada producto.
4. Enviar todas las referencias a revisión.
5. Aprobar el cierre con un motivo.

El cierre compara nuevamente el saldo real con la fotografía inicial. Si hubo
ventas, compras u otros movimientos durante el conteo, se bloquea para evitar
pisar inventario reciente. Cada diferencia aprobada crea un movimiento
`COUNT_ADJUSTMENT` y un evento de auditoría.
