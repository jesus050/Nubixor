# Instrucciones para Codex — Sitio comercial, fase 2

> El sitio ya está publicado en `https://nubixor.tech` y funciona: versión "ledger",
> 9,3 KB en el cable, 0,4 s de respuesta, TLS emitido, `www` redirige con 301.
> Los precios reales ya están puestos. Esto es lo que quedó pendiente.

**Archivo único a tocar:** `site/index.html` (más los nuevos que se indican).
No toques `public/` ni `src/` en estos commits.

---

## Orden de ejecución

1. **B** — Open Graph (lo que más conversión recupera)
2. **C** — robots + sitemap
3. **D** — página 404
4. **E** — animación del panel
5. **F** — aparición al hacer scroll
6. **A** — el correo, cuando Jesús decida

---

## A — Correo de contacto  🔴 BLOQUEANTE

**Estado: esperando decisión de Jesús. No inventes un destino.**

`hola@nubixor.tech` aparece **2 veces** en el HTML publicado y **el buzón no existe**.
Ahora mismo cada persona que pulsa el CTA principal cae en un correo muerto.

Cuando Jesús decida, reemplaza en los dos sitios (CTA final y footer):

- **Si crea el buzón:** no hay que tocar nada, solo confirmar que llega.
- **Si prefiere WhatsApp:** `https://wa.me/57XXXXXXXXXX?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20Nubixor`
  y cambia el texto del botón a "Escribir por WhatsApp".
- **Si prefiere Calendly u otro:** enlace directo, texto "Agendar 30 minutos".

Actualiza también el `<a href="mailto:...">` del footer, bajo "Empresa → Contacto".

---

## B — Open Graph, Twitter Card y canonical

**Por qué importa:** al pegar el link en WhatsApp —el canal principal de venta en
Colombia— hoy no sale tarjeta: sale la URL pelada. Verificado sobre el HTML en
producción, faltan `og:title`, `og:image`, `og:url`, `twitter:card` y `canonical`.

### B.1 — Etiquetas

Añade en el `<head>` de `site/index.html`, después de `<meta name="description">`:

```html
<link rel="canonical" href="https://nubixor.tech/">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Nubixor">
<meta property="og:title" content="Nubixor · ERP y facturación electrónica DIAN">
<meta property="og:description" content="POS, inventario, contabilidad y facturación electrónica DIAN en un solo sistema. Para empresas colombianas.">
<meta property="og:url" content="https://nubixor.tech/">
<meta property="og:image" content="https://nubixor.tech/assets/og-cover.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_CO">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Nubixor · ERP y facturación electrónica DIAN">
<meta name="twitter:description" content="POS, inventario, contabilidad y facturación electrónica DIAN en un solo sistema.">
<meta name="twitter:image" content="https://nubixor.tech/assets/og-cover.png">
```

`og:image` **debe ser URL absoluta**. WhatsApp y LinkedIn ignoran las relativas.

### B.2 — Generar `site/assets/og-cover.png`

Crea `scripts/generate-og-image.py`. **PIL 11.3 está disponible**, úsalo — no repitas
el decodificador PNG manual de `scripts/process-brand-assets.py`.

Especificación:

- Lienzo **1200×630**, fondo sólido `#071D59` (el `--ink` de la marca).
- **Barra de degradado de 8 px** en el borde superior, izquierda→derecha:
  `#00BAF2 → #7746F2 (42%) → #EE2BB2 (72%) → #FF981D (100%)`.
  Dibújala interpolando por columna; es el mismo degradado que `--gradient-brand`.
- **Logo** `site/assets/logo-light.png` centrado, ancho ~460 px, manteniendo
  proporción, con centro óptico ligeramente por encima del centro geométrico
  (aprox. y = 45 % de la altura).

**No pongas texto.** No hay garantía de que la fuente Outfit esté disponible en el
entorno donde corra el script, y un texto con fuente de sustitución se ve peor que
no tener texto. La descripción ya la aporta `og:description`.

Deja el script idempotente y con una línea en `package.json`:
`"og:image": "python3 scripts/generate-og-image.py"`.

### B.3 — Verificación

```bash
curl -sI https://nubixor.tech/assets/og-cover.png | grep -i "content-type\|content-length"
```

Debe dar `image/png`. Luego pega `https://nubixor.tech` en un chat de WhatsApp
contigo mismo y confirma que sale la tarjeta con imagen. **No des B por terminado
sin esa prueba visual** — los validadores mienten, WhatsApp cachea.

---

## C — robots.txt y sitemap.xml

Ambos dan **404** hoy. Crea:

`site/robots.txt`
```
User-agent: *
Allow: /

Sitemap: https://nubixor.tech/sitemap.xml
```

