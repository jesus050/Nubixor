# MegaSuite Platform

Núcleo de un ERP modular y multiempresa construido con Node.js 22, Express,
PostgreSQL y Redis. La Fase 1 estabiliza el entorno, las migraciones, los logs,
el manejo de errores y las rutas de salud. La interfaz local ya ofrece un
centro de operaciones responsive y los primeros flujos reales de empresas,
sucursales y bodegas. La integración de proyectos legados continúa por fases.

## Requisitos

- macOS o Linux
- Node.js 22.x y npm 10 o superior
- Docker Desktop con Docker Compose v2

Compruebe las versiones:

```bash
node --version
npm --version
docker compose version
```

## Inicio local

```bash
cp .env.example .env
docker compose up -d
npm install
npm run migrate
npm run dev
```

`docker compose up -d` inicia PostgreSQL y Redis. La API corre con npm y queda
disponible en `http://localhost:4100`. Esta dirección sirve también la interfaz
local responsive desde `public/index.html`. El modo de desarrollo evita que
exista otra API Docker ocupando el mismo puerto.

Alternativamente, después de `npm install`:

```bash
npm run setup:local
npm run dev
```

El script `setup:local` levanta las dependencias, espera hasta que respondan y
ejecuta las migraciones.

## Verificación

```bash
curl http://localhost:4100/
curl http://localhost:4100/api/health
curl -i http://localhost:4100/api/health/ready
npm test
```

La prueba del modelo de caja multiempresa usa PostgreSQL real. Con los
servicios y migraciones activos:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/megasuite \
  npm run test:integration
```

La prueba trabaja dentro de una transacción y ejecuta `ROLLBACK`; no conserva
empresas, productos, ventas ni pagos de prueba. Si `DATABASE_URL` no está
definida, `npm test` omite únicamente esta prueba de integración.

- `/` abre el centro de operaciones local conectado a la API.
- `/#cartera` abre el módulo de clientes, facturas por cobrar, vencimientos y
  aplicación de abonos.
- `/#cuentas-pagar` abre obligaciones con proveedores, vencimientos y registro
  de pagos parciales o totales.
- `/#usuarios` abre el equipo de la empresa, sus roles, permisos, alcance por
  sucursal y estado de acceso.
- `/#auditoria` abre la bitácora protegida, sus filtros, el detalle de cambios
  y la exportación CSV.
- `/#reportes` abre análisis de ventas, margen, inventario, compras, cartera y
  proveedores con filtros y descarga CSV.
- `/#inventario` abre existencias valorizadas, kardex, ajustes, transferencias
  y la herramienta secundaria de conteo físico.
- `/#conteos` se conserva como enlace compatible y redirige al módulo
  Inventario.
- `/api/health` es una prueba de vida. Siempre responde sin consultar
  PostgreSQL ni Redis.
- `/api/health/ready` prueba conexiones reales a PostgreSQL y Redis. Responde
  `200` si ambas están disponibles o `503` con el estado de cada dependencia,
  sin detener el proceso.

## Interfaz local

Abra `http://localhost:4100` después de iniciar la aplicación. Si abre
`public/index.html` directamente, MegaSuite lo redirige a esa dirección local
para que las cookies seguras de sesión funcionen correctamente.

La interfaz incluye:

- navegación independiente por pestañas y URL para cada área del sistema;
- configuración inicial de contraseña disponible una sola vez y únicamente
  desde el equipo local;
- inicio y cierre de sesión con cookie `HttpOnly`, protección CSRF y sesiones
  revocables de 12 horas o 7 días;
- bloqueo temporal después de cinco intentos fallidos;
- invitaciones activables mediante enlaces personales de un solo uso y 72
  horas de duración;
- recuperación administrada mediante un nuevo enlace que invalida las sesiones
  anteriores;
- selector persistente de empresa activa;
- listado, búsqueda y creación de empresas;
- listado, búsqueda y creación de sucursales por empresa;
- listado, búsqueda y creación de bodegas por sucursal;
- inventario consolidado con valor al costo, disponibilidad y alertas de saldo;
- kardex reciente, ajustes manuales justificados y transferencias
  transaccionales entre bodegas;
