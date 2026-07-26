# Ejemplos

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

## Conteos físicos

```bash
curl http://localhost:4100/api/physical-counts \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'

curl http://localhost:4100/api/physical-counts/summary \
 -H 'x-tenant-id: 00000000-0000-0000-0000-000000000001'
```

El flujo disponible en `/#conteos` es:

1. Crear una jornada y seleccionar la bodega.
2. Iniciar el conteo.
3. Registrar la cantidad encontrada en cada producto.
4. Enviar todas las referencias a revisión.
5. Aprobar el cierre con un motivo.

El cierre compara nuevamente el saldo real con la fotografía inicial. Si hubo
ventas, compras u otros movimientos durante el conteo, se bloquea para evitar
pisar inventario reciente. Cada diferencia aprobada crea un movimiento
`COUNT_ADJUSTMENT` y un evento de auditoría.