`site/sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nubixor.tech/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

No incluyas `app.nubixor.tech` en el sitemap: es aplicación, no contenido indexable.

---

## D — Página 404 real

Hoy cualquier ruta inexistente devuelve **el contenido del home con código 404**
(un "soft 404", que Google penaliza). Compruébalo: `curl -s https://nubixor.tech/noexiste`.

En el `Caddyfile`, dentro del bloque `{$MARKETING_DOMAIN}`, cambia:

```caddy
handle_errors {
  rewrite * /404.html
  file_server
}
```

Y crea `site/404.html`: misma cabecera y footer que el home, con un mensaje corto
("Esta página no existe") y un botón de vuelta al inicio. Reutiliza los tokens y las
clases del home — no inventes estilos nuevos.

---

## E — Animación del panel del hero

**Esta es la única animación que se paga sola.** El panel del hero hoy es una foto
fija; debe mostrar una factura llegando a la DIAN. Son dos segundos que demuestran el
diferenciador antes de que nadie lea una palabra.

### E.1 — Las barras del gráfico crecen

Anima la altura de cada `.mock-chart i` desde 0 hasta su valor final, escalonando
~60 ms por barra. Usa `transform: scaleY()` con `transform-origin: bottom` —
**nunca animes `height`**, que fuerza recálculo de layout en cada cuadro.

Como el hero está sobre el pliegue, dispara al cargar; no necesita observer.
Duración total por barra ~500 ms, `ease-out`.

### E.2 — La factura pasa a Aceptada

La tercera fila (`FE-1044 · Surtitienda Norte`) arranca en `.tag.wait` con
"Enviando" y, tras ~1,8 s, cambia a `.tag` con "Aceptada".

Haz la transición de color y texto suave (un fundido corto), no un salto seco.
Es el momento clave de la página: que se lea como algo que acaba de pasar.

```js
const row = document.querySelector('[data-invoice-pending]');
if (row && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setTimeout(() => {
    row.textContent = 'Aceptada';
    row.classList.remove('wait');
  }, 1800);
}
```

Marca esa fila con `data-invoice-pending` en el HTML.

**Guarda obligatoria:** con `prefers-reduced-motion: reduce` la fila debe nacer ya en
"Aceptada" — no en "Enviando" congelado para siempre, que dejaría el mensaje
equivocado (una factura que nunca llegó).

---

## F — Aparición al hacer scroll

Discreta. Opacidad 0→1 con 8 px de subida, escalonando los hijos directos de cada
sección ~70 ms.

- `IntersectionObserver` con `threshold: 0.12`, y **desconecta cada elemento tras
  revelarlo** (`observer.unobserve`). No lo dejes observando toda la sesión.
- Anima **sólo `opacity` y `transform`**. Ninguna otra propiedad.
- Estado inicial aplicado **por JS, no en el CSS**. Si lo pones en el CSS y el JS
  falla, la página queda invisible. Añade una clase `js-reveal` al `<html>` desde el
  script antes de nada, y cuelga de ella los estados iniciales.
- El bloque `@media (prefers-reduced-motion: reduce)` que ya existe neutraliza las
  duraciones; verifica que también deja los elementos **visibles**, no ocultos.

Mantén todo en el `<script>` en línea del final. **No agregues librerías** — el sitio
son 9,3 KB en el cable y esa cifra es una característica, no una casualidad.

---

## Lo que NO debes hacer

Parallax, contadores que giran, texto tipo máquina de escribir, blobs flotantes,
degradados animados, animaciones al pasar el mouse sobre las tarjetas.

Todo eso grita "plantilla" y le quita al sitio la credibilidad que le da el diseño
sobrio. Es software contable: verse serio vende más que verse moderno.

---

## Definición de terminado

- [ ] La tarjeta de enlace sale correcta **probada en WhatsApp real**, no en un validador.
- [ ] `robots.txt` y `sitemap.xml` responden 200.
- [ ] Una ruta inexistente devuelve la página 404 propia, con código 404.
- [ ] Con `prefers-reduced-motion: reduce`: todo visible, sin movimiento, y la factura
      nace en "Aceptada".
- [ ] Con JavaScript desactivado, la página se lee completa. Nada invisible.
- [ ] Sin desbordamiento horizontal a 375, 768 y 1280 px
      (`document.body.scrollWidth === document.documentElement.clientWidth`).
- [ ] El peso en el cable sigue por debajo de 15 KB (hoy: 9,3 KB).
- [ ] `og:image` es URL absoluta y devuelve `image/png`.

## Despliegue

`git push` a `master` → el CI reconstruye `nubixor-proxy:latest` → `npm run deploy`.
Recuerda que `site/` va **horneado en la imagen del proxy** (`Caddy.Dockerfile`):
si cambias archivos de `site/` sin reconstruir la imagen, no se ve nada en producción.