- reposición de exhibición con mínimo y máximo por producto, alertas y
  traslado sugerido desde la bodega de abastecimiento;
- conteos físicos dentro de Inventario, visibles únicamente al programar una
  toma física;
- directorio de proveedores con condiciones de facturación y pago;
- órdenes de compra con productos, fechas, costos, impuestos y seguimiento de
  cantidades pendientes;
- recepciones parciales o totales que actualizan inventario, kardex y costo
  promedio de forma transaccional;
- cuentas por pagar originadas en compras recibidas o registradas manualmente,
  con edades de vencimiento e historial de pagos;
- equipo separado por empresa con invitaciones, estados activo/invitado/
  suspendido y alcance opcional por sucursal;
- cinco roles base protegidos, roles personalizados y permisos explícitos por
  operación;
- rol Cajero enfocado exclusivamente en Caja & POS; las consultas técnicas de
  productos y existencias necesarias para cobrar permanecen internas al flujo;
- protección del último propietario y creación automática de la estructura de
  acceso para cada empresa nueva;
- centro de auditoría con resumen de actividad, filtros por responsable,
  módulo, acción y fechas, detalle antes/después y descarga CSV;
- acceso de auditoría restringido a roles con `audit.view` y alcance de empresa
  completa, evitando exponer trazabilidad global a usuarios limitados a una
  sucursal;
- centro de reportes con cinco análisis operativos, filtro por sucursal y
  fechas, búsqueda, paginación y exportación de hasta 5.000 registros;
- permiso `reports.view` para Propietario, Administrador, Operaciones y Auditor,
  respetando automáticamente el alcance de sucursal asignado;
- categorías y marcas independientes por empresa;
- listado, búsqueda y creación de productos con costo, precio e impuesto;
- fotografías JPG, PNG o WEBP para productos, con límite de 2 MB;
- apertura y cierre de turnos de caja con registro del efectivo;
- ingresos, gastos menores y retiros vinculados al turno y al responsable;
- arqueo por denominaciones, efectivo esperado, diferencias justificadas e
  historial de turnos;
- venta rápida con carrito, medios de pago, comprobante y salida transaccional
  de inventario;
- selección y creación rápida de clientes dentro de Caja, con consumidor final
  como opción predeterminada;
- ventas a crédito con vencimiento y generación transaccional de la factura en
  Cuentas por cobrar;
- historial de ventas del turno con consulta de detalle y reimpresión del
  comprobante desde Caja;
- fundamento relacional de caja multiempresa: empresas autorizadas por caja,
  identidad propietaria/vendedora del producto, carrito agrupable por vendedor,
  saldos por empresa, asignaciones de pago, obligaciones interempresa,
  resoluciones y documentos tributarios separados;
- conector de facturación electrónica desacoplado por proveedor, con
  credenciales cifradas, ambientes de prueba/producción, resoluciones,
  cola idempotente y trazabilidad de intentos;
- comprobante POS imprimible;
- métricas y salud de servicios en vivo;
- resumen financiero en el dashboard con cartera, cuentas por pagar, valor de
  inventario y órdenes de compra abiertas;
- pulso ejecutivo con ventas del día y del mes, margen bruto, stock bajo,
  compras pendientes y flujo estimado a 30 días;
- directorio de los 18 módulos previstos con su estado real.

Las rutas de interfaz usan fragmentos locales como `#empresas`, `#inventario`,
`#productos`, `#caja`, `#cuentas-pagar`, `#usuarios`, `#auditoria` y
`#reportes`, por lo que pueden
guardarse como favoritos sin configurar rutas adicionales en el servidor.

La primera apertura solicita crear la contraseña del propietario sembrado
`admin@megasuite.local`; MegaSuite no incluye una contraseña predeterminada.
Después, las empresas visibles se limitan a las membresías del usuario y cada
módulo comprueba en el servidor el permiso; las operaciones que indican una
sucursal también se validan contra el alcance asignado.

