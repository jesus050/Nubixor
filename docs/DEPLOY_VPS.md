# Despliegue de Nubixor en VPS

Esta guía instala Nubixor con Docker Compose, PostgreSQL, Redis y Caddy. El dominio previsto es `app.nubixor.tech`.

## 1. Preparar DNS

Cree un registro DNS tipo `A` para `app.nubixor.tech` que apunte a la IP pública del VPS. Espere a que el dominio resuelva antes de iniciar Caddy.

## 2. Preparar el servidor

Instale Docker Engine, Docker Compose v2 y Git. Permita tráfico entrante TCP por los puertos 22, 80 y 443. No exponga directamente PostgreSQL, Redis ni el puerto 4100.

## 3. Descargar Nubixor

```bash
git clone https://github.com/jesus050/Nubixor.git
cd Nubixor
```

## 4. Crear las variables privadas

Copie la plantilla y restrinja sus permisos:

```bash
cp .env.example .env
chmod 600 .env
```

Genere secretos directamente en el VPS:

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

Configure como mínimo:

```dotenv
APP_DOMAIN=app.nubixor.tech
POSTGRES_PASSWORD=<contraseña larga exclusiva>
BACKUP_ENCRYPTION_KEY=<secreto generado>
ELECTRONIC_BILLING_ENCRYPTION_KEY=<secreto generado diferente>
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30
```

No envíe este archivo por chat, correo o GitHub. La clave de facturación debe conservarse mientras existan credenciales cifradas con ella.

## 5. Acceso a la imagen privada o pública

El flujo de GitHub Actions publica `ghcr.io/jesus050/nubixor-api:latest` después de validar y fusionar cambios en `master`.

Si el paquete de GHCR es privado, autentique Docker en el VPS con un token de GitHub que tenga permiso `read:packages`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u jesus050 --password-stdin
```

No guarde el token dentro del repositorio.

## 6. Iniciar producción

```bash
docker compose pull
docker compose up -d
docker compose ps
```

La imagen ejecuta las migraciones antes de iniciar la aplicación.

## 7. Verificar

```bash
curl -i https://app.nubixor.tech/api/health
curl -i https://app.nubixor.tech/api/health/ready
docker compose logs --tail=200 api
docker compose logs --tail=100 caddy
```

`/api/health` debe responder aunque una dependencia esté caída. `/api/health/ready` debe responder `200` únicamente cuando PostgreSQL y Redis estén disponibles.

## 8. Actualizar Nubixor

Después de cada publicación exitosa en `master`:

```bash
git pull --ff-only
docker compose pull api
docker compose up -d api
docker image prune -f
```

## 9. Copias y persistencia

Los datos se conservan en volúmenes Docker para PostgreSQL, Redis, archivos y copias cifradas. Un respaldo real también debe copiarse periódicamente a almacenamiento externo al VPS.

Antes de restaurar o migrar, conserve conjuntamente:

- respaldo cifrado;
- `BACKUP_ENCRYPTION_KEY` correspondiente;
- archivos persistentes del volumen de almacenamiento;
- `ELECTRONIC_BILLING_ENCRYPTION_KEY` mientras existan credenciales cifradas.

## 10. Operación segura

- Mantenga `.env` con permisos `600`.
- Use acceso SSH por llave y desactive contraseñas cuando sea posible.
- Actualice periódicamente el sistema operativo y Docker.
- No publique los puertos 5432, 6379 o 4100.
- Pruebe restauraciones de respaldo, no solo su creación.
- Active las credenciales reales de Factus únicamente después de validar el ambiente de pruebas.
