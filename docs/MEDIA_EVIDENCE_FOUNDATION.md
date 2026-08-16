# Sistema de medios y evidencias — Fase 1

Esta fase crea la base segura para imágenes comerciales y evidencias operativas sin reemplazar todavía el flujo histórico de `product_images`.

## Qué queda implementado

- Modelo general `media_assets` para metadatos de archivos.
- Modelo `media_links` para asociar archivos a productos, variantes y procesos operativos.
- Política inicial `inventory_evidence_policies` por empresa.
- Proveedor abstracto `StorageProvider`.
- Proveedor local `LocalStorageProvider`.
- Clase preparada `S3CompatibleStorageProvider`.
- Validación de imágenes JPG, PNG y WEBP por firma real.
- Cálculo SHA-256.
- Lectura básica de dimensiones para JPG, PNG y WEBP.
- Soft-delete de archivos.
- Auditoría para:
  - carga de archivo;
  - asociación comercial/evidencia;
  - eliminación de relación;
  - eliminación lógica de archivo.
- Endpoints `/api/media`.
- Permisos base:
  - `media.upload`
  - `media.delete`
  - `product.image.manage`
  - `inventory.evidence.view`
  - `inventory.evidence.upload`
  - `inventory.adjustment.approve`
  - `inventory.count.perform`
  - `inventory.count.recount`
  - `inventory.count.view_expected_stock`

## Endpoints

Todos requieren sesión, empresa activa y permisos.

### `GET /api/media/policy`

Devuelve la política de evidencias de inventario para la empresa activa.

### `POST /api/media/assets`

Carga una imagen como medio privado.

Payload inicial:

```json
{
  "fileName": "producto.png",
  "description": "Foto tomada en recepción",
  "dataUrl": "data:image/png;base64,..."
}
```

Respuesta incluye:

- `id`
- `mimeType`
- `sizeBytes`
- `width`
- `height`
- `sha256`
- `url`

### `GET /api/media/assets/:id/content`

Sirve el archivo protegido filtrando por empresa activa.

### `POST /api/media/links`

Asocia un medio a una entidad.

Ejemplo imagen principal:

```json
{
  "mediaId": "...",
  "entityType": "PRODUCT",
  "entityId": "...",
  "purpose": "PRIMARY_IMAGE",
  "isPrimary": true
}
```

Ejemplo evidencia:

```json
{
  "mediaId": "...",
  "entityType": "INVENTORY_COUNT_LINE",
  "entityId": "...",
  "purpose": "COUNT_EVIDENCE",
  "note": "Diferencia encontrada durante conteo"
}
```

### `GET /api/media/links?entityType=PRODUCT&entityId=...`

Lista imágenes/evidencias asociadas a una entidad.

### `DELETE /api/media/links/:id`

Retira una relación con auditoría.

### `DELETE /api/media/assets/:id`

Marca el archivo como eliminado mediante `deleted_at`. No borra físicamente el archivo en esta fase.

## Decisiones de seguridad

- No se acepta `company_id` desde frontend.
- Toda consulta filtra por `req.context.tenantId`.
- Los archivos privados se sirven solo desde `/api/media/assets/:id/content`.
- No se exponen rutas físicas.
- El proveedor local valida path traversal.
- MIME sniffing básico por firma real.
- Límite de tamaño configurable.
- Rate limit básico para carga.
- `media_links` tiene llave compuesta para impedir asociación cruzada entre empresas.

## Variables nuevas

```env
MEDIA_STORAGE_PROVIDER=local
MEDIA_MAX_UPLOAD_MB=15
MEDIA_MAX_WIDTH=2000
MEDIA_THUMB_WIDTH=400
```

Nota: mientras el upload use JSON `dataUrl`, `JSON_BODY_LIMIT` puede ser el límite práctico. En Fase 2 se recomienda mover carga grande a `multipart/form-data` o subida directa firmada.

## Pendiente para Fase 2

- Pestaña independiente de evidencias por proceso operativo.
- La fotografía principal del catálogo ya se guarda mediante `media_assets` y
  `media_links`; Catálogo y Caja la priorizan sin romper las imágenes históricas.
- El diálogo de imagen incluye **Usar cámara** como mejora progresiva: en móvil
  solicita la cámara trasera y si no está disponible conserva el selector de archivo.
- Galería comercial de producto: fotos adicionales, cambio de foto principal y
  retiro de una relación sin borrar el archivo de auditoría.
- Foto específica para una variante desde “Administrar colores”. Si no existe,
  el punto de venta sigue usando la fotografía del producto principal.
- Drag & drop.
- Escáner de código de barras/QR.
- Generación real de thumbnails/optimización con librería dedicada.
- Conversión HEIC si se instala pipeline seguro.
- Migración gradual desde `product_images` a `media_assets`.
- Integración visual en recepción, conteos, ajustes, traslados y devoluciones.

## Rollback

Como esta fase no reemplaza tablas existentes:

1. No ejecutar la migración `073_media_assets_and_links.sql`, o revertirla antes de usar datos reales.
2. Retirar montaje `/api/media` en `src/app.js`.
3. Retirar permisos agregados si no se van a usar.
4. Borrar archivos físicos solo si no hay referencias operativas que conservar.