Los botones sólo se muestran para operaciones ya conectadas. Los módulos que
aún tienen únicamente modelo o API base se identifican como tales.

En local, las fotografías se guardan en `public/uploads/product-images` y sus
metadatos permanecen en PostgreSQL. Los archivos subidos no se incluyen en Git;
deben formar parte de las copias de seguridad y migrarse a almacenamiento de
objetos antes de un despliegue distribuido.

Para probar que la vida no depende de la base:

```bash
docker compose stop postgres
curl http://localhost:4100/api/health
curl -i http://localhost:4100/api/health/ready
docker compose start postgres
```

## Scripts npm

| Script | Uso |
|---|---|
| `npm run dev` | Inicia la API con recarga de Node |
| `npm start` | Inicia la API sin recarga |
| `npm run migrate` | Aplica migraciones pendientes con bloqueo concurrente |
| `npm run services:up` | Inicia PostgreSQL y Redis |
| `npm run services:wait` | Espera hasta que ambas dependencias respondan |
| `npm run services:down` | Detiene los contenedores sin borrar volúmenes |
| `npm run setup:local` | Prepara servicios y migraciones |
| `npm test` | Ejecuta las pruebas automáticas |
| `npm run test:integration` | Prueba el aislamiento multiempresa sobre PostgreSQL real |
| `npm run check` | Valida sintaxis y ejecuta pruebas |

## Docker completo

Para ejecutar también la API dentro de Docker:

```bash
docker compose --profile full up -d --build
docker compose --profile full ps
docker compose --profile full logs -f api
```

No ejecute al mismo tiempo el perfil `full` y `npm run dev`, porque ambos usan
el puerto 4100.

## Variables de entorno

Copie `.env.example` a `.env`; nunca confirme `.env` en Git.

| Variable | Propósito |
|---|---|
| `NODE_ENV` | `development`, `test` o `production` |
| `PORT` | Puerto HTTP |
| `APP_NAME` | Nombre mostrado por la API |
| `DATABASE_URL` | URL PostgreSQL; no tiene valor secreto por defecto en código |
| `DATABASE_SSL` | Activa TLS para PostgreSQL |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Valida el certificado PostgreSQL |
| `DATABASE_POOL_MAX` | Máximo de conexiones del pool |
| `DATABASE_CONNECT_TIMEOUT_MS` | Tiempo máximo de conexión |
| `REDIS_URL` | URL `redis://` o `rediss://` |
| `CORS_ORIGINS` | Origen o lista separada por comas; use `*` sólo en desarrollo |
| `TRUST_PROXY` | Active detrás de un proxy confiable |
| `ELECTRONIC_BILLING_ENCRYPTION_KEY` | Secreto del servidor para cifrar credenciales del proveedor |
| `JSON_BODY_LIMIT` | Tamaño máximo del cuerpo JSON |

La aplicación puede arrancar sin `DATABASE_URL` o `REDIS_URL`; la prueba de
vida seguirá funcionando y la ruta de disponibilidad indicará `503`.

## Datos de demostración

Las migraciones de datos de demostración crean una empresa, una sucursal, una
bodega, categorías tributarias y un catálogo pequeño con categorías, marcas y
productos. Para rutas empresariales:

```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
Cookie de sesión emitida por /api/auth/login
x-csrf-token: requerido para operaciones de escritura
```

La bodega representa una ubicación física. El tratamiento tributario pertenece
al producto y a la fotografía histórica de cada operación; no existen bodegas
“con IVA” o “sin IVA”.

## Caja multiempresa

Las migraciones `021`, `022` y `023` incorporan la base segura del POS multiempresa
sin cambiar todavía la experiencia visual de cobro. `tenants` sigue siendo la
tabla física de empresas para conservar la API existente; la vista `companies`
y los nuevos campos `company_id`, `owner_company_id` y `seller_company_id`
expresan su función legal.

