# MegaSuite Platform — núcleo unificado

Esta entrega no intenta pegar cinco proyectos incompatibles. Crea una base común para migrarlos de forma segura.

## Incluido
- API Node.js/Express modular.
- PostgreSQL multiempresa.
- Empresas, sucursales y bodegas.
- Productos con clasificación tributaria independiente de la bodega.
- Historial de cambios tributarios.
- Movimientos y saldos de inventario.
- Compras a proveedores con o sin factura electrónica y marca de documento soporte.
- Auditoría central.
- Docker Compose.

## Inicio
```bash
cp .env.example .env
docker compose up --build
```
API: `http://localhost:4100/api/health`

Para rutas empresariales use:
```text
x-tenant-id: 00000000-0000-0000-0000-000000000001
x-user-id: UUID-del-usuario
```

## Regla central
La bodega identifica ubicación/estado físico. El impuesto de venta pertenece al producto y a la línea histórica de la operación. La forma en que se adquirió el producto se registra en compras, sin alterar automáticamente el tratamiento tributario de venta.
