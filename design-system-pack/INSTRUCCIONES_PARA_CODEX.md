# 📦 Guía de Integración para Codex — Logos e Íconos de Nubixor

Esta carpeta contiene todo el sistema de identidad visual, logos oficiales optimizados e íconos SVG vectoriales listos para ser colocados en el frontend de **Nubixor**.

---

## 📁 Estructura de la Carpeta

```text
design-system-pack/   (o public/assets/)
├── brand/
│   ├── nubixor-official-logo.png      # Logo oficial completo (nube + texto Nubixor)
│   ├── nubixor-logo-transparent.png   # Logo oficial con fondo transparente (para navbars, headers y dark/light themes)
│   ├── nubixor-icon.png               # Isotipo de la nube con gráfica ascendente (fondo transparente)
│   ├── nubixor-icon-white-bg.png      # Isotipo con fondo blanco
│   ├── favicon-32x32.png / .ico       # Favicon para el navegador
│   ├── apple-touch-icon.png           # Ícono para móviles iOS/Android
│   └── brand-tokens.css               # Variables CSS oficiales con la paleta y gradientes
│
└── icons/
    ├── navigation/                    # 23 íconos para el menú lateral (Sidebar)
    │   ├── dashboard.svg
    │   ├── empresas.svg
    │   ├── sucursales.svg
    │   ├── terceros.svg
    │   ├── bodegas.svg
    │   ├── inventario.svg
    │   ├── productos.svg
    │   ├── logistica.svg
    │   ├── compras.svg
    │   ├── cuentas-pagar.svg
    │   ├── gastos.svg
    │   ├── caja.svg
    │   ├── cartera.svg
    │   ├── facturacion.svg
    │   ├── nomina.svg
    │   ├── crm.svg
    │   ├── proyectos.svg
    │   ├── soporte.svg
    │   ├── reportes.svg
    │   ├── auditoria.svg
    │   ├── configuracion.svg
    │   ├── usuarios.svg
    │   └── seguridad.svg
    │
    ├── actions/                       # 32 íconos para botones de acción, tablas y modales
    │   ├── plus.svg                   # Crear / Nuevo (+)
    │   ├── edit.svg                   # Editar (Lápiz)
    │   ├── trash.svg                  # Eliminar (Papelera)
    │   ├── eye.svg                    # Ver / Detalle (Ojo)
    │   ├── download.svg               # Descargar
    │   ├── upload.svg                 # Subir archivo
    │   ├── printer.svg                # Imprimir
    │   ├── search.svg                 # Buscar
    │   ├── filter.svg                 # Filtrar
    │   ├── refresh.svg                # Recargar / Sincronizar
    │   ├── copy.svg                   # Copiar al portapapeles
    │   ├── x.svg                      # Cerrar modal / Cancelar
    │   ├── check.svg                  # Guardar / Aprobar
    │   ├── more-vertical.svg          # Menú de 3 puntos
    │   ├── barcode.svg                # Código de barras
    │   ├── qr-code.svg                # Código QR
    │   ├── file-text.svg              # Factura / Documento
    │   ├── file-spreadsheet.svg       # Exportar a Excel
    │   ├── file-pdf.svg               # Exportar a PDF
    │   ├── send.svg                   # Enviar correo / Notificación
    │   ├── lock.svg / unlock.svg      # Bloquear / Desbloquear
    │   ├── calendar.svg / clock.svg   # Fechas y tiempos
    │   └── chevrons & flechas         # Navegación y desplegables
    │
    ├── status/                        # 7 íconos de estado
    │   ├── check-circle.svg           # Exitoso / Activo
    │   ├── alert-triangle.svg         # Advertencia
    │   ├── alert-circle.svg           # Error / Rechazado
    │   ├── info.svg                   # Información
    │   ├── clock-pending.svg          # Pendiente
    │   ├── ban.svg                    # Inactivo / Anulado
    │   └── shield-check.svg           # Verificado / Seguro
    │
    ├── icons-manifest.json            # Catálogo estructurado en JSON
    └── icons-sprite.svg               # Sprite SVG para usar con <use href="#icon-...">
```

---

## 🚀 Instrucciones para Colocarlos

### 1. Colocar los Logos en `public/index.html`

#### A. Favicon en `<head>`:
```html
<link rel="icon" type="image/png" href="./assets/brand/favicon-32x32.png">
<link rel="apple-touch-icon" href="./assets/brand/apple-touch-icon.png">
```

#### B. Logo en la Pantalla de Login / Auth Gate (`#authGate`):
```html
<div class="auth-brand">
  <img class="brand-mark" src="./assets/brand/nubixor-icon.png" alt="Nubixor">
  <span>Nubixor</span>
</div>
```

#### C. Logo en la Barra Lateral (Sidebar Header):
```html
<div class="sidebar-brand">
  <img src="./assets/brand/nubixor-icon.png" alt="Nubixor" class="sidebar-brand-icon" width="36" height="36">
  <span class="sidebar-brand-text">Nubixor</span>
</div>
```

---

### 2. Colocar los Íconos en el Menú Lateral (`nav-item`)

Todos los íconos están normalizados a `viewBox="0 0 24 24"`, trazo `stroke-width="2"` y `stroke="currentColor"`.

#### Ejemplo de uso inline en el Sidebar:
```html
<!-- Dashboard -->
<a class="nav-item active" href="#inicio" data-view-link="inicio">
  <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
  <span>Dashboard</span>
</a>

<!-- Empresas -->
<a class="nav-item" href="#empresas" data-view-link="empresas">
  <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
  <span>Empresas</span>
</a>

<!-- Inventario / Existencias -->
<a class="nav-item" href="#inventario" data-view-link="inventario">
  <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
  </svg>
  <span>Existencias</span>
</a>
```

#### O mediante etiqueta `<img>`:
```html
<a class="nav-item" href="#facturacion" data-view-link="facturacion">
  <img src="./assets/icons/navigation/facturacion.svg" class="nav-icon" width="18" height="18" alt="">
  <span>Facturación DIAN</span>
</a>
```

---

### 3. Colocar Íconos de Acción en Botones y Tablas

```html
<!-- Botón Nuevo / Crear -->
<button class="btn btn-primary">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
  <span>Nuevo Producto</span>
</button>

<!-- Botones de Acción en Tablas -->
<div class="table-actions">
  <button class="action-btn" title="Ver detalle">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
  <button class="action-btn" title="Editar">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
  </button>
  <button class="action-btn text-danger" title="Eliminar">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
  </button>
</div>
```

---

### 4. Estilos y Paleta de Colores (`brand-tokens.css`)

```css
@import './assets/brand/brand-tokens.css';

/* Los íconos heredan automáticamente el color del texto o estado */
.nav-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  flex-shrink: 0;
  transition: transform 0.15s ease, stroke 0.15s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.08);
  color: var(--nubixor-cyan);
}

.nav-item.active .nav-icon {
  color: var(--nubixor-purple);
}
```
