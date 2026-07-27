# Caja & POS multiempresa

## Estado

La SUBFASE A implementa el modelo relacional, sus migraciones, las reglas de
integridad y las pruebas iniciales. No implementa todavía:

- el carrito visual multiempresa;
- el endpoint de cobro agrupado;
- la integración real con un proveedor de facturación electrónica;
- reintentos de documentos externos;
- cierre visual desglosado por empresa.

El POS existente conserva su flujo de una sola empresa y sus datos históricos.

## Diagnóstico del modelo anterior

MegaSuite ya aislaba por `tenant_id`:

- empresas, membresías, roles y permisos;
- sucursales y bodegas;
- productos, impuestos, inventario y kardex;
- cajas, turnos, movimientos de efectivo y ventas;
- clientes, cartera y cuentas por pagar;
- auditoría.

La sesión autenticada se resuelve en servidor. En producción, seleccionar un
`x-tenant-id` no otorga acceso: `authorization.js` exige una membresía activa,
un usuario activo y el permiso del módulo.

Antes de la migración, una caja, turno y venta solo podían pertenecer a un
`tenant_id`. No existían:

- empresas autorizadas para una caja física;
- saldos por empresa dentro de un turno compartido;
- un carrito con líneas de vendedores distintos;
- pagos distribuidos entre ventas;
- obligaciones interempresa;
- resoluciones o documentos electrónicos por empresa.

## Convención de empresa

`tenants` sigue siendo la tabla física y canónica de empresas para evitar un
renombrado destructivo. La vista `companies` ofrece el nombre de dominio
solicitado. Todos los nuevos `company_id` referencian `tenants(id)`.

En las tablas antiguas:

- `tenant_id` mantiene el alcance de seguridad y compatibilidad de la API;
- `company_id` identifica la empresa legal de una operación;
- `owner_company_id` identifica al propietario del inventario;
- `seller_company_id` identifica a quien vende y debe documentar el ingreso.

## Relaciones principales

```mermaid
erDiagram
  TENANTS ||--o{ BRANCHES : posee
  TENANTS ||--o{ WAREHOUSES : posee
  TENANTS ||--o{ PRODUCTS : vende
  PRODUCTS }o--|| TENANTS : propietario
  PRODUCTS }o--|| WAREHOUSES : sale_de
  PRODUCTS }o--|| TAX_CATEGORIES : tributa_como

  CASH_REGISTERS ||--o{ CASH_REGISTER_COMPANIES : autoriza
  TENANTS ||--o{ CASH_REGISTER_COMPANIES : participa
  CASH_REGISTERS ||--o{ CHECKOUT_SESSIONS : abre
  USERS ||--o{ CHECKOUT_SESSIONS : opera
  CHECKOUT_SESSIONS ||--o{ CASH_SESSION_COMPANY_BALANCES : separa
  CHECKOUT_SESSIONS ||--o{ CHECKOUT_CARTS : contiene
  CHECKOUT_CARTS ||--o{ CHECKOUT_ITEMS : agrupa

  CHECKOUT_CARTS ||--o{ SALES : genera
  TENANTS ||--o{ SALES : factura
  SALES ||--o{ SALE_ITEMS : contiene
  CHECKOUT_CARTS ||--o{ PAYMENTS : recibe
  PAYMENTS ||--o{ PAYMENT_ALLOCATIONS : distribuye
  SALES ||--o{ PAYMENT_ALLOCATIONS : aplica
  CHECKOUT_CARTS ||--o{ INTERCOMPANY_SETTLEMENTS : compensa

  TENANTS ||--|| COMPANY_TAX_PROFILES : configura
  TENANTS ||--o{ BILLING_RESOLUTIONS : numera
  SALES ||--o{ ELECTRONIC_DOCUMENTS : documenta
  BILLING_RESOLUTIONS ||--o{ ELECTRONIC_DOCUMENTS : asigna
```

## Migraciones

### `021_multi_company_pos_foundation.sql`

1. Crea la vista `companies`.
2. Amplía `products` con propietario, vendedor, bodega, impuesto y estado.
3. Conserva sincronizados `sales_tax_category_id` y `tax_category_id`.
4. Autoriza empresas y bodegas por caja física.
5. Crea sesiones de checkout, saldos por empresa, carritos y líneas.
6. Amplía ventas, líneas, movimientos de inventario y auditoría.
7. Crea perfiles tributarios, cuentas electrónicas, resoluciones y documentos.
8. Crea pagos, asignaciones, obligaciones interempresa y resumen de compra.
9. Añade triggers de compatibilidad para las inserciones del POS actual.

