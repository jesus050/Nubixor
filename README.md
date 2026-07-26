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

- `/` abre el centro de operaciones local conectado a la API.
- `/#cartera` abre el módulo de clientes, facturas por cobrar, vencimientos y
  aplicación de abonos.
- `/#cuentas-pagar` abre obligaciones con proveedores, vencimientos y registro
  de pagos parciales o totales.
- `/#usuarios` abre el equipo de la empresa, sus roles, permisos, alcance por
  sucursal y estado de acceso.
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

Abra `http://localhost:4100` después de iniciar la aplicación. También puede
abrir `public/index.html` directamente; en desarrollo consultará la API local
en el puerto 4100.

La interfaz incluye:

- navegación independiente por pestañas y URL para cada área del sistema;
- selector persistente de empresa activa;
- listado, búsqueda y creación de empresas;
- listado, búsqueda y creación de sucursales por empresa;
- listado, búsqueda y creación de bodegas por sucursal;
- inventario consolidado con valor al costo, disponibilidad y alertas de saldo;
- kardex reciente, ajustes manuales justificados y transferencias
  transaccionales entre bodegas;
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
- protección del último propietario y creación automática de la estructura de
  acceso para cada empresa nueva;
- categorías y marcas independientes por empresa;
- listado, búsqueda y creación de productos con costo, precio e impuesto;
- fotografías JPG, PNG o WEBP para productos, con límite de 2 MB;
- apertura y cierre de turnos de caja con registro del efectivo;
- venta rápida con carrito, medios de pago, comprobante y salida transaccional
  de inventario;
- métricas y salud de servicios en vivo;
- resumen financiero en el dashboard con cartera, cuentas por pagar, valor de
  inventario y órdenes de compra abiertas;
- directorio de los 17 módulos previstos con su estado real.

Las rutas de interfaz usan fragmentos locales como `#empresas`, `#inventario`,
`#productos`, `#caja`, `#cuentas-pagar` y `#usuarios`, por lo que pueden
guardarse como favoritos sin configurar rutas adicionales en el servidor.

La fase actual usa al administrador local sembrado para gestionar usuarios.
La autorización del módulo ya se comprueba en el servidor mediante permisos;
el inicio de sesión, recuperación de cuenta y aplicación de permisos a todos
los módulos forman parte de la siguiente fase de fortalecimiento.

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
| `JSON_BODY_LIMIT` | Tamaño máximo del cuerpo JSON |

La aplicación puede arrancar sin `DATABASE_URL` o `REDIS_URL`; la prueba de
vida seguirá funcionando y la ruta de disponibilidad indicará `503`.

## Datos de demostración

Las migraciones de datos de demostración crean una empresa, una sucursal, una
bodega, categorías tributarias y un catálogo pequeño con categorías, marcas y
productos. Para rutas empresariales:

```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id: UUID-del-usuario
```

La bodega representa una ubicación física. El tratamiento tributario pertenece
al producto y a la fotografía histórica de cada operación; no existen bodegas
“con IVA” o “sin IVA”.

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
`x-request-id` para correlación. Autenticación, autorización, rate limiting y
aislamiento multiempresa reforzado pertenecen a fases posteriores y no deben
considerarse resueltos todavía.
