# PLAN MAESTRO — Rediseño estético (Footer · Shop · PDP · Talles · Colorways · Archivo)

> Fecha: 2026-07-28. Orquestación: Fable (advisor) + Opus 5 (ejecución).
> Documento hermano: [SPEC_VIEWPORTS_REDISENO.md](SPEC_VIEWPORTS_REDISENO.md) — dimensiones exactas medidas en vivo para replicar en Inkscape.
> Metodología: Naza replica cada viewport en Inkscape (canvas **1425×900** desktop / **390×844** mobile) y entrega `.svg` como spec exacta. Claude implementa contra el SVG.

---

## 1. Decisiones cerradas (2026-07-28)

| Tema | Decisión |
|-|-|
| **Card del Shop** | **1 card por PRODUCTO** (grid pasa de 20 → 12 items, 4 filas de 3). Réplica exacta del patrón Helmut Lang: al hacer **hover** sobre la card aparecen **rectángulos verticales** que señalan los colorways. Hover sobre un rectángulo cambia la imagen de fondo de la card. |
| **Codificación de colorways ambiguos** | Problema: "negro logo blanco" vs "negro logo rojo" son el mismo color base. Solución de Naza: **el color de la estampa se codifica en el BORDE del rectángulo**. Al hacer hover/activar un swatch, su borde se enciende: estampa roja → borde `#AD1C1C`; estampa blanca → borde `#FAFAFA`. Fill del rectángulo = color base de la prenda. |
| **Posición de los swatches en la card** | Naza los describió "arriba a la izquierda"; en la referencia HL están apilados verticalmente sobre el borde derecho. **Confirmar lado al dibujar el SVG** — la lógica es idéntica. |
| **Galería PDP** | **NO** vertical apilada. HL usa **una única card horizontal con selectores `<` `>`** para pasar de foto, y **contador en el borde superior izquierdo** de la imagen. Eso vamos a replicar. Habrá **más de 5 fotos por prenda** (producción de fotos confirmada). |
| **Selector de colorway en PDP** | Los **mismos rectángulos** de la card del Shop, pero dispuestos **horizontalmente**. Colores planos (patrón HL), con la misma codificación de borde para las estampas. |
| **Consolidación de colorways** | Capa de agrupación en el **frontend** (reestructurar el array `products` de `start.js`). **Cero migración de datos** — Supabase ya está consolidado (`productos` + `variantes_producto`). No tocar `variantes_producto` jamás (las órdenes históricas apuntan ahí por `variante_id`). |
| **URLs** | Patrón HL: **URL propia por colorway** → `/shop/{producto}/{colorway}` con `history.pushState` al cambiar swatch. 301s en `next.config.ts` desde los ~20 slugs viejos (son `content_ids` del Meta Pixel — no romper retargeting). |
| **Archivo (Raf Simons)** | **DIFERIDO.** El advisor relevó rafsimons.com y no encontró el grid disperso/blurreado que Naza recuerda; Naza sostiene que lo vio. Cuando llegue el momento se re-verifica la referencia juntos (posiblemente sea otra página del sitio, una versión anterior, o A/B). No bloquea nada. |

---

## 2. Prerequisito técnico (ANTES de todo cambio estético)

### 2.1 Bug crítico ya existente: descuento de stock del producto equivocado

`public/js/checkout-logic.js:297-302` resuelve `variante_id` **solo por `colorway` + `talle`, sin `producto_id`**:

```js
.eq('colorway', item.colorway || '').eq('talle', item.size || '').limit(1)
```

El colorway `'NEGRO'` existe en ≥5 productos → un pedido de "TERMAL NEGRO M" puede grabar la variante de la MUSCULOSA NEGRO M y **descontar stock del producto equivocado** (`.limit(1)` sin `ORDER BY` = no determinístico).

**Fix:** el item del carrito lleva `sku`; el lookup pasa a `.eq('sku', item.sku)` (UNIQUE). ~1 hora. **Bloqueante de la consolidación** (agrupar colorways agranda la superficie de colisión).

### 2.2 Otras minas conocidas (resolver durante las fases correspondientes)

