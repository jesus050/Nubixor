# Puesta en producción de Nubixor

## Condiciones obligatorias

1. Definir un dominio exclusivo y apuntar sus registros DNS al servidor.
2. Desplegar con `docker-compose.production.yml`; Caddy obtiene y renueva TLS.
3. Configurar contraseñas y claves distintas, extensas y fuera del repositorio.
4. Mantener PostgreSQL y Redis sin puertos públicos.
5. Conectar un webhook HTTPS de correo para recuperación de contraseña.
6. Conectar el proveedor de facturación en ambiente de pruebas antes de producción.
7. Validar el perfil tributario y el RUT de cada empresa por separado.
8. Ejecutar y restaurar una copia de seguridad de prueba antes de abrir ventas.

## Variables mínimas

- `APP_DOMAIN`
- `POSTGRES_PASSWORD`
- `BACKUP_ENCRYPTION_KEY` de 32 bytes
- `ELECTRONIC_BILLING_ENCRYPTION_KEY`
- `PASSWORD_RESET_WEBHOOK_URL`
- `PASSWORD_RESET_WEBHOOK_SECRET`

La copia automática incluye PostgreSQL y el almacenamiento privado. Se cifra
con AES-256-GCM, genera SHA-256 y conserva por defecto 30 días.

```sh
docker compose -f docker-compose.production.yml up -d --build
```

## Ensayo de restauración

La restauración debe probarse en una base separada. El comando exige una
confirmación explícita porque reemplaza el contenido de la base destino.

```sh
BACKUP_RESTORE_DATABASE_URL=postgresql://usuario:clave@servidor/base_prueba \
BACKUP_ENCRYPTION_KEY=... \
npm run backup:restore -- /ruta/copia.msbackup --confirm=RESTORE_MEGASUITE
```

## Ventas reales controladas

Realizar primero el ensayo en una sucursal y una caja:

1. Crear un producto de valor bajo con impuesto revisado y existencia conocida.
2. Abrir turno con fondo contado y responsable identificado.
3. Vender una unidad en efectivo y verificar comprobante, caja, inventario,
   asiento contable y auditoría.
4. Repetir con tarjeta y transferencia, registrando referencia y empresa
   receptora.
5. Para la empresa obligada a facturar, usar inicialmente el ambiente de
   pruebas del proveedor y comprobar estado, CUFE, QR, XML y PDF.
6. Ejecutar una devolución o nota crédito y comprobar que no se edite la venta
   original.
7. Cerrar el turno, conciliar banco, revisar balance y descargar el expediente.
8. Pedir al contador que apruebe RUT, impuestos, resolución y flujo contable.
9. Solo entonces cambiar el proveedor electrónico a producción.

No se deben usar ventas ficticias dentro del ambiente fiscal de producción.
Las pruebas que deban llegar al proveedor se coordinan con el contador y el
proveedor tecnológico.

## Archivos protegidos

Las nuevas imágenes y documentos se guardan fuera de `public/`, con nombres
aleatorios, permisos privados, hash SHA-256 y acceso condicionado a una sesión
con membresía en la empresa. Los documentos admitidos son PDF, JPG, PNG y WEBP,
hasta 8 MB. El acceso antiguo `/uploads` está deshabilitado.
