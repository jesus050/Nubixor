# Auditoría técnica — Fase 1

Fecha: 2026-07-26

## Alcance

Se revisaron `package.json`, scripts npm, estructura, servidor, aplicación,
rutas, acceso PostgreSQL, variables de entorno, migraciones, Docker Compose,
manejo de errores, logs, macOS, Hostinger/VPS y seguridad básica. No se inició
el frontend ni la integración de proyectos legados.

## Problemas encontrados

1. Faltaba `GET /`.
2. `GET /api/health` consultaba PostgreSQL y dejaba de ser una prueba de vida.
3. Faltaba `GET /api/health/ready`.
4. Redis no estaba declarado ni verificado.
5. Express 4 no recibía de forma segura los rechazos de los handlers
   asíncronos existentes.
6. La configuración usaba silenciosamente una URL PostgreSQL con credenciales
   locales y no validaba formatos.
7. CORS aceptaba cualquier origen, faltaban cabeceras Helmet y el límite JSON
   era superior al necesario.
8. Los errores imprimían objetos completos y no incorporaban un identificador
   correlacionable.
9. El servidor no implementaba cierre ordenado ni manejo explícito de errores
   fatales del proceso.
10. Las migraciones podían ejecutarse simultáneamente y competir entre sí.
11. Compose no esperaba la disponibilidad de PostgreSQL, no incluía Redis y su
    API ocupaba el mismo puerto que `npm run dev`.
12. El Dockerfile usaba una instalación no reproducible sin lockfile.
13. No existían pruebas, changelog, ignore files ni documentación operativa
    suficiente.
14. La carpeta entregada no era un repositorio Git.
15. En el equipo de auditoría no estaban instalados `node`, `npm`, `docker`,
    PostgreSQL ni Redis en el PATH del sistema.

## Correcciones aplicadas

- Separación de vida y disponibilidad, con comprobaciones reales de PostgreSQL
  y Redis en `/api/health/ready`.
- Configuración validada y dependencias opcionales al arrancar.
- Errores operativos tipados, wrapper asíncrono y middleware central.
- Logs JSON sin cuerpos, cabeceras o URLs de conexión.
- Helmet, CORS configurable, límite JSON y ocultación de Express.
- Apagado ordenado de HTTP y del pool PostgreSQL.
- Advisory lock y transacciones por archivo de migración.
- Compose con PostgreSQL, Redis, healthchecks, persistencia y perfil `full`.
- Instalación Docker reproducible mediante `npm ci`.
- Pruebas con el runner integrado de Node y Supertest.
- Documentación local, Docker, macOS y Hostinger/VPS.
- Repositorio Git local con un commit base anterior a las modificaciones.

## Compatibilidad

### macOS

El código usa APIs estándar de Node 22 y rutas resueltas desde módulos ESM. Los
servicios se ejecutan mediante Docker Desktop, por lo que no dependen de
PostgreSQL o Redis instalados directamente con Homebrew.

### Hostinger

La aplicación Express es compatible con los planes que admiten Node.js 22. Para
PostgreSQL, Redis y Compose completos se recomienda VPS; en hosting administrado
se requieren servicios externos compatibles y variables de entorno.

### VPS

El perfil Compose `full` construye la API después de que PostgreSQL y Redis
estén saludables. Antes de producción aún se requiere proxy HTTPS, gestión de
secretos, firewall, backups, observabilidad y endurecimiento del sistema.

## Validaciones realizadas

- Node.js 22.23.1: sintaxis correcta.
- `npm run check`: 4 pruebas aprobadas, 0 fallidas.
- `npm audit`: 0 vulnerabilidades reportadas.
- Arranque sin dependencias: correcto.
- `GET /`: 200.
- `GET /api/health`: 200 sin dependencias.
- `GET /api/health/ready`: 503 controlado sin dependencias.
- Continuidad después de error PostgreSQL: confirmada.
- Apagado con SIGINT: correcto.
- YAML de Compose: parseo correcto.
- `git diff --check`: sin errores de espacios.
- Navegador integrado: la solicitud `GET /` llegó al servidor y respondió 200,
  pero el cliente bloqueó la visualización de direcciones locales.

## Validaciones pendientes por infraestructura

El equipo usado para esta fase no tiene Docker, PostgreSQL ni Redis instalados.
Por ello quedan por ejecutar en un equipo con Docker:

1. `docker compose up -d`.
2. `npm run services:wait`.
3. `npm run migrate` contra PostgreSQL 16 real.
4. `GET /api/health/ready` esperando 200 con ambos servicios.
5. `docker compose --profile full up -d --build`.
6. Abrir `http://localhost:4100` en un navegador local normal.

Estas validaciones no se consideran aprobadas hasta ejecutarlas.

## Riesgos fuera de Fase 1

- Aún no hay autenticación ni autorización.
- `x-tenant-id` y `x-user-id` son encabezados confiados, no identidades
  verificadas.
- Falta rate limiting.
- El aislamiento multiempresa necesita restricciones y pruebas adicionales.
- La auditoría append-only no está protegida mediante permisos PostgreSQL.
- El modelo modular objetivo y el modelo de datos completo corresponden a
  fases posteriores.
