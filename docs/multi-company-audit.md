# Auditoría multiempresa — 2026-08-21

## Modelo encontrado

`tenants` representa hoy la empresa operativa. No hay una entidad de cuenta o grupo
por encima; por lo tanto, este PR conserva `tenant_id` como el aislamiento efectivo
(`company_id` es el nombre usado por los módulos comerciales y fiscales). La ruta
futura para grupos empresariales es añadir `accounts` y una relación
`account_companies`, sin reinterpretar ni mezclar los datos de las empresas actuales.

La jerarquía operativa actual es `tenants → branches → warehouses`. Las membresías
están en `tenant_users(tenant_id, user_id, role_id, role_code, branch_id, status)`;
un mismo usuario puede tener varias filas y, por tanto, diferentes roles por empresa.
Los roles y permisos están aislados por `roles.tenant_id` y `role_permissions.tenant_id`.

## Contexto y autorización actuales

- El cliente guarda `megasuite.activeTenantId` en `localStorage` y envía
  `x-tenant-id` en casi todas las llamadas.
- `requestContext` copiaba ese encabezado directamente a `req.context.tenantId`.
- `requireAnyPermission` sí contrastaba esa empresa con `tenant_users` activo y
  cargaba el rol/permisos; esto evita buena parte del acceso cruzado, pero no era un
  contexto de sesión central ni un cambio de empresa auditable.
- El alcance de sucursal y permisos de bodega se aplican en `requireAnyPermission`,
  pero dependen de que la ruta tenga una política de permisos registrada.

## Datos y restricciones encontrados

Las tablas operativas usan `tenant_id` o `company_id`, incluyendo sucursales,
bodegas, catálogo, inventario, compras, clientes/cartera, CxP, bancos, caja, ventas,
facturación, marketing, medios y auditoría. Las migraciones 021, 048, 069, 072 y 073
añaden claves compuestas y/o restricciones para relaciones especialmente sensibles:
productos–bodega, ventas–empresa, documentos electrónicos–resolución y
medios–empresa.

Tablas globales o de plataforma que no deben recibir un `company_id`: `users`,
`auth_sessions`, `user_access_tokens`, límites/rate limiting y catálogos de permisos.
Las tablas derivadas (por ejemplo líneas de documentos, líneas de movimientos y
pagos) heredan el alcance de su cabecera y deben consultarse mediante ella o con el
predicado de empresa correspondiente.

## Hallazgos de riesgo

1. **Contexto controlado por cliente**: el encabezado elegía la empresa en cada
   solicitud. Aunque la membresía se comprobaba después, no había una fuente de
   verdad en la sesión ni un endpoint seguro de cambio A→B.
2. **Cambio visual de empresa**: el frontend limpiaba varios estados, pero no todos
   de forma centralizada y no sincronizaba el cambio con el backend.
3. **Cobertura de IDOR no demostrada de extremo a extremo**: hay predicados de
   empresa en los módulos, pero faltaban pruebas explícitas de cambio de contexto,
   rol por empresa y rechazo de medios/recursos de otra empresa.
4. **Medios**: la consulta de contenido ya filtra `media_assets.company_id`, pero la
   URL incluía `tenantId` controlado por el navegador. Debe derivarse del contexto de
   sesión, nunca de ese parámetro.
5. **Versionado**: no existe `/api/version`, por lo que no había manera estable de
   comprobar el artefacto desplegado sin inspeccionar infraestructura.

## Factus y facturación

Factus se configura por `electronic_billing_accounts.company_id`; las resoluciones,
documentos y notas también usan `company_id`, con llaves compuestas en las migraciones
multiempresa. No se cambiará el adaptador Factus ni secretos en este PR. Las pruebas
deben garantizar que la empresa activa no pueda seleccionar cuentas, rangos o
documentos de otra empresa.

## Alcance de corrección de este PR

Primero centralizar el contexto de empresa en la sesión autenticada, registrar el
cambio de empresa y hacer que la API derive la empresa desde esa sesión. Mantener una
compatibilidad limitada para clientes existentes durante la transición, pero exigir
membresía activa y rechazar discrepancias. Añadir pruebas de aislamiento para el
contexto, recursos por ID y contenido de medios; los hallazgos adicionales por módulo
se documentarán junto a cada corrección.

## Validación y rollback

`npm test` pasa en esta rama (69 pruebas correctas y 3 integraciones omitidas al no
haber `DATABASE_URL`/`TEST_DATABASE_URL` disponible en el entorno de revisión).
La migración 077 es aditiva: para revertir el cambio de aplicación, se puede volver
al comportamiento anterior sin borrar datos. Solo después de una ventana de
compatibilidad se recomienda retirar `auth_sessions.active_tenant_id` mediante una
migración de rollback explícita.
