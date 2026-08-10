# Fase 1 — Operación estable y segura

Esta guía define las comprobaciones mínimas antes de operar facturación
electrónica en una empresa real. No contiene contraseñas, tokens ni datos de
clientes.

## Antes de habilitar producción

1. Confirma en **Empresas → Perfil tributario** el RUT, responsabilidades,
   documento de venta y obligación de facturar de cada empresa.
2. En **Facturación → Configuración Factus**, registra las credenciales de la
   empresa en el ambiente correspondiente. Nunca reutilices credenciales entre
   empresas ni copies rangos, códigos de impuestos o municipios de ejemplos.
3. Sincroniza los rangos asociados al software y verifica que haya uno vigente,
   activo y con consecutivos disponibles.
4. Realiza una venta de consumidor final en **TEST** y comprueba: aceptación,
   número asignado por Factus, CUFE, QR oficial DIAN, PDF y XML.
5. Repite la consulta o el reintento controlado y confirma que el
   `reference_code` no genera un segundo documento.
6. Solo después de la revisión del contador, cambia esa empresa a producción.

## Controles automáticos

- El worker revisa documentos pendientes y reintentos; la sincronización de
  rangos se ejecuta periódicamente.
- Las imágenes Docker no se publican desde `master` hasta que GitHub Actions
  instale dependencias bloqueadas, aplique las migraciones en PostgreSQL limpio,
  ejecute las pruebas y revise vulnerabilidades altas de dependencias de
  producción.
- Las copias incluyen PostgreSQL y los documentos privados, se cifran con
  AES-256-GCM y se conservan según `BACKUP_RETENTION_DAYS`.

## Comprobar una copia sin restaurarla

Ejecuta dentro del contenedor de API o en una máquina que tenga la misma
`BACKUP_ENCRYPTION_KEY`:

```sh
npm run backup:verify -- /ruta/a/megasuite-AAAA-MM-DD.msbackup
```

El resultado debe incluir `"verified": true`. Esta comprobación descifra en un
directorio temporal, valida el manifiesto y los hashes, y borra el temporal; no
modifica ni la base de datos ni el almacenamiento.

## Restauración de ensayo

Nunca restaures sobre producción. En una base aislada configura
`BACKUP_RESTORE_DATABASE_URL` y usa la confirmación explícita:

```sh
BACKUP_RESTORE_DATABASE_URL='postgresql://usuario:clave@host:5432/nubixor_restore' \
  npm run backup:restore -- /ruta/a/copia.msbackup --confirm=RESTORE_MEGASUITE
```

Después compara número de empresas, productos, documentos y una muestra de
PDF/XML. Registra la fecha, la persona responsable y el resultado en Auditoría.

## Evidencia mínima de una prueba Factus TEST

Guarda una evidencia sanitizada con fecha, empresa, ambiente, identificador
interno de venta, número Factus, estado, CUFE parcialmente oculto, resultado de
PDF/XML y el resultado de idempotencia. No guardes access tokens, refresh
tokens, client secrets ni información completa de clientes en el repositorio.