- **Carrito por índice**: `addToCart(productIndex, size)` — al consolidar, dos colorways colapsan al mismo índice y se **fusionan en una línea**. Clave nueva: `(slug, colorway, talle)`. `data-index` → `data-slug` + `data-colorway`.
- **`getSizeChart()` resuelve por prefijo de slug** (`start.js:236-248`): si cambian los slugs devuelve `null` en silencio y el botón "¿QUÉ TALLE COMPRAR?" desaparece sin error. Mover `fit` a propiedad explícita del producto ANTES de tocar slugs.
- **Imágenes fuera de convención**: `remera-güido-negra-front.png` (Ü, género), typo `jean-negro-bootcut-font.png`, `jean-indigo-fold.png` compartida entre productos. **No derivar rutas por string** → mapa explícito `colorway → [imágenes]` en el array de productos.
- **Stock invisible en el frontend**: `obtenerStock()` / `obtenerVariantesStock()` (`supabase-config.js:46,91`) existen y nadie las llama; la PDP hardcodea `XS S M L` para todo. El patrón HL de talles agotados grisados (que adoptamos) exige llamarlas.
- **Jeans NO son colorways**: regular índigo (Nihon Menpu 13oz), regular negro y suelto (Candiani 11oz) son productos distintos. Se agrupan como **hermanos navegables** (swatch = link entre productos, exactamente como HL en wardrobe-jeans), no como variantes.

---

## 3. Fases de ejecución

Cada fase visual espera su `.svg` de Inkscape antes de implementarse.

### FASE 0 — Fix SKU en checkout ✱ sin SVG
`checkout-logic.js`: agregar `sku` al item del carrito, lookup por SKU. Test con `/test-endpoint`.
**Archivos:** `public/js/checkout-logic.js`, `public/js/start.js` (armar item con sku).

### FASE 1 — Footer ✱ SVG: `footer-desktop.svg`, `footer-mobile.svg`
Puro CSS + markup en `page.tsx` (líneas ~356 `.home-footer`, ~416 `.shop-footer`). Sirve para calibrar el flujo Inkscape→SVG→código.
⚠️ Hay **92 menciones de `footer`** en `globals.css` en ≥5 bloques con overrides (942-1094, 2525-2582, 2689-2740, 4207+). **Decisión pendiente antes de dibujar: ¿se unifican `.home-footer` y `.shop-footer` o siguen siendo dos variantes de paleta?**
Dimensiones actuales: SPEC §4.

### FASE 2 — Guía de talles ✱ SVG: `talles-desktop.svg`, `talles-mobile.svg`
CSS + markup de `buildSizeGuide()` en `start.js`. Incluye mover `fit` a propiedad explícita (~15 líneas, desactiva la mina de 2.2).
Se mantiene el formato panel (HL también usa drawer lateral). Dimensiones actuales: SPEC §3.
**Decisiones pendientes:** ¿toggle cm/pulgadas queda? ¿tabla por calce (actual, 9 configs) o agrupadas?

### FASE 3 — Grid del Shop ✱ SVG: `shop-desktop.svg`, `shop-mobile.svg`
El SVG debe especificar **la card completa con sus 3 estados**:
1. **Reposo**: imagen 3/4 + info (como hoy o rediseñada).
2. **Hover card**: aparecen los rectángulos de colorway (lado a confirmar; en HL: apilados verticales en el borde derecho, ~14px de ancho). En HL el hover también muestra QUICK VIEW y flecha `>` — decidir si van.
3. **Hover swatch**: swap de la imagen de fondo + borde del swatch activo encendido (rojo `#AD1C1C` para estampa roja, `#FAFAFA` para estampa blanca).

Grid de **12 items** (4 filas × 3 desktop / 6 filas × 2 mobile). En mobile no hay hover → definir en el SVG mobile si los swatches son visibles siempre o no existen (color se elige en PDP).
Implementación acompaña: `data-index` → `data-slug`.
**Decisión pendiente:** categorías restringidas ("PRÓXIMAMENTE") — ¿siguen en grilla, van al final o se sacan?
Dimensiones actuales: SPEC §1.

