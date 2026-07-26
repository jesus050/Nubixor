# Changelog

Todos los cambios relevantes de MegaSuite se documentan en este archivo.

## [Unreleased]

### Añadido

- Módulo separado de Cuentas por pagar con obligaciones originadas en compras
  recibidas o registradas directamente para un proveedor.
- Vencimientos, saldo pendiente, pagos parciales o totales e historial
  auditable por obligación.
- Tablero de pagos por edades: vigente, 1–30, 31–60 y más de 60 días, más el
  valor pagado durante el mes.
- Resumen financiero enlazado desde el dashboard con cartera, cuentas por
  pagar, valor del inventario y órdenes abiertas.
- Módulo separado de Compras con pestañas de órdenes/recepciones y proveedores.
- Directorio de proveedores con documento, contacto, plazo de pago, obligación
  de facturar y condición de facturador electrónico.
- Órdenes de compra numeradas con sucursal, fechas, referencia, productos,
  costos, impuestos y totales calculados.
- Recepciones parciales o totales por bodega, impidiendo recibir más unidades
  de las ordenadas.
- Entradas de inventario y kardex transaccionales por cada recepción, con
  actualización del costo promedio del producto y auditoría.
- Indicadores de órdenes abiertas, unidades pendientes, valor recibido en el
  mes y proveedores activos.
- Centro de Inventario unificado con valoración al costo, unidades disponibles,
  reservas, saldos bajos y movimientos del mes.
- Listado de existencias por producto y bodega con fotografía, búsqueda,
  filtro de ubicación y acceso directo al ajuste.
- Kardex reciente con tipo, producto, bodega, fecha y cantidad firmada.
- Ajustes manuales con motivo obligatorio, validación de pertenencia
  multiempresa y protección de existencias reservadas.
- Transferencias transaccionales entre bodegas mediante movimientos enlazados
  de salida y entrada, sin alterar el total de la empresa.
- Conteo físico reorganizado como pestaña secundaria de Inventario para
  utilizarlo solamente cuando se programe una toma física.
- Rutas relativas para CSS y JavaScript, permitiendo abrir `public/index.html`
  directamente con `file://` sin perder el diseño ni la funcionalidad.
- Resolución de fotografías desde la API local cuando la interfaz se abre como
  archivo en Safari.
- Auditoría de los proyectos con código encontrados en Documentos y mapa de
  reutilización para MegaSuite.
- Módulo funcional de conteos físicos inspirado en Megainventario y MegaMundo:
  fotografía inicial por bodega, captura por producto, diferencias, severidad,
  revisión y cierre controlado.
- Ajustes de inventario transaccionales al aprobar un conteo, con bloqueo si el
  saldo cambió durante la jornada y movimiento auditable por diferencia.
- Módulo funcional de cuentas por cobrar con clientes, facturas por conceptos,
  vencimientos, impuestos, saldos y abonos parciales o totales.
- Tablero de cartera por edades: por vencer, 1–30, 31–60 y más de 60 días,
  además del recaudo mensual.
- Detalle de cada factura con conceptos, historial de pagos y estado calculado.
- Auditoría transaccional para la creación de facturas y aplicación de abonos.
- Corrección de carga de CSS y JavaScript en Safari local, evitando que los
  recursos HTTP sean forzados a HTTPS y renovando su caché.
- Centro de operaciones local y responsive servido desde `public/index.html`.
- Resumen con cantidades consultadas desde las APIs reales.
- Estado en vivo de API, PostgreSQL y Redis.
- Navegación móvil, búsqueda de módulos, estados de carga y mensajes de error.
- Compatibilidad al abrir `public/index.html` directamente mediante `file://`
  durante el desarrollo local.
- Identidad visual basada en azul `#192584`, morado `#B541FA`, cian `#4FD2E9`
  y gris `#74706D`, aplicada a navegación, acciones, tarjetas y estados.
- Navegación organizada por áreas de trabajo.
- Primer módulo funcional de empresas con listado, búsqueda y creación mediante
  la API real.
- Selector persistente de empresa activa para mantener aislado el contexto
  operativo.
- Módulo funcional de sucursales con listado, búsqueda, creación y validación
  de códigos por empresa.
- Módulo funcional de bodegas con búsqueda, creación por sucursal y tipos de
  ubicación operativa.
- Directorio visual de los 17 módulos previstos, diferenciando claramente lo
  disponible, la base técnica preparada y las fases futuras.
- Validación de la jerarquía empresa → sucursal → bodega en la API.
- Catálogo funcional de productos con búsqueda, creación, precios, categoría,
  marca e impuesto de venta.
- Entidades multiempresa para categorías, marcas y variantes de producto.
- Acciones específicas para crear categorías, registrar marcas y agregar
  productos sin modificar inventario directamente.
- Validación de pertenencia de las referencias del catálogo a la empresa activa.
- Catálogo demostrativo pequeño para que la interfaz local muestre el flujo
  completo desde el primer arranque.
- Imágenes principales para productos, almacenadas localmente con metadatos en
  PostgreSQL y límite de 2 MB.
- Acción para adjuntar o cambiar la fotografía de cualquier producto existente.
- Base funcional de Caja y POS con caja física, apertura de turno, fondo
  inicial, cierre y conteo de efectivo.
- Ruta visual del POS que separa lo operativo de los próximos pasos de carrito,
  cobro y salida de inventario.
- Venta rápida con catálogo por bodega, existencias disponibles, búsqueda,
  carrito y control de cantidades.
- Cobros en efectivo, tarjeta o transferencia vinculados al turno abierto.
- Comprobante POS con fotografía histórica de nombre, SKU, precio, costo e
  impuesto de cada producto vendido.
- Descuento transaccional de existencias mediante movimientos de inventario,
  impidiendo ventas con stock insuficiente.
- Navegación reorganizada como aplicación por vistas: Dashboard, Empresas,
  Sucursales, Bodegas, Catálogo, Caja/POS, Mapa ERP y Sistema.
- Barra de pestañas persistente y rutas con hash para abrir directamente cada
  área sin recorrer una página vertical extensa.
- Subpestañas de Productos, Categorías y Marcas con listados independientes.
- Menú lateral agrupado por Administración, Inventario, Ventas, Planeación y
  Control.

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
