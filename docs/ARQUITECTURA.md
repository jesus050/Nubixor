# Arquitectura objetivo

## Núcleo común
Autenticación, empresas, sucursales, permisos, auditoría, archivos y notificaciones.

## Módulos
1. Catálogo e impuestos.
2. Inventario, conteos y transferencias.
3. Compras, recepción y documento soporte.
4. Ventas, POS y caja.
5. Facturación electrónica mediante proveedor autorizado.
6. Finanzas y contabilidad.
7. Planner/CRM.
8. Ticketing conectado por API.

## Estrategia de migración
- **Vision Creativa Planner:** fuente funcional para equipos, tareas, clientes y finanzas; dividir el servidor monolítico.
- **Megainventario:** migrar conteos, incidencias, evidencias y ajustes a PostgreSQL.
- **Megamundo Logística:** reutilizar flujos de lotes, PWA, Mekano, etiquetas, rotación y WooCommerce como adaptadores.
- **Ticketera Libre:** mantener operativa en WordPress y sincronizar ventas/cajas/clientes; migración posterior.
- **Refrienergy:** no contiene aplicación útil en el ZIP analizado.

## Principios
- Un solo producto por empresa; múltiples ubicaciones.
- Ledger de movimientos, no edición silenciosa de stock.
- Auditoría append-only.
- Configuración por cliente, no forks del código.
- Módulos desacoplados e integraciones mediante API/eventos.