### FASE 4 — Consolidación de colorways ✱ sin SVG (lógica)
- `start.js`: array `products` 20 → 12 entradas con `colorways: [{ id, label, fillColor, borderColor, images[], skuPrefix }]`.
- Clave de carrito `(slug, colorway, talle)`; render del carrito muestra colorway.
- Routing: `/shop/{producto}/{colorway}` + `history.pushState`; 301s de slugs viejos en `next.config.ts`.
- Jeans: hermanos navegables, no variantes.
- Conectar `obtenerVariantesStock()` para talles reales por colorway.
- Migración chica opcional (`15_…`): columnas `slug`/`orden` en `productos`, `colorway_slug` en variantes (preparar el día que el shop lea de Supabase). **Nunca DELETE/INSERT en `variantes_producto`.**
**Depende de:** Fase 0 y 2.

### FASE 5 — PDP ✱ SVG: `pdp-desktop.svg`, `pdp-mobile.svg`
El giro 180°, sobre el modelo consolidado:
- **Galería horizontal**: una card de imagen con flechas `<` `>` y **contador `N/M` en el borde superior izquierdo** de la imagen. Más de 5 fotos por prenda.
- **Selector de colorway**: rectángulos planos horizontales, misma codificación de borde que el Shop.
- **Talles**: agotados **visibles y deshabilitados** (ancho de fila constante); ATC deshabilitado hasta elegir talle. Stock real vía Supabase.
- **Nota de calce**: "EL MODELO MIDE 1,85 Y USA TALLE M" (requiere el dato por producto — pedírselo a Naza).
- **Acordeones ×3**: DETALLE / MATERIALES Y CUIDADO / ENVÍOS Y CAMBIOS (absorbe `.pdp-care`).
- **Rojo `#AD1C1C` reservado a 3 usos**: talle seleccionado, swatch activo, hover del ATC. En ningún otro lado.
- Descartado de HL: Title Case, sale prices, "frequently bought together", reveal escalonado.
**Decisiones pendientes:** talles de jeans ¿numéricos (28-38)? (cambia el ancho de la fila de 4 a 9 botones); ¿thumbnails además de flechas o flechas solas?
Dimensiones actuales (referencia de partida): SPEC §2. ⚠️ El SVG nuevo manda — recordar el problema de `align-items: center` (SPEC §2, advertencia).

### FASE 6 — Archivo ✱ DIFERIDO
Re-verificar la referencia con Naza cuando llegue el momento. Base ya existente: `start.js:4971-5211` (`ARCHIVE`, `openArchiveDetail`) + `public/js/archive-data.js` (sin trackear). Canvas full-viewport sin header (SPEC §5).

---

## 4. Flujo de trabajo por fase visual

1. Naza dibuja en Inkscape sobre canvas **1425×H** / **390×H** (ver SPEC §0 y §6 — nombres de capa descriptivos, fold marcado).
2. Entrega los `.svg` → Claude los lee y mapea a clases CSS.
3. Implementación en branch de trabajo; verificación en preview browser con medición JS (mismo método que generó la SPEC).
4. Revisión visual de Naza antes de commit (regla de BRAND_GUIDELINES).

## 5. Estado de commits

Hay trabajo previo sin commitear (PDP rediseñada, catálogo jeans, teasers, hooks). **Commitear ANTES de arrancar la Fase 1** para que el rediseño arranque de un working tree limpio y cada fase sea un commit legible. El push lo decide Naza.

## 6. Preguntas abiertas (responder antes del SVG de cada fase)

| Fase | Pregunta |
|-|-|
| 1 | ¿Unificar `.home-footer` y `.shop-footer`? ¿Sobrevive el reveal del logo por clip-path? ¿Entra newsletter? |
| 2 | ¿Toggle cm/pulgadas? ¿Tablas por calce o agrupadas? |
| 3 | ¿Swatches en card mobile (sin hover)? ¿QUICK VIEW y flecha como HL? ¿Restringidos dónde? |
| 5 | ¿Talles numéricos para jeans? ¿Datos de calce por producto? ¿Thumbnails + flechas o flechas solas? |
