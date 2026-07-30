# Plan de cierre operativo de Nubixor

Este plan ordena el trabajo pendiente por riesgo y dependencia. Una fase no se
considera terminada por tener una pantalla: debe cumplir sus criterios de
aceptación, pruebas y evidencia.

## Fase 1 — Dinero, devoluciones y expediente fiscal

### 1.1 Factus por empresa

- Credenciales cifradas y ambiente independiente por empresa.
- Rangos consultados desde la cuenta Factus; nunca copiados de ejemplos.
- Equivalencias validadas para impuestos, municipios, unidades de medida,
  documentos, organizaciones, tributos, medios y formas de pago.
- Factura aceptada con número, CUFE y QR.
- PDF y XML descargados desde Factus y almacenados de forma privada con
  SHA-256, empresa, responsable y fecha.
- Prueba en TEST de contado, crédito, consumidor final, excluido de impuesto,
  rechazo, 429, reintento y contingencia.
- Producción bloqueada hasta registrar revisión del contador.

### 1.2 Devoluciones desde Caja

Flujo obligatorio:

`venta → líneas y cantidades → reembolso → inventario → contabilidad → nota crédito → auditoría`

Criterios:

- No se modifica la venta original.
- No se puede devolver más de lo vendido.
- Se permiten devoluciones parciales sucesivas.
- El reintegro regresa a la ubicación histórica de salida.
- Efectivo genera salida de caja; tarjeta y transferencia exigen referencia.
- Una venta electrónica genera una nota crédito pendiente con causal validada.
- Cada devolución es idempotente y deja asiento y evento de auditoría.
- La devolución de una venta a crédito se habilitará únicamente después de
  implementar el crédito contable sobre cartera.

## Fase 2 — Pruebas integrales y concurrencia

Automatizar escenarios completos sobre PostgreSQL real:

1. Apertura, venta, comprobante, inventario, contabilidad y cierre.
2. Cobro compartido de dos empresas sin mezclar productos, documentos o pagos.
3. Pagos mixtos y transferencias asociadas a la cuenta correcta.
4. Devolución parcial, devolución total y bloqueo por exceso.
5. Compra, recepción parcial, obligación y pago.
6. Importación, conciliación bancaria y bloqueo contable.
7. Factus TEST: aceptación, rechazo, 401, 422, 429, 500 y reintento.
8. Dos cajeros intentando vender las últimas unidades simultáneamente.
9. Copia cifrada, restauración aislada y verificación de hashes.

Cada caso debe comprobar base de datos, respuesta HTTP, auditoría y asiento
contable; no basta con revisar únicamente la interfaz.

## Fase 3 — Inventario especializado

Orden de implementación:

1. Unidades de medida de compra, almacenamiento y venta con factores de
   conversión.
2. Variantes gestionables con SKU y código de barras propios.
3. Lotes con fecha de fabricación y vencimiento.
4. Números de serie únicos y trazabilidad por movimiento.
5. Garantías asociadas a la venta y al número de serie.
6. Etiquetas imprimibles con plantilla, precio y código de barras.

Reglas:

- Los productos simples continúan funcionando sin lote ni serie.
- Un producto con control por lote exige lote en entradas, traslados y ventas.
- Un producto serializado exige una identidad por unidad.
- Ninguna conversión puede crear o destruir existencia.
- La unidad electrónica Factus se deriva de un catálogo validado por empresa.

## Fase 4 — Piloto y paso a producción

- Dominio, HTTPS, secretos y correo de recuperación configurados.
- Copia externa automática y restauración ensayada.
- Venta controlada por empresa y por medio de pago.
- Cierre, conciliación, contabilidad y expediente mensual revisados.
- RUT, responsabilidades, impuestos y resolución aprobados por contador.
- Acta de habilitación firmada antes de cambiar Factus a PRODUCTION.

## Estado

| Área | Estado actual |
|---|---|
| Configuración Factus por empresa | Base disponible; requiere credenciales reales |
| Rangos y equivalencias | API disponible; requiere datos validados de cada cuenta |
| PDF/XML fiscal privado | Implementación base incorporada |
| Devolución de contado | Implementación transaccional incorporada |
| Devolución de venta a crédito | Pendiente del ajuste de cartera |
| Pruebas integrales | Siguiente fase |
| Lotes, series, unidades y garantías | Fase 3 |
| Aprobación tributaria | Requiere contador y datos reales |