El POS operativo continúa procesando una empresa activa por venta y toma el
tipo documental desde `company_tax_profiles`. Si la empresa usa factura
electrónica, MegaSuite crea el documento en estado `PENDING`; sólo asigna
numeración cuando encuentra una resolución vigente. La transmisión y la
aceptación real por la DIAN requieren una cuenta de proveedor tecnológico,
credenciales cifradas y resolución reales.

Las migraciones `024`, `025` y `026` dejan dos escenarios locales:

- `MegaSuite Demo`: factura electrónica preparada, pendiente de conexión real.
- `Crative`: comprobante interno, no cobra IVA, caja principal y dos productos
  vendibles configurados al 0%.

La caja principal queda autorizada para mostrar ambos catálogos al mismo
tiempo. Si el carrito contiene productos de las dos empresas, MegaSuite realiza
un único cobro operativo y genera una venta y un comprobante separados para
cada empresa.

El botón `Comprobantes` de Caja & POS abre el archivo de ventas de todos los
negocios autorizados, permite filtrar por empresa o medio de pago y reimprimir
cada documento. Las transferencias exigen indicar la empresa cuya cuenta
recibió el dinero y una referencia; ambos datos quedan disponibles en el
archivo y en la exportación del reporte de ventas.

La migración `028` crea una ubicación `Exhibición principal` para cada negocio.
Inventario muestra por separado las unidades en bodega y en exhibición. La
acción `Mover unidades` registra el traslado con salida y entrada enlazadas, sin
alterar el total del producto; Caja & POS descuenta las ventas desde exhibición.
La migración `029` agrega reglas de reposición por producto: al alcanzar el
mínimo, Inventario calcula cuánto debe trasladarse para recuperar el máximo,
limitado por la existencia real de la bodega. La recomendación no cambia saldos
hasta que el usuario confirma el traslado.

La migración `030` prepara la conexión con un proveedor tecnológico sin
acoplar Caja a una API específica. El módulo Sistema permite configurar el
ambiente, probar el simulador, registrar numeración autorizada y preparar
documentos en una cola auditable. Las credenciales reales sólo pueden guardarse
cuando el servidor define `ELECTRONIC_BILLING_ENCRYPTION_KEY`.

Al registrar una empresa desde la interfaz se crean automáticamente su sucursal,
bodega, caja y los impuestos iniciales. Consulte
[`docs/multi-company-pos.md`](docs/multi-company-pos.md) antes de integrar
facturación o modificar las reglas de inventario.

## Documentación de integración

La revisión de Megainventario, MegaMundo Logística, Vision Creativa Planner,
Ticketera Libre y los demás proyectos con código encontrados en Documentos está
en `docs/AUDITORIA_PROYECTOS_DOCUMENTOS.md`.

## Despliegue

### VPS o Hostinger VPS

Es la opción recomendada para desplegar este conjunto completo con Docker
Compose. Configure secretos distintos a los locales, TLS, un proxy HTTPS,
firewall, copias de seguridad y volúmenes persistentes. Ejecute el perfil
`full` o gestione Node, PostgreSQL y Redis como servicios separados.

### Hostinger administrado

Hostinger admite Express y Node.js 22 en determinados planes Business y Cloud,
pero su entorno administrado y sus bases disponibles dependen del plan. La
aplicación puede desplegarse allí apuntando `DATABASE_URL` y `REDIS_URL` a
servicios externos compatibles; no se debe asumir que Compose o las bases
incluidas en este archivo estarán disponibles. Confirme estas capacidades antes
de contratar o migrar.

Referencias oficiales:

- [Aplicaciones Node.js en Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Plantilla Docker para Hostinger VPS](https://www.hostinger.com/support/8306612-how-to-use-the-docker-vps-template-at-hostinger/)

## Seguridad de esta fase

La API desactiva `X-Powered-By`, aplica Helmet, limita cuerpos JSON, permite
configurar CORS, no registra cuerpos/cabeceras/URLs de conexión y devuelve un
`x-request-id` para correlación. La identidad ya no confía en `x-user-id`:
requiere una sesión persistida, verificación CSRF y permisos por empresa. Aún
quedan para una fase posterior rate limiting distribuido, segundo factor,
recuperación por correo y endurecimiento de producción.
