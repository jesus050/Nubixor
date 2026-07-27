# Auditoría de proyectos en Documentos

Fecha: 2026-07-26

## Alcance

Se revisaron carpetas con código, manifiestos, documentación y modelos de datos
dentro de `Documents`. Se excluyeron dependencias instaladas, archivos `.env`,
copias binarias, fotografías y material que no aporta lógica reutilizable.

El objetivo no es copiar aplicaciones completas, sino rescatar reglas de
negocio probadas y reconstruirlas sobre el modelo multiempresa de MegaSuite.

## Fuentes directamente reutilizables

### Megainventario

**Aporta:** conteo físico por SKU y bodega, cantidad esperada vs. contada,
escaneo, novedades, observaciones, fotografías, historial, ajustes manuales,
exportaciones y rollback.

**Reglas rescatables:**

- SKU + bodega identifica el contexto del conteo.
- Diferencia = cantidad contada − cantidad esperada.
- Estados de resultado: correcto, faltante, sobrante y no esperado.
- Todo ajuste manual necesita motivo y usuario.
- Las fotografías son evidencias, no requisitos para un conteo normal.

**Decisión:** reconstruir el conteo sobre `inventory_balances`,
`inventory_movements` y `audit_events`; no migrar la SQLite ni su contraseña
administrativa compartida.

### MegaMundo Logística

**Aporta:** lotes de recepción, conteo de bodega, ubicaciones, equivalencias de
presentación, cola offline, sincronización por bloques, impresión de etiquetas,
roles de operación y detector de anomalías.

**Reglas rescatables:**

- Separar esperado, recibido/contado y diferencia antes de modificar stock.
- Un faltante, exceso, producto no esperado o desviación alta debe revisarse.
- Una desviación relativa de 20 % o más se considera de severidad alta.
- Los cierres deben ser idempotentes para impedir ajustes duplicados.
- Procesos voluminosos se dividen en bloques y conservan trazabilidad.

**Decisión:** usar estas reglas en conteos físicos y, después, en recepciones de
compras. La integración con WooCommerce queda como adaptador futuro.

### Control de inventario y POS DTF

**Aporta:** pedido de cliente, consumo de materia prima por metros, abono
inicial, saldo pendiente, estados de producción/pago y movimientos de caja.

**Decisión:** reutilizar el patrón pedido → consumo → abono → saldo dentro de
órdenes de producción futuras. No copiar la dependencia de IA ni el estado
guardado únicamente en el navegador.

### Visión Creativa Planner

**Aporta:** aislamiento por workspace, usuarios y permisos, tareas, agenda,
clientes, servicios, cotizaciones, cuentas de cobro, facturas, finanzas,
métricas, archivos, historial y trabajo colaborativo.

**Reglas rescatables:**

- Todo acceso por identificador debe validar pertenencia a la empresa.
- Cotización, factura y pago son documentos separados.
- Los recursos hijos heredan y verifican la propiedad del documento padre.
- Las tareas necesitan historial, responsables y autoguardado seguro.

**Decisión:** su modelo de aislamiento refuerza el encabezado multiempresa
actual. Cartera ya adoptó cliente, factura, conceptos y abonos; Planner se
integrará más adelante como módulo separado.

### Ticketera Libre y Tike Show

**Aporta:** eventos, localidades, reservas atómicas, cupos, tickets con token,
QR, check-in condicional, impresión térmica, caja, reportes y auditoría.

**Reglas rescatables:**

- Reservas con vencimiento e índice único para evitar doble venta.
- Check-in mediante actualización condicional para impedir doble ingreso.
- Emisión idempotente por pedido.
- Tokens aleatorios individuales para descargas.

**Decisión:** mantener Ticketera como dominio independiente y conectarla con
clientes, caja, ventas y auditoría mediante adaptadores cuando el núcleo ERP
esté estable.

### Liquidador

**Aporta:** liquidación de importaciones desde Excel, fórmulas, estilos,
imágenes y validaciones de archivos resultantes.

**Decisión:** rescatar el cálculo de costos adicionales y costo aterrizado para
compras/importaciones. No usar Excel como base de datos operativa.

### Asistencia

**Aporta:** inicio de sesión, marcaciones, administración y exportación.

**Decisión:** candidato para un módulo futuro de talento humano. No forma parte
del núcleo actual de inventario, ventas y finanzas.

## Proyectos de experiencia o canal

Los siguientes proyectos contienen componentes visuales o canales comerciales,
pero no deben mezclarse directamente con la base transaccional:

- Creative Invasion Studio y Creative Invasion Pro: editor creativo, portafolio,
  cotizador y sitio comercial.
- Tema MegaMundo: escaparate WooCommerce y membresías.
- Tema Gilant: catálogo de vestidos.
- Nivel Arquitectura: sitio corporativo, soluciones y proyectos.
- Panadería Sandra: pedidos, administración y chat.
- Diseño Tiketa: tema público y puente visual de Tike Show.
- ABCDanza y Game Danza: aprendizaje y juego.
- Pechebro: sitio visual.

Pueden consumir APIs de MegaSuite en el futuro, pero no son fuentes de verdad
para inventario, cartera o contabilidad.

## Duplicados detectados

- Dos carpetas de ABCDanza.
- Dos copias principales de Creative Invasion Pro.
- Planner y Vision Creativa Planner con estructura muy similar.
- Varias copias/versiones de Ticketera Libre.
- Una carpeta `vision\ creativa` separada de `vision creativa`.

Antes de migrar archivos se debe elegir una versión canónica. Para Ticketera se
tomó como referencia la copia documentada con versión 1.17.3.

## Orden recomendado de integración

1. Completado: conteos físicos, ajustes y transferencias de inventario.
2. Completado: proveedores, órdenes de compra y recepción por lotes.
3. Completado: cuentas por pagar, vencimientos y pagos a proveedores.
4. Costo aterrizado para transporte, aranceles y otros gastos de compra.
5. Completado: usuarios, roles y permisos multiempresa.
6. Completado: caja avanzada y dashboard ejecutivo de flujo.
7. Completado: autenticación, activación/recuperación de cuentas y aplicación
   transversal de permisos.
8. Auditoría consultable.
9. Reportes y exportaciones.
10. Planner.
11. Adaptador de Ticketera.
12. Integraciones WooCommerce y canales comerciales.

## Siguiente fase recomendada

Auditoría consultable y exportaciones. La identidad, recuperación administrada,
sesiones seguras y permisos del servidor ya están organizados. El siguiente
paso es exponer la trazabilidad con filtros por usuario, módulo, acción y fecha;
después se agregan exportaciones y comparación orden–recepción–factura.
