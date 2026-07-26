# MegaSuite Platform

Núcleo de un ERP modular y multiempresa construido con Node.js 22, Express,
PostgreSQL y Redis. La Fase 1 estabiliza el entorno, las migraciones, los logs,
el manejo de errores y las rutas de salud. Todavía no incluye frontend ni la
integración de proyectos legados.

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
disponible en `http://localhost:4100`. El modo de desarrollo evita que exista
otra API Docker ocupando el mismo puerto.

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

- `/` describe el servicio y enlaza las rutas de salud.
- `/api/health` es una prueba de vida. Siempre responde sin consultar
  PostgreSQL ni Redis.
- `/api/health/ready` prueba conexiones reales a PostgreSQL y Redis. Responde
  `200` si ambas están disponibles o `503` con el estado de cada dependencia,
  sin detener el proceso.

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

La migración `002_seed.sql` crea una empresa, una sucursal, una bodega y
categorías tributarias de demostración. Para rutas empresariales:

```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id: UUID-del-usuario
```

La bodega representa una ubicación física. El tratamiento tributario pertenece
al producto y a la fotografía histórica de cada operación; no existen bodegas
“con IVA” o “sin IVA”.

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