### `022_checkout_membership_guards.sql`

Exige simultáneamente:

- empresa activa en `cash_register_companies`;
- membresía activa del cajero en `tenant_users`;
- usuario activo;
- sesión y carrito pertenecientes a la caja validada.

Una cabecera manipulada no sustituye estas relaciones.

### `023_checkout_payment_scope_guards.sql`

- crea un perfil tributario pendiente para cada empresa nueva;
- exige autorización y membresía de la empresa que recibe el pago;
- impide asignar un pago a una venta de otro checkout;
- impide crear obligaciones entre empresas que no participaron en la compra.

## Constraints e invariantes

- Un producto activo requiere bodega predeterminada.
- La bodega del producto debe pertenecer a su propietario.
- La categoría tributaria debe pertenecer al vendedor.
- Un producto revisado requiere categoría tributaria.
- Las líneas guardan propietario, vendedor, bodega, tasa e impuesto históricos.
- Una línea de checkout solo admite la identidad canónica del producto.
- La empresa vendedora debe estar autorizada para la caja y para el cajero.
- Una línea de venta referencia una venta de la misma empresa vendedora.
- Un documento referencia una venta y resolución de la misma empresa.
- El consecutivo documental es único por empresa, prefijo y número.
- La suma de asignaciones debe coincidir exactamente con el pago.
- La suma asignada a una venta no puede superar su total.
- Una obligación interempresa no puede tener la misma empresa a ambos lados.
- Los carritos y pagos usan claves de idempotencia por su contexto.

Las comprobaciones de sumas se ejecutan con constraints diferidos para permitir
crear el pago y sus asignaciones dentro de una sola transacción PostgreSQL.

## Compatibilidad y backfill

Los registros existentes se migran así:

| Registro | Valor nuevo |
|---|---|
| Producto | propietario y vendedor = `tenant_id` |
| Producto | impuesto = `sales_tax_category_id` |
| Producto | bodega = saldo existente o primera bodega activa |
| Venta | empresa y vendedor = `tenant_id` |
| Venta | documento = `INTERNAL_RECEIPT` |
| Línea de venta | identidad obtenida de venta y producto |
| Movimiento | empresa = propietario del producto |
| Auditoría | empresa = `tenant_id` |

Si un producto no tiene ninguna bodega activa queda inactivo en el nuevo modelo
y debe revisarse manualmente antes de utilizar el futuro checkout multiempresa.
El catálogo anterior no se elimina.

## Riesgos y revisiones manuales

1. `tenant_id` y `company_id` coexistirán durante la transición. El código nuevo
   debe usar la identidad legal y mantener el filtro de seguridad.
2. El turno `cash_sessions` anterior sigue siendo monoempresa. Las subfases B y
   E migrarán la operación al modelo `checkout_sessions`.
3. Los clientes todavía pertenecen a una empresa. Antes del pago global debe
   definirse si se comparte una identidad maestra o se vinculan terceros.
4. Los productos sin bodega quedan inactivos para el flujo nuevo.
5. Los perfiles tributarios se siembran como pendientes de revisión contable.
6. Las credenciales se almacenan cifradas, pero la administración segura de
   llaves se definirá antes de conectar un proveedor real.
7. No hay automatización DIAN en esta subfase.

## Configuración tributaria

MegaSuite no decide automáticamente si una persona natural o jurídica debe
facturar electrónicamente. Una persona natural también puede estar registrada
ante la DIAN. Los campos de `company_tax_profiles` deben configurarse usando el
RUT vigente y validarse con el contador.

El resumen consolidado de compra no reemplaza una factura, documento
equivalente u otro documento tributario configurado.

## Pruebas

Las pruebas unitarias verifican:

- agrupación por `seller_company_id`;
- rechazo de una venta con vendedores mezclados;
- rechazo de alteraciones de empresa, bodega o impuesto;
- suma monetaria estable.

La prueba de integración usa PostgreSQL real y verifica:

- dos empresas autorizadas en una caja;
- rechazo de una tercera empresa;
- membresía activa del cajero;
- carrito con dos vendedores;
- rechazo de identidad manipulada;
- rechazo de bodega de otro propietario;
- ventas y resoluciones separadas;
- rechazo de resolución cruzada;
- pago global con asignación exacta;
- obligación interempresa;
- compatibilidad de inserciones antiguas.

Ejecución:

```bash
npm run migrate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/megasuite \
  npm run test:integration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/megasuite \
  npm run check
```
