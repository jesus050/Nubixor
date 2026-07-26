# Ejemplos

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
