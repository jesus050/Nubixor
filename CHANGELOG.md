# Changelog

Todos los cambios relevantes de MegaSuite se documentan en este archivo.

## [Unreleased]

### Corregido

- Un cobro reintentado ya no registra dos ventas. El punto de venta genera una
  clave con el carrito y la envía en `Idempotency-Key`; el servidor reconoce el
  cobro repetido y responde el mismo recibo en lugar de descontar el inventario
  otra vez. La restricción única que existía nunca llegaba a evaluarse porque
  incluía `checkout_cart_id`, que en el POS siempre es NULL.
- El margen bruto dejó de contar el IVA como utilidad. Los precios son impuesto
  incluido, y los cinco cálculos del sistema restaban el costo del total
  cobrado: un producto vendido justo al costo aparecía con 19 % de margen.
  Afectaba al dashboard, al reporte de ventas, a la clasificación de rotación,
  a los resultados de campaña y al plan comercial. El margen del mes y el de
  rotación descuentan además las devoluciones.
- La venta multiempresa vuelve a funcionar. La contabilidad se registra a nombre
  de la empresa vendedora, pero la conexión declaraba la empresa activa y las
  políticas por empresa rechazaban el asiento; el cajero veía un error sobre
  cuentas contables que no tenía nada que ver.
- El bloqueo por intentos fallidos no ocurría nunca: el contador se
  incrementaba dentro de la transacción que revertía el error, y el parámetro
  que decidía el bloqueo se ponía en cero justo al llegar a cinco. Cinco
  intentos fallidos bloquean la cuenta quince minutos de verdad.

### Añadido en la fase C

- Kardex real: cada movimiento de inventario guarda el saldo anterior, el
  resultante y la sucursal, encadenado por la propia base de datos. Los
  movimientos pasan a ser inmutables —una corrección se hace con otro
  movimiento— y `inventory_balances` ya no admite saldos negativos.
- `GET /api/inventory/kardex/reconciliation` compara el saldo con el acumulado
  del kardex y lista las diferencias. Una diferencia significa que alguien movió
  existencias sin registrar el movimiento; en datos históricos es normal que
  aparezcan los productos cuyo inventario inicial se cargó directamente.
- La auditoría registra el origen de cada evento —dirección, dispositivo e
  identificador de petición— dentro de `metadata`, que la cadena de integridad
  ya sella. El acceso también se audita: entrar, salir, fallar al entrar,
  activar la cuenta y restablecer la contraseña.
- El respaldo y la sincronización de rangos con Factus piden un cerrojo antes de
  ejecutarse, para que con varias instancias solo una haga el trabajo.

### Añadido en la fase D

- El límite de tasa es compartido entre instancias y cubre toda la API, no solo
  el acceso y las subidas. Cuenta por persona autenticada, no por dirección.
- El kardex y la bandeja de rotación se paginan. Antes la rotación recorría el
  catálogo entero sin límite y el kardex cortaba en quinientos movimientos sin
  decirlo.
- Los respaldos, sus verificaciones y las pruebas de restauración quedan
  registrados. `npm run backup:status` responde cuándo fue el último respaldo
  correcto, cuánto pesó, cuánto tardó y cuándo se probó restaurarlo, y avisa
  cuando algo lleva demasiado tiempo sin hacerse.
- `docs/RESTAURACION.md`: procedimiento de restauración, simulacro trimestral y
  lo que el esquema de respaldo todavía no cubre.

### Añadido en la fase E

- Capital inmovilizado: cuánto dinero hay detenido en existencias, agrupado por
  categoría, marca, sucursal, bodega o producto.
- Clasificación por cobertura —agotado, en riesgo, sana, exceso— con umbrales
  configurables. La rotación por unidades responde cuánto se vendió; la
  cobertura responde qué se va a acabar y dónde hay dinero quieto.
- Traslados sugeridos entre sucursales: propone mover lo que sobra donde no rota
  hacia donde se está acabando, y solo cuando la cantidad justifica el viaje.
  Ninguna sugerencia se ejecuta sola.
- El período de análisis se puede pedir por consulta (7, 30, 60, 90 días o el
  que sea), sin cambiar el ajuste de la empresa.
- El panel de atención avisa de productos sin una sola venta —con el capital que
  representan— y de cajas cerradas con diferencia en los últimos siete días.

### Seguridad

- El aislamiento por empresa dentro de PostgreSQL se extendió a compras, gastos,
  nómina, conteos físicos, lotes, reservas y series.
- El catálogo compartido —productos, saldos y movimientos de inventario— también
  quedó protegido. Como la caja multiempresa atiende a varias empresas en la
  misma petición, la conexión ya no declara una empresa sino el conjunto que esa
  petición puede tocar: la activa, más las que comparten la caja. La lista la
  calcula siempre el servidor desde la configuración de la caja y la membresía
  del usuario. Sin ampliación explícita el conjunto es la empresa activa, así
  que ninguna consulta existente cambia de comportamiento.

### Añadido

- `docs/AUDITORIA_FASE_A.md`: auditoría completa del sistema con hallazgos por
  severidad, verificación de escenarios críticos y prioridades por fases.

### Cambiado

- Caja & POS funciona como una terminal de venta: catálogo y carrito aparecen
  primero, el turno se resume en una franja compacta y el control de efectivo
  permanece plegado hasta que el usuario lo necesita.
- La sesión del Cajero oculta completamente la navegación administrativa para
  aprovechar toda la pantalla, y el botón de cobro muestra el total de la venta.
