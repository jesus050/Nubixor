# Mapa de migración

| Proyecto legado | Funciones a conservar | Destino |
|---|---|---|
| Megainventario | escaneo, conteo, observaciones, incidencias, exportación, ajustes | inventory-counts |
| Megamundo Logística | lotes, recepción, etiquetas, Mekano, PWA, rotación, WooCommerce | purchasing + logistics + integrations |
| Vision Creativa Planner | usuarios, empresas, clientes, tareas, finanzas, cotizaciones | core + planner + finance |
| Ticketera Libre | eventos, mapas, asientos, QR, POS, caja, reportes | ticketing adapter/API |
| Refrienergy | página predeterminada | no migrar |

## Secuencia segura
1. Congelar esquemas legados y generar respaldos.
2. Importar empresas, usuarios y clientes.
3. Normalizar productos/SKU y deduplicar.
4. Crear bodegas y cargar saldo inicial como movimiento `OPENING_BALANCE`.
5. Migrar compras y soportes.
6. Activar sincronización incremental con WooCommerce/Ticketera.
7. Migrar Planner.
8. Retirar sistemas legados por módulo, no todos a la vez.
