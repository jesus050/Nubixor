# Changelog

Todos los cambios relevantes de MegaSuite se documentan en este archivo.

## [Unreleased]

### Añadido

- Centro de operaciones local y responsive servido desde `public/index.html`.
- Resumen con cantidades consultadas desde las APIs reales.
- Estado en vivo de API, PostgreSQL y Redis.
- Navegación móvil, búsqueda de módulos, estados de carga y mensajes de error.
- Compatibilidad al abrir `public/index.html` directamente mediante `file://`
  durante el desarrollo local.

## [0.1.1] - 2026-07-26

### Añadido

- Rutas `GET /`, `GET /api/health` y `GET /api/health/ready`.
- Comprobaciones reales e independientes de PostgreSQL y Redis.
- Validación temprana de variables de entorno.
- Logs JSON de arranque, peticiones, errores, migraciones y apagado.
- Manejo centralizado de errores asíncronos.
- Pruebas automáticas de salud y disponibilidad.
- Servicios Redis y healthchecks en Docker Compose.
- Scripts npm para levantar, esperar y preparar servicios locales.

### Cambiado

- La API de Compose se ejecuta mediante el perfil opcional `full`, evitando
  conflictos con `npm run dev`.
- Las migraciones se serializan mediante un advisory lock de PostgreSQL.
- CORS es configurable, Helmet protege las cabeceras y el servidor se apaga
  ordenadamente.

### Seguridad

- Las credenciales de ejemplo se limitan al desarrollo local.
- Se ignoran archivos `.env`, logs y dependencias.
- Los logs no incluyen cabeceras, cuerpos de petición ni URLs de conexión.

### Validado

- Migraciones e idempotencia sobre PostgreSQL 16.13 real.
- Readiness y resiliencia sobre PostgreSQL 16.13 y Redis 7.2.11 reales.
- Seeds y consultas API de empresas y bodegas.
- Liveness estable durante la pérdida de PostgreSQL.