- La terminal incorpora filtros rápidos por categoría, búsqueda por nombre,
  SKU o código de barras, selector directo del medio de pago, vaciado del
  carrito y acceso rápido al buscador con la tecla `/`.
- El cobro en efectivo registra el monto recibido, calcula el cambio, propone
  valores rápidos y bloquea ventas con efectivo insuficiente. El comprobante
  conserva el medio de pago, el efectivo recibido y el cambio entregado.
- El buscador POS permite agregar un producto inmediatamente al leer un código
  de barras o escribir un SKU exacto y presionar `Enter`.
- Se refinó el CSS de Caja con una jerarquía más clara, catálogo y carrito con
  mejor contraste, estados de interacción accesibles, espaciado consistente y
  una adaptación más limpia para pantallas medianas y móviles.
- Caja permite seleccionar o crear clientes sin abandonar la venta, muestra su
  saldo pendiente y conserva el tercero en el comprobante.
- Las ventas a crédito exigen cliente y vencimiento, descuentan inventario y
  crean en la misma transacción una factura conectada con Cuentas por cobrar.
- Caja incorpora el historial del turno con cliente, productos, valor y medio
  de pago, además de recuperación segura del comprobante para reimpresión.

### Añadido

- Base relacional de Caja & POS multiempresa con autorización explícita de
  empresas por caja física, membresía activa del cajero y saldos separados por
  empresa durante el turno.
- Identidad legal de productos mediante empresa propietaria, empresa vendedora,
  bodega predeterminada y categoría tributaria, con claves foráneas que impiden
  cruzar inventarios o impuestos entre empresas.
- Modelo de carritos, líneas inmutables, ventas por empresa, pagos globales o
  separados, asignaciones exactas y obligaciones interempresa.
- Perfiles tributarios configurables, cuentas de facturación con credenciales
  cifradas, resoluciones y documentos electrónicos aislados por empresa; no se
  infieren obligaciones legales automáticamente.
- Pruebas unitarias e integración con PostgreSQL real para agrupación por
  vendedor, manipulación de identidad, autorización de caja, documentos,
  inventarios y pagos multiempresa.
- Centro de Reportes con análisis independientes de ventas y margen, inventario
  valorizado, compras y recepciones, cartera por edades y proveedores por
  edades.
- Filtros compartidos por sucursal, fechas y texto libre, con paginación y
  exportación CSV de hasta 5.000 registros.
- Indicadores consolidados de ventas del mes, valor del inventario, compras
  pendientes, cartera abierta y obligaciones abiertas.
- Permiso `reports.view` para roles gerenciales, operativos y de auditoría, con
  restricción automática al alcance de sucursal.

### Corregido

- Los ajustes de inventario iniciales aceptan cantidades numéricas en
  PostgreSQL sin conflicto de tipos y las salidas manuales descuentan
  correctamente de un saldo existente.
- Se evita que Safari muestre simultáneamente la pantalla de acceso y el menú
  interno cuando un elemento marcado como oculto también tiene estilos de
  visualización propios.
- El rol base Cajero queda limitado a Caja & POS: ya no recibe permisos de
  dashboard o inventario ni muestra otras áreas en la navegación.
- Centro de Auditoría independiente con resumen diario, semanal y mensual,
  responsables activos y tipos de acción.
- Filtros combinables por texto, persona, entidad, acción y rango de fechas,
  con paginación y detalle seguro de datos antes/después.
- Exportación CSV de hasta 5.000 eventos según los filtros seleccionados.
- Autorización `audit.view` y bloqueo explícito de la auditoría global para
  membresías limitadas a una sucursal.
- Acceso local real sin contraseña predeterminada: configuración inicial única,
  inicio y cierre de sesión.
- Contraseñas derivadas con scrypt, sesiones revocables mediante cookies
  `HttpOnly` y protección CSRF para operaciones de escritura.
- Sesión normal de 12 horas y opción recordada de 7 días.
- Bloqueo temporal tras cinco credenciales incorrectas.
- Invitaciones con enlace personal de activación, vencimiento de 72 horas y
  uso único.
- Recuperación administrada de acceso; al definir una nueva contraseña se
  invalidan las sesiones anteriores.
- Protección transversal de módulos según permisos y validación de alcance
  cuando una operación referencia una sucursal.
- Empresas visibles limitadas a las membresías activas del usuario autenticado.
- Dashboard ejecutivo real con ventas del día y mes, margen bruto mensual,
  saldos bajos, compras pendientes, posición de caja y flujo proyectado a 30
  días usando cartera y cuentas por pagar.
- Centro de control de caja con ventas por medio de pago, ingresos manuales,
  gastos menores, retiros, efectivo esperado y actividad reciente.
- Arqueo detallado por denominaciones, diferencia automática, explicación
  obligatoria cuando el cierre no cuadra e historial de turnos.
- Auditoría de apertura, movimientos y cierre de caja.
- Impresión local del comprobante POS.
- Centro de Usuarios y accesos separado por empresa, con búsqueda, filtros,
  detalle de cada persona y alcance opcional por sucursal.
- Invitaciones y actualización de membresías con estados invitado, activo y
  suspendido.
- Roles base Propietario, Administrador, Operaciones, Caja y Auditor, más roles
  personalizados con matriz explícita de permisos.
- Autorización del lado del servidor para administrar usuarios y roles.
- Protección transaccional del último propietario activo.
- Inicialización automática de roles y propietario al crear una empresa.
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
- Directorio visual de los 18 módulos previstos, diferenciando claramente lo
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
