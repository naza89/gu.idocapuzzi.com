# GÜIDO CAPUZZI — Bitácora del Proyecto

Registro cronológico de decisiones, problemas resueltos y cambios importantes.

---

## 2026-04-20

### Fix OCA 404 en producción — causa real: env var OCA_SANDBOX

**Problema encontrado:** Cotización OCA fallaba en Vercel con 404. Funcionaba en local. Soporte OCA confirmó que no hay bloqueo por IP desde AWS US-East.

**Causa real:** `OCA_SANDBOX=true` en Vercel → usa `OCA_API_URL_TEST` con credenciales de producción → 404. En local `OCA_SANDBOX=false` → URL correcta → OK.

**Solución:**
- `OCA_SANDBOX=false` en Vercel Dashboard
- Removido `preferredRegion = ['gru1']` de las 7 routes OCA (workaround innecesario)

**Archivos:** `src/app/api/oca/cotizar|sucursales|crear-envio|anular|etiqueta|tracking|centros-costo/route.ts`

---

### Test E2E en producción — checkout real con NAVE sandbox

**Incidencias:** Supabase INACTIVE (auto-pause) → restaurado. Variables NAVE faltaban en Vercel → agregadas por Naza.

**Resultado:** Orden #55 (`d0f86fea...`) completada, NAVE APPROVED, estado `pagado`. Post-pago no ejecutó (email/stock) por Vercel fire-and-forget.

---

### Fix webhook NAVE — after() garantiza post-pago completo

**Problema:** Fire-and-forget en webhook. Vercel mataba la función async antes de completar stock/email.

**Solución:**
- `after()` de Next.js en lugar de fire-and-forget — ejecuta callback async tras la respuesta sin bloquearla
- Red de seguridad en `GET /api/ordenes/[id]`: si `estado=pagado` con flags false, re-ejecuta post-pay (idempotente)

**Archivos:** `src/app/api/webhooks/nave/route.ts`, `src/app/api/ordenes/[id]/route.ts`

---

### OCA — creación automática de envío al aprobar pago

**Decisión:** Auto (no manual). `ConfirmarRetiro=false` → queda en carrito ePak para revisión antes de despachar.

**Flujo drop-off:** Pago → draft en ePak → Naza confirma → imprime etiqueta → lleva a branch 1405 (Haedo) → OCA despacha.

**Implementación:**
- `src/lib/oca/crear-envio.ts` — función `crearEnvioOCA()` extraída del route, reutilizable
- Webhook paso 4c: `crearEnvioOCA(ordenId, false)` — idempotente por `id_orden_retiro_oca`
- `src/app/api/oca/crear-envio/route.ts` refactorizado

**Commits:** `766a646`, `dfdedac`, `7393dcc`

---

## 2026-04-15

### Teaser / Blackout page — diseño e implementación

**Contexto:** Primera etapa de presencia online pre-lanzamiento. Blackout page minimalista en `guidocapuzzi.com` para generar hype y acumular datos del Meta Pixel, mientras el shop sigue accesible en `/shop`.

**Preview standalone (`teaser-preview.html`):**
- Logo SVG con path completo de GÜIDO CAPUZZI (mismo del header)
- ViewBox corregido: `2652.6561 545.72168 457.11447 55.101227` — offset de Inkscape para que las coordenadas absolutas del path caigan dentro del área visible
- Animación: reveal 2600ms → pulso 8s (0 → 0.8 → 0) con `animation-delay: -4s` para transición suave
- Vignette breathing: pseudo-elemento `::before` con gradiente radial sincronizado al pulso del logo
- Film grain: SVG `feTurbulence` inline animado en `steps(1)` 0.38s
- Texto footer (3 líneas HTML) oculto temporalmente — approach pendiente de definir

**Implementación en `page.tsx`:**
- Variable `NEXT_PUBLIC_SHOW_TEASER` controla la visibilidad. `true` → teaser overlay. `false` o ausente → home normal
- El teaser es un bloque HTML prepended al `siteHTML` existente — no modifica ni reemplaza el `#home-container`
- `#teaser-screen` con `position: fixed; z-index: 9999` — tapa todo en `/`
- Script inline: detecta `window.location.pathname` — si no es `/`, oculta el teaser. Así `/shop` y otras rutas pasan directo
- `body.teaser-active` bloquea scroll mientras el teaser está visible
- Build verificado: `npm run build` ✅

**Deploy:**
- Commit `e9a7957` — teaser overlay reversible vía env var
- Commit `d319c72` — fix: teaser solo en la raíz
- Ambos pusheados a `origin/main` → Vercel deploy automático
- `NEXT_PUBLIC_SHOW_TEASER=true` configurado en Vercel Dashboard → blackout activo en producción

**Meta Ads:**
- 3 Saved Audiences creadas en Meta Ads Manager (Argentina moda indie, Lujo internacional, USA futura)
- Ideas archivadas en vault: Kapso y WIDO marcadas como ⏸️ (no mencionar en planes)

**Archivos modificados:**
- `src/app/page.tsx` — bloque `teaserHTML` condicional + inyección en render
- `teaser-preview.html` — preview standalone (nuevo, no committeado)

---

## 2026-04-13

### Diagnóstico integración OCA — geo-bloqueo de IPs cloud

**Problema encontrado:** Cotización OCA fallaba en producción (güidocapuzzi.com) con HTTP 404, pero funcionaba correctamente en localhost.

**Investigación:**
- Endpoint OCA: ✅ localhost 200 OK, ❌ Vercel 404
- Env vars de OCA confirmadas presentes en Vercel
- Cambio de región a gru1 (São Paulo): sin efecto, sigue 404

**Conclusión:** OCA bloquea por whitelist. Rechaza todos los rangos de data centers cloud (AWS, Vercel).

**Soluciones:**
1. Whitelist CIDR de Vercel en OCA
2. OAuth2/token-based auth (si OCA lo soporta)
3. Proxy en Argentina (Fly.io ezeiza)

**Consulta iniciada:** Soporte OCA contactado pidiendo IP ranges.

**Archivos modificados:**
- `src/app/api/oca/cotizar/route.ts` — preferredRegion = ['gru1']
- `src/app/api/oca/sucursales/route.ts` — idem
- `src/app/api/oca/crear-envio/route.ts` — idem
- `src/app/api/oca/anular/route.ts` — idem
- `src/app/api/oca/tracking/route.ts` — idem
- `src/app/api/oca/etiqueta/route.ts` — idem
- `src/app/api/oca/centros-costo/route.ts` — idem

---

## 2026-04-11

### Diagnóstico error 500 NAVE — sandbox intermitente

**Problema encontrado:** Al intentar redirigir al checkout de NAVE, el botón PAGAR devolvía `Backend error: 500` con alert "No se pudo inicializar el proceso de pago".

**Investigación:** Curl directo a `POST /api/nave/crear-pago`. Primera llamada devolvió `NAVE payment_request failed (502)`. Las tres siguientes devolvieron 200 OK.

**Conclusión:** Inestabilidad del sandbox NAVE, no un bug de código. Solución futura: retry automático en `redirigirPagoNave()`.

---

### Checkout Mobile — fix DOM move con live viewport check

**Problema encontrado:** El accordion no aparecía si la página cargaba en viewport desktop antes de verse en mobile (ngrok). La variable `isMobile` se evaluaba una vez al cargar start.js.

**Solución adoptada:** `if (isMobile)` → `if (window.innerWidth <= 768)` en `enableCheckoutState()`.

**Archivo modificado:** `public/js/start.js`

---

### Checkout Mobile — refinamientos tipografía y fondo

- Label accordion: "RESUMEN DE LA ORDEN" Condensed → "Resumen de la orden" Univers regular 12px
- Total preview: Univers Condensed 14px bold uppercase
- Chevron: reordenado, va después del texto label
- Fondo mobile: override del linear-gradient desktop → #FAFAFA plano (evita viewport partido en 2 tonos)
- Títulos CONTACTO / DIRECCIÓN: 17px → 21px
- Espaciado accordion→CONTACTO: 32px; sección CONTACTO: margin-bottom 42px

**Archivos modificados:** `src/app/globals.css`, `src/app/page.tsx`

---

### Checkout Mobile — consolidación RESUMEN Step 2 en accordion

**Problema:** En Step 2 (Envío), sección "RESUMEN" (Contacto + Ubicación) duplicaba información ya en el accordion.

**Solución:** En mobile, sección `#checkout-step2-resumen-section` oculta (`display: none !important`). Agregado `#checkout-summary-contact-block` dentro del accordion content. `goToStep2()` lo muestra y popula; `volverAStep1()` lo oculta.

**Archivos modificados:** `src/app/page.tsx`, `public/js/start.js`, `src/app/globals.css`

---

### Deploy

Commit `47eea95` pusheado a `origin/main` → Vercel deploy automático.

---

## 2026-04-10

### Fix Legales: word-spacing por justify + uppercase

**Contexto:** Naza reportó párrafos con espacios enormes entre palabras en mobile.

**Problema encontrado:** `.legales-body` combinaba `font-size: 0.78rem` + `text-align: justify` + `text-transform: uppercase`. El browser expande word-spacing para rellenar líneas justificadas con texto uppercase en viewports angostos.

**Solución adoptada:** `font-size: 0.78rem` → `0.88rem`, `text-align: justify` → `left`.

**Archivo modificado:** `src/app/globals.css` (~ln 4618)

---

### Fix Filtros Shop: exact match en lugar de substring

**Problema encontrado:** Filtro por NEGRO mostraba remera BLANCA CON LOGO NEGRO. `applyFilters()` usaba `.includes()` en `.colorway` — "BLANCO LOGO NEGRO" matcheaba "NEGRO".

**Solución adoptada:**
- Exact match contra campo `.color` (color principal), no `.colorway` (descripción completa)
- Normalización: musculosas `color: 'Negra'/'Blanca'` → `'Negro'/'Blanco'`

**Archivo modificado:** `public/js/start.js` (~ln 878-883, ln 137-138)

---

### Checkout Mobile Fase 4: accordion ERD-style

**Contexto:** Implementación de checkout mobile inspirado en ERD. Layout: Logo → Breadcrumb → Accordion (resumen colapsado) → Formulario.

**Implementación:**
- **HTML (`page.tsx`):** Sidebar con accordion toggle (`#checkout-summary-toggle`) + content wrapper (`#checkout-summary-content`). Slot vacío (`#checkout-summary-slot`) en checkout-main entre breadcrumb y step-1.
- **CSS (`globals.css`):** Sidebar oculto mobile. Accordion: `max-height: 0` → `700px` con transition. Chevron rota 180°. Steps responsive (spacing, resumen-row auto, envio opciones). Desktop: toggle `display:none`, content `display:contents`.
- **JS (`start.js`):** Toggle listener. En `enableCheckoutState()` mobile: mueve toggle+content al slot via DOM move (preserva IDs únicos, todo el JS existente funciona). Sync `#checkout-summary-total-preview` desde renderCheckoutCart() y actualizarTotalConEnvio().

**Verificación:** `toggleInSlot: true`, `slotBetweenBreadcrumbAndFields: true`, `sidebarHidden: true` (preview_eval).

**POST-PAGO:** Verificada responsive (max-width 600px, flex single-column, @600px existente). Sin cambios.

### Pendientes identificados

- [ ] Probar en dispositivo real
- [ ] Step 2 (Envío) mobile verificar en real device
- [ ] Fase 5: /cuenta mobile

### Archivos modificados

- `src/app/globals.css` — Fix legales + accordion CSS + checkout steps responsive
- `src/app/page.tsx` — Accordion HTML + slot en checkout-main
- `public/js/start.js` — Fix filtros + normalización musculosas + accordion toggle + DOM move en enableCheckoutState()

---

## 2026-04-08

### Mobile Responsiveness Fase 3: PDP mobile ERD-compliant + button visibility fix

**Contexto:** Sesión continuación. Usuario reportó PDP mobile layout incorrecto y botón AÑADIR AL CARRITO no visible.

**PDP mobile reestructurado:**
- **Problema:** Layout tenía TODA la info (título, colorway, precio, descripción, tamaños, cantidad, botón) ENCIMA de imágenes. No coincidía con ERD.
- **Solución:** Refactorización `enablePDPState()` en `public/js/start.js` (~line 1225). Reemplazo de `.pdp-info` wrapper único con 3 bloques independientes:
  - `.pdp-top-info` (título, colorway, precio)
  - `.pdp-visual` (imágenes carousel)
  - `.pdp-bottom-info` (tamaños, cantidad, botón, descripción)
- **Desktop:** CSS grid 60/40. Visual columna 1 (rows 1-2). TopInfo columna 2 row 1. BottomInfo columna 2 row 2 (sticky).
- **Mobile:** Flexbox `flex-direction: column` con `order`: topInfo=1, visual=2, bottomInfo=3. Resultado: TÍTULO → COLORWAY → PRECIO → IMÁGENES → TAMAÑOS → BOTÓN → DESCRIPCIÓN (ERD order).
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`

**Description font fix:**
- **Problema:** `.pdp-description` tenía `font-condensed` (Univers 67 Condensed) igual que colorway, 16px. Debería ser Regular y más chico.
- **Solución:** Mobile override: `font-family: 'Univers', sans-serif` (Regular), `font-size: 12px`, `text-transform: uppercase`, `line-height: 18px`, text-align left.
- **Archivo modificado:** `src/app/globals.css`

**Button visibility fix:**
- **Problema:** Botón AÑADIR AL CARRITO no aparecía en mobile. CSS tenía `position: fixed; bottom: 0; z-index: 200` pero quedaba ocluido.
- **Causa:** z-index 200 << marquee 1100, header 1000. Botón quedaba detrás de otros elementos.
- **Solución:** Mobile media query: `z-index: 9999 !important`, `position: fixed !important`, `bottom: 0 !important`, `left: 0 !important`, `right: 0 !important`, `width: 100vw`. Desktop: `position: relative` dentro `.pdp-bottom-info`.
- **Verificación:** Eval confirmó botón visible en y=760-812 (375×812 viewport).

**Verificación final:**
- Mobile order: topInfo (order=1) → visual (order=2, scroll-snap) → bottomInfo (order=3) ✅
- Description: Univers Regular 12px vs colorway Condensed 16px ✅
- Button: position fixed, z-index 9999, bottom 0, visible ✅

---

## 2026-04-07

### Mobile Responsiveness Fase 2.5: Header Gucci-style + Shop mobile + Filtros drawer

**Header mobile reestructurado:**
- 4 iconos SVG inline: lupa, persona, bolsa (con badge rojo), hamburger — inspirado en Gucci mobile
- Hamburger igualado a 36×36 (era 44×44), líneas 18px. Gap 6px entre iconos. Padding header 12px.
- **Archivos modificados:** `src/app/globals.css`, `src/app/page.tsx`

**Menú mobile simplificado:**
- Eliminado sistema SHOP/BUSCAR/CUENTA/CARRITO + overlay. Solo 6 categorías directas.
- Stagger animation: 200ms base + 60ms × index por categoría.
- **Archivos modificados:** `src/app/page.tsx`, `public/js/start.js`

**Home sections mobile:**
- btn-rect-mobile centrado ("CAMPAÑA 2026", "VER JEANS"), fondo blanco texto oscuro
- Videos `<video>` separados mobile/desktop. Títulos 0.95rem blanco.
- **Archivos modificados:** `src/app/page.tsx`, `src/app/globals.css`

**Shop mobile:**
- Grid 2 columnas. Título responsive `clamp(2rem, 12vw, 3rem)` (~45px en iPhone 375px).
- **Problema:** Override `.shop-title-row h1` no aplicaba sobre `#shop-category-title` (ID > clase).
- **Solución:** Override mobile usa `#shop-category-title` directamente.
- Producto: nombre 0.85rem, colorway/precio 0.65rem. Colorway uppercase (ambos viewports).
- Botón FILTROS: font 0.7rem, padding 6px 14px.

**Filtros drawer mobile:**
- Fullscreen `width: 100vw`, z-index 1200. Título 1.9rem izq. Sections 1.1rem. Buttons 0.9rem.
- **Pendiente:** Lógica de filtrado (UI lista, lógica no implementada).

**Footer:** Chevron SVG animado (rotate 180°). Manifesto actualizado.
**Marquee:** 0.65rem en mobile.

---

## 2026-04-06

### Mobile Responsiveness Fase 0-1: viewport + header + hamburger menu

**Fase 0:**
- `src/app/layout.tsx` — viewport meta tag `width=device-width, initial-scale=1.0` (sin esto, mobile browsers escalan el sitio como desktop)
- `src/app/globals.css` — CSS variables mobile (`--header-height: 60px`, `--padding-sides: 20px`) en `@media (max-width: 768px)`

**Fase 1 — Header mobile + hamburger menu:**

**Problema encontrado:** `.header-center` tiene en desktop `position: absolute; left: 50%`. En mobile, el residual de `left: 50%` dejaba el logo a ~x=167px en lugar de x=20px.
**Solución adoptada:** `position: relative; left: 0; transform: none` en el media query mobile.
**Archivos modificados:** `src/app/globals.css`, `src/app/page.tsx`, `public/js/start.js`

CSS mobile agregado:
- Header: oculta `.header-left`/`.header-right`, muestra hamburger derecha, logo izquierda
- `#mobile-menu`: fullscreen `translateX(100%) → translateX(0)`, 0.5s ease-out, z-index 1200 (por encima del announcement bar en 1100)
- `.mobile-shop-view`: segunda vista del overlay (categorías), no accordion
- `#cart-drawer`: fullscreen `100vw`, fondo `#202020` en mobile

HTML agregado en `page.tsx`: `<button id="hamburger-btn">` + `<nav id="mobile-menu">` con vista principal y vista SHOP.

JS agregado en `start.js`: `openMobileMenu()` / `closeMobileMenu()`, toggle SHOP overlay, category links (navegan + filtran), utils triggers, `updateCartCounts()` sincroniza `#mobile-cart-count`.

**Verificación:** `logo.getBoundingClientRect().left === 20` — alineado con `--padding-sides`. Screenshot no disponible (verificar en dispositivo real).

---

### Email templates — responsive + dark mode + Supabase standalone

**Problema encontrado:** Texto cortado en mobile, fondo oscurecido en dark mode.
**Solución adoptada:** Media queries con `!important` en `src/lib/email.ts`. `color-scheme: light only` via `<meta>`. Logo `width: 100% !important` en mobile.

**Nuevos archivos:**
- `auth-confirm-email.html` — template "Activá tu cuenta" con inline styles, `{{ .ConfirmationURL }}`, responsive (heading 56px→32px)
- `auth-reset-password.html` — template "Modificá tu contraseña", misma estructura

**Pendiente:** Pegar HTML en Supabase Dashboard → Authentication → Email Templates.

---

## 2026-04-03

### Fix NAVE payment_id + deploy producción

**Bug raíz:** Soporte NAVE confirmó que `payment_request_id` (POST crear-pago) y `payment_id` (pago real) son entidades distintas. Consultábamos estado con el ID incorrecto → siempre PENDING.

**Fix:** Migración 13 (`nave_payment_request_id`), `crear-pago` guarda en columna nueva, `nave_payment_id` queda NULL hasta webhook, GET fallback solo verifica si webhook ya seteó el ID real, polling 3s×5 en confirmación.

**Test:** Orden #47 — webhook simulado → stock 50→49 → email enviado OK. Deploy a producción (commit `1697363`).

---

## 2026-04-01

### Test e2e completo + 5 fixes críticos

**Contexto:** Sesión de testing integral del flujo compra → pago → stock → envío. Se encontraron y resolvieron 5 bugs.

**Fixes aplicados:**

1. **Colorway MUSCULOSA** — `start.js` tenía `NEGRA`/`BLANCA` (femenino), Supabase tenía `NEGRO`/`BLANCO`. Causaba `variante_id = null`. Fix: cambiar a masculino. Archivo: `start.js`
2. **Sucursales OCA sin límite** — API devolvía todas las sucursales. Fix: `.slice(0, 5)` en `cargarSucursalesOCA()`. Archivo: `start.js`
3. **Race condition stock** — Webhook NAVE y GET fallback podían decrementar stock 2 veces. Fix: migración 12 con flags `stock_decremented` + `email_sent`, checks en ambos handlers. Archivos: `12_stock_idempotency.sql`, `webhooks/nave/route.ts`, `ordenes/[id]/route.ts`
4. **`operativa_oca` = 0** — `cotizar/route.ts` no incluía `operativa` en response → frontend guardaba 0. Fix: agregar campo al map. Archivo: `cotizar/route.ts`
5. **Parser crear-envio** — Buscaba `<int>NUMBER</int>` pero OCA devuelve DataSet XML. Reescrito con 3 formatos de fallback. Archivo: `xml-parser.ts`

**Test OCA e2e exitoso:**
- Crear envío con orden #45 → `idOrdenRetiro: 213902116` ✅
- Anular envío → OK ✅
- Orden restaurada post-test

**NAVE sandbox PENDING:** Tras pago exitoso, API devuelve PENDING en vez de APPROVED. Se simuló APPROVED manualmente (stock 50→49). Pendiente contactar soporte NAVE.

---

## 2026-03-31 (tarde)

### Testing real + 8 fixes del checkout flow

**Contexto:** Naza testeó el flujo completo de checkout con envío OCA por primera vez. 5 issues reportados + 3 adicionales descubiertos durante debugging.

**Fixes aplicados:**

1. **Botón "CONTINUAR AL PAGO" (race condition)** — `setBotonCargando(false)` en `finally` pisaba el texto de Step 2. Fix: flag `step1Success`. Archivo: `start.js`
2. **Parser sucursales OCA** — Buscaba `NewDataSet > Table` con `Entrega === 'True'`, real es `CentrosDeImposicion > Centro` con `IdTipoServicio === 2`. Reescrito. Archivo: `xml-parser.ts`
3. **Parser cotización OCA** — Consolidado: soporta `DataSet > diffgr:diffgram > NewDataSet > Table` (producción) + fallback. Archivo: `xml-parser.ts`
4. **Imagen confirmación** — Path sin `/` causaba 404 por History API. Fix: prefijo `/`. Archivo: `start.js`
5. **CSS confirmación** — `total-label` 0.85rem → 1.3rem, `confirmacion-value` 0.95rem → 0.88rem. Archivo: `globals.css`
6. **Marquee rota** — `enableShopState()` no reinicializaba animación. Fix: force reflow + `initMarquee()`. Archivo: `start.js`
7. **variante_id lookup** — Cambiado de `color` (ambiguo) a `colorway` (único). Archivo: `checkout-logic.js`
8. **Colorway mismatch** — 3 remeras GÜIDO corregidas: `'NEGRO'`→`'NEGRO LOGO BLANCO'`, etc. Campo `colorway` agregado a cart items. Archivo: `start.js`
9. **Dynamic imports** — `ordenes/[id]/route.ts` crasheaba sin `RESEND_API_KEY`. Fix: imports dinámicos.

**NAVE notification_url:** Soporte NAVE confirmó corrección del webhook URL del sandbox.

**Verificación parcial:** Imagen ✅, fuentes ✅, marquee ✅. Cotización/sucursales pendientes en browser.

**Pendiente:** Test e2e completo en main, verificar colorways Termal/Baby Tee.

---

## 2026-03-31

### Diagnóstico completo — revisión sin código nuevo

**Contexto:** Naza reportó que los cambios de la sesión 2026-03-30 "no se veían". Se hizo diagnóstico exhaustivo.

**Causa identificada:** Turbopack cacheó agresivamente archivos de `public/js/`. Los cambios estaban escritos en disco pero el dev server servía la versión anterior. Solución: borrar `.next/` completo antes de cada sesión de testing.

**9 cambios confirmados en archivos (sesión 2026-03-30, no verificados en browser):**

1. `src/lib/oca/xml-parser.ts` — path OCA corregido: `DataSet["diffgr:diffgram"].NewDataSet.Table`. Usa `Total` en vez de `Precio`.
2. `public/js/start.js:2582` — `item.price` → `item.priceValue` (causa raíz de `ValorDeclarado=NaN` → OCA no cotizaba).
3. `public/js/checkout-logic.js:292-313` — variante_id lookup real por precio+color+talle. Antes siempre null.
4. `src/app/api/ordenes/[id]/route.ts` — `numero` en SELECT, total recalculado en PATCH, fallback NAVE verify en GET.
5. `src/app/api/nave/crear-pago/route.ts` — callback_url usa success_url (URL confirmación), no webhook URL.
6. `src/app/api/oca/cotizar/route.ts` — sanitización NaN en valorDeclarado.
7. `src/app/layout.tsx` — suppressHydrationWarning en body.
8. `src/app/globals.css` — container 600px, nota font condensed 0.65rem, white-space: nowrap.
9. `public/js/start.js:1822,1910` — texto nota: `DETALLES ENVIADOS A ${EMAIL}`.

**Problema estructural — NAVE notification_url:**
- URL configurada en NAVE: `https://gccom.vercel.app/api/webhooks/galicia`
- Incorrecto: dominio (gccom vs güidocapuzzi.com) y path (/galicia vs /nave)
- Pendiente: contactar NAVE support para corregir
- Fallback implementado: GET /api/ordenes/[id] verifica pago directo con NAVE API

**Pendiente:**
- Borrar `.next/` y verificar OCA en browser
- Contactar NAVE support
- Test e2e completo post-fixes

---

## 2026-03-27 (tarde)

### Email templates — revisión, fixes y rediseño

**Auth templates (Supabase) — 3 fixes aplicados:**
- `#202020` → `#1A1A1A` en heading y CTA (corrección de paleta)
- Accent bar `#0f0f0f` → `#AD1C1C` (rojo Güido, faltaba en brand)
- `width="200"` → `width="500"` en atributo HTML del logo (Outlook usa el atributo, no el CSS)
- Preview en `email-preview.html` — pendiente de aplicar en Supabase Dashboard manualmente

**`src/lib/email.ts` — rediseñado con sistema visual de marca:**
- Header logo (500px), eyebrow Univers 10px, heading UniversCn Bold 56px, accent-bar `#AD1C1C`
- Total en `#AD1C1C`, CSS en función `emailBaseStyles()` reutilizable
- Dominio display: `güidocapuzzi.com`, href técnico: `guidocapuzzi.com`
- **Archivo nuevo:** `src/lib/email.ts`

**`public/js/start.js` — Purchase Pixel:**
- `fbq('track', 'Purchase', {...})` en `_populateConfirmationFromAPI()`
- Deduplicación via `localStorage` con clave `pixel_purchase_${ordenId}`

### Webhook NAVE — confirmado completo ✅
- Revisión de `src/app/api/webhooks/nave/route.ts` — implementación 100%
- Estado orden, decremento stock (RPC `decrement_stock`), email confirmación, Purchase pixel
- Migración `11_decrement_stock_fn.sql` ejecutada en Supabase ✅
- Pendiente: testear en producción con pago real

### Configuración ventas@ — pendiente
- `ventas@guidocapuzzi.com` es grupo de distribución, no user account
- Pendiente: Google Workspace Admin → habilitar senders externos en el grupo

### Git
- Commit `9c4edb7` — 10 archivos, 1767 líneas
- Push exitoso a `origin/main` ✅

---

## 2026-03-27

### Decisión NAVE vs MercadoPago — resuelta definitivamente
- NAVE gana: banco argentino regulado, comisiones menores en cuotas (~2.82% menos vs MP)
- Estrategia: checkout hosted de NAVE (redirección a URL externa) — descartado SDK embebido
- **Archivo modificado:** `public/js/checkout-payment.js` — reescrito para redirect approach

### Checkout — eliminación del Step 3 intermedio
- **Problema encontrado:** Step 3 (página de pago propia) era innecesario con redirect approach
- **Solución adoptada:** Botón "CONTINUAR AL PAGO" en Step 2 redirige directamente a NAVE — POST a `/api/nave/crear-pago` → `window.location.href = checkout_url`
- Botón muestra "REDIRIGIENDO..." durante el proceso
- **Archivos modificados:** `public/js/start.js`, `public/js/checkout-payment.js`

### Test e2e NAVE sandbox
- Flujo completo probado y aprobado: carrito → Steps 1-2 → NAVE → tarjeta prueba → confirmacion ✅
- Delays en sandbox (~10s + ~13s) son normales, no bugs nuestros

### Confirmación post-pago — fixes
- **Problema:** Imagen del producto no se mostraba
- **Solución:** JOIN en Supabase: `items_orden → variantes_producto → productos(imagenes)`
- **Archivo modificado:** `src/app/api/ordenes/[id]/route.ts`
- **Problema:** Costo de envío aparecía como fila de producto (incorrecto visualmente)
- **Solución:** Envío mostrado junto al tipo: `OCA — Domicilio — $8.000`
- **Archivo modificado:** `public/js/start.js`

### Fix marquee speed
- **Problema:** Al volver al home desde confirmación, velocidad del marquee se alteraba
- **Solución:** `resetHomeAnimations()` fuerza restart de animación CSS + llama `initMarquee()`
- **Archivo modificado:** `public/js/start.js`

### Git
- Push a `origin/main` — Vercel deploy en curso
- CLAUDE.md actualizado: política de push → pedir autorización a Naza, luego ejecutar

---

## 2026-03-16

### Onboarding Claude Code
- Se configuró Claude Code como agente paralelo al proyecto
- Se crearon skills: `/status`, `/db-status`, `/deploy-check`
- Se reorganizó documentación: `backend/docs/` → `docs/internal/`
- Se limpiaron 10 archivos muertos del codebase (SVGs template, script.js vacío, page.module.css)
- Se consolidaron docs duplicados (NAVE, OCA, ARQUITECTURA)

### Diagnóstico NAVE pre-testing
- **Problema encontrado:** `notification_url` no se envía en el request de crear pago → NAVE no sabe dónde mandar el webhook al testear con ngrok
- **Problema encontrado:** Dos webhook handlers incompatibles — `/api/webhooks/galicia` (legacy, campos incorrectos) y `/api/webhooks/nave` (correcto). Naza registró `/galicia` con NAVE
- **Solución adoptada:** Agregar `notification_url` dinámica al request via env var `NAVE_WEBHOOK_URL`, apuntando a `/api/webhooks/nave` para testing con ngrok
- **Archivo modificado:** `src/lib/nave/client.ts` — 4 líneas agregadas
- **Pendiente producción:** Contactar NAVE (`integraciones@navenegocios.com`) para actualizar URL registrada de `/api/webhooks/galicia` a `/api/webhooks/nave`

### Bitácora y skills
- Se creó `docs/BITACORA.md` (este archivo)
- Se creó skill `/bitacora` para actualizar este registro desde Claude Code
- Se ejecutó migración `09_webhook_logs.sql` en Supabase (tabla `webhook_logs`)

---

## 2026-03-17

### Consolidación del repositorio — eliminación de worktrees

**Problema encontrado:** Claude Code había creado dos worktrees automáticamente (`claude/wonderful-fermat` y `claude/agitated-rhodes`) dentro de `.claude/worktrees/`. Esto generó 3 "copias" del proyecto en distintas ramas, confusión sobre dónde vivía cada cambio, y archivos útiles (docs, CLAUDE.md, skills) atrapados en el worktree en lugar de en `main`.

**Diagnóstico:**
- Trabajo de Antigravity (4 archivos, sin commitear): cambios NAVE en `main` de la raíz
- Trabajo de Claude (docs/, CLAUDE.md, commands/, migración 09): en worktree `wonderful-fermat`
- Ambas ramas apuntaban al mismo commit base `9f7d1d4`

**Solución adoptada:**
1. Se creó `.antigravity/` con snapshot del trabajo de Antigravity + nota explicativa para el agente
2. Se copiaron `docs/`, `CLAUDE.md`, `.claude/commands/`, `09_webhook_logs.sql` del worktree a `main`
3. Se fusionaron ambos `client.ts`: fix de montos (Antigravity) + fix `notification_url` (Claude)
4. Se eliminaron las ramas `claude/wonderful-fermat` y `claude/agitated-rhodes`
5. Se borraron archivos basura: `repo_*.txt` (×6), `skills/` (supersedido), `backend/docs/` (migrado), `backend/ARQUITECTURA.md` (supersedido)
6. Se actualizó `.gitignore`: agregado `.claude/worktrees/` y `.antigravity/`
7. Build verificado: `npm run build` ✅ sin errores

**Archivos modificados:** `src/lib/nave/client.ts`, `.gitignore`
**Archivos creados:** `.antigravity/`, `docs/`, `CLAUDE.md`, `.claude/commands/`, `backend/sql/09_webhook_logs.sql`
**Archivos borrados:** `repo_*.txt` (×6), `skills/`, `backend/docs/` (×12 archivos), `backend/ARQUITECTURA.md`

**Pendiente:**
- Naza borra manualmente `.claude/worktrees/` después de reiniciar Claude Code (carpetas físicas, no afectan el repo)
- Contactar NAVE para actualizar URL de webhook registrada: `/galicia` → `/nave`

### Test NAVE #1 — 17/03/2026 ~14:46

**Resultado:** ❌ Error 400 al crear intención de pago

**Log del error:**
```
NAVE payment_request failed (400): {"code":"CLIENT_VALIDATION_FAILED","detail":["Property notification_url not valid in schema"]}
```

**Causa raíz:** El fix de `notification_url` en `client.ts` era incorrecto. La propiedad `notification_url` NO se envía en el body del payment request — se registra a nivel de cuenta con NAVE (por mail/ejecutivo). El schema de la API no la acepta como campo del request.

**Acción inmediata:** Se revirtió el cambio en `client.ts` (eliminadas las 4 líneas que agregaban `notification_url` al body). Se puede eliminar `NAVE_WEBHOOK_URL` de `.env.local` — no sirve para nada.

**Conclusión sobre webhooks en testing local:**
- La `notification_url` está configurada a nivel de cuenta NAVE, no por request
- Naza registró con NAVE: `https://gccom.vercel.app/api/webhooks/galicia` (sandbox)
- Para testing local con ngrok, los webhooks van a seguir llegando a Vercel, no a localhost
- Para verificar pagos en local, se puede: (1) chequear el evento `PAYMENT_MODAL_RESPONSE` del SDK en el browser, (2) consultar el estado del pago via API de NAVE

**Pendiente:** Reintentar el test ahora sin `notification_url` en el body

### Test NAVE #2 — 17/03/2026 ~14:55

**Resultado:** ❌ Error 403 al crear intención de pago

**Log del error:**
```
NAVE payment_request failed (403): {"code":"qr_generator_error","message":"Forbidden"}
```

**Diagnóstico:** Este error NO es nuestro. El request se envía correctamente (el body es válido, la auth funciona, el token se obtiene bien). NAVE falla internamente en su generador de QR en el entorno sandbox. Este es el mismo error `qr_generator_error` que ya se reportó en sesiones anteriores con Antigravity.

**Flujo que sí funciona hasta ahora:**
1. ✅ Frontend llama a `POST /api/nave/crear-pago` con datos correctos
2. ✅ Backend obtiene token NAVE (OAuth2, cache funciona)
3. ✅ Body del request es válido (sin `notification_url`)
4. ❌ NAVE responde 403 con `qr_generator_error` — falla interna de su sandbox

**Sobre el formulario de tarjeta (pregunta de Naza):**
El formulario de tarjeta NO es algo que diseñamos nosotros. Es el SDK de NAVE (`@ranty/ranty-sdk`) que renderiza un iframe embebido dentro de `#nave-payment-container`. Pero el SDK necesita un `payment_request_id` válido para montarse. Como NAVE devuelve error 403 antes de crear la intención, el ID nunca llega al frontend → el SDK nunca se monta → la pantalla queda vacía.

**Opciones:**
1. Reintentar más tarde (el sandbox de NAVE es inestable por momentos)
2. Contactar a NAVE (`integraciones@navenegocios.com`) reportando el error `qr_generator_error` en sandbox
3. Probar en producción (riesgoso sin haber validado en sandbox)

### Página de confirmación post-pago

**Diseño aprobado via preview HTML** (`confirmacion-preview.html`):
- Estética ERD coherente con el resto del sitio
- Animaciones staggered: container fade-in → línea negra expande → datos aparecen escalonados (160ms entre cada uno)
- Badge de cantidad en esquina superior derecha de la imagen del producto (cuadrado negro, bordes redondeados)
- Labels en Univers Regular `font-weight: 200`, nombres de producto en Univers Condensed uppercase
- Botón "VOLVER AL SHOP" con barra roja al hover
- Testeado con 1 y 3 productos — scroll natural del body

**Implementación integrada al codebase:**

| Archivo | Cambio |
|---------|--------|
| `src/app/page.tsx` | Agregada `<section id="confirmation-container">` con estructura HTML |
| `src/app/globals.css` | ~220 líneas de CSS para confirmación (state, layout, productos, animaciones, responsive) |
| `public/js/start.js` | `STATE_CONFIRMATION`, `enableConfirmationState()`, `populateConfirmation()`, `runConfirmationAnimation()`, route detection, restoreState |
| `public/js/checkout-payment.js` | `_onPagoAprobado()` usa SPA navigation via `window.enableConfirmationState()` |
| `next.config.ts` | Rewrite `/checkout/confirmacion` → `/` |

**Flujo:** NAVE SDK reporta pago aprobado → `_onPagoAprobado()` → `enableConfirmationState(ordenId)` → transición animada → datos del carrito + checkout se renderizan dinámicamente → usuario ve resumen con botón para volver al shop

**Build:** ✅ `npm run build` sin errores

### Fix navegación: header desaparecía al volver del confirmación

**Problema encontrado:** Al navegar de confirmación → shop, el header quedaba invisible. La clase `state-confirmation` no se removía del `<body>` en las funciones de navegación de otros estados, y el CSS `body.state-confirmation #main-header { display: none }` seguía activo.

**Solución adoptada:** Se agregó `STATE_CONFIRMATION` a los 8 `classList.remove()` en todas las funciones de navegación (`enableHomeState`, `enableShopState`, `enablePDPState`, `enableAccountState`, `enableContactState`, `enableLegalesState`, `enableCheckoutState`, y new-password handler). También se agregó `confirmation-container` a los arrays de secciones que se ocultan en `enableShopState` y `enableHomeState`.

**Archivo modificado:** `public/js/start.js` — 10 líneas editadas

---

### Estado actual del flujo de pago NAVE — Cierre de sesión 17/03/2026

**Lo que funciona (probado):**
1. ✅ Carrito → Checkout Step 1 (datos personales + dirección)
2. ✅ OCA cotización (aunque devuelve "Sin opciones" en sandbox — esperado)
3. ✅ Orden se crea en Supabase con estado `pendiente` → `envio_calculado`
4. ✅ Backend obtiene token NAVE (OAuth2, cache 24h, refresh automático)
5. ✅ Body del payment request es válido (validado al remover `notification_url`)
6. ✅ Página de confirmación post-pago implementada con animaciones
7. ✅ Navegación SPA funciona ida y vuelta (confirmación ↔ shop)

**Lo que NO funciona (bloqueado por NAVE):**
1. ❌ `POST /payment_request` devuelve 403 `qr_generator_error` — falla interna del sandbox de NAVE
2. ❌ Sin `payment_request_id`, el SDK de NAVE no puede montarse → no aparece formulario de tarjeta ni QR
3. ❌ Los webhooks no se pueden testear porque el pago nunca se completa

**Pasos para reintentar el test de NAVE:**

```
Prerequisitos:
  Terminal 1: npm run dev (localhost:3000)
  Terminal 2: ngrok http 3000 (para que NAVE pueda alcanzar los webhooks)
  .env.local: NAVE_CALLBACK_URL=https://[tu-ngrok]/api/webhooks/nave

Test:
  1. Abrir https://[tu-ngrok].ngrok-free.dev en Chrome
  2. Agregar producto al carrito → PAGAR
  3. Completar Step 1 (datos) y Step 2 (envío)
  4. En Step 3 (pago), observar la consola del browser y la terminal de dev

Resultado esperado si NAVE sandbox anda:
  - POST /api/nave/crear-pago → 200 (devuelve payment_request_id)
  - El SDK @ranty/ranty-sdk se monta en #nave-payment-container
  - Aparece formulario de tarjeta + QR para MODO
  - Se puede pagar con tarjeta sandbox: 4507 9905 2891 0139
  - Webhook llega a /api/webhooks/nave → orden pasa a "pagado"
  - Frontend muestra página de confirmación con animación

Resultado actual (17/03/2026):
  - POST /api/nave/crear-pago → 500 (NAVE devuelve 403 qr_generator_error)
  - SDK no se monta, pantalla vacía
  - No se puede avanzar

Acción recomendada:
  - Reintentar en 24-48h (el sandbox puede estar temporalmente caído)
  - Si persiste, enviar mail a integraciones@navenegocios.com:
    "Estamos integrando NAVE en sandbox. Al crear una intención de pago
    recibimos 403 con code: qr_generator_error, message: Forbidden.
    Nuestro POS ID es [NAVE_POS_ID]. ¿El sandbox está operativo?"
  - Pendiente producción: actualizar URL de webhook con NAVE de
    /api/webhooks/galicia → /api/webhooks/nave
```

---

## 2026-03-18

### Integración SDK NAVE — Checkout embebido funcionando

**Problema encontrado:** El código anterior intentaba usar el SDK como una clase JS (`new RantySDK().mount()`), pero `@ranty/ranty-sdk` es un **Web Component** (`<payfac-sdk>`). Esto causaba `TypeError: _sdkInstance.mount is not a function`.

**Segundo problema:** El SDK tiene 3 ambientes (`sandbox`, `staging`, `production`), no 2. Estábamos pasando `env="staging"` que apunta a `e3-api.ranty.io` (404), cuando las credenciales son de `sandbox` que apunta a `api-sandbox.ranty.io`.

**Tercer problema:** La `publicKey` requerida por el SDK es el **POS ID** (no el CLIENT_ID ni una credencial separada). Esto se descubrió analizando el source del SDK y probando contra el endpoint `/sdk/signer`.

**Solución adoptada:**
1. Reemplazado `new RantySDK().mount()` → `document.createElement('payfac-sdk')` con atributos `paymentRequestId`, `publicKey` (POS ID), `env` (sandbox)
2. Import dinámico del módulo CDN solo registra el web component
3. Backend devuelve `NAVE_POS_ID` como `public_key` al frontend
4. Env pasa directo (`sandbox` → `sandbox`, no `staging`)

**Archivos modificados:**
- `public/js/checkout-payment.js` — `_montarSDK()` reescrita como web component
- `src/app/api/nave/crear-pago/route.ts` — devuelve `public_key: NAVE_POS_ID`
- `src/app/globals.css` — container SDK con min-height 500px

**Resultado:** ✅ SDK de NAVE carga y muestra opciones de pago (QR + Tarjeta) dentro de la página

**Pendiente:** Personalizar estética del SDK (fuente, colores), fix event listener para capturar resultado del pago

### Pago end-to-end completado — Tarjeta sandbox

**Resultado:** ✅ Pago completado con tarjeta sandbox `4507 9905 2891 0139`

**Fixes aplicados en esta sesión:**
1. **Event listener corregido** — El SDK emite eventos `SUCCESS_PROCESSED`, `FAILURE_PROCESSED`, `BLOCKED`, etc. via `postMessage`. El listener anterior buscaba `PAYMENT_MODAL_RESPONSE` (inexistente). Corregido para escuchar los tipos reales.
2. **Inyección recursiva de estilos al Shadow DOM** — Implementada función `_walkAndInject()` que recorre todos los shadow roots anidados (el SDK tiene web components dentro de web components). Escanea 20 veces cada 500ms para atrapar componentes que se renderizan tarde. Funciona parcialmente — algunos estilos se aplican, otros no por la profundidad del anidamiento.
3. **Botón PAGAR eliminado** — El SDK tiene su propio botón interno. Nuestro botón era redundante y se quedaba en "PROCESANDO..." porque nunca recibía el evento.

### ❌ UX del SDK embebido — Inaceptable para producción

**Problema fundamental:** El SDK de NAVE renderiza su propio UI completo dentro de un Shadow DOM cerrado:
- Título ("Pagá a Jhon Foo FC")
- Detalle de la compra (productos, montos)
- Selector QR / Tarjeta
- Formulario de tarjeta completo
- Botón de pago

Esto **duplica** información que ya mostramos nosotros y **rompe la estética** de GÜIDO. El Shadow DOM impide personalización real — la inyección de estilos es frágil, incompleta, y se puede romper con cualquier update del SDK.

**Página de confirmación:** Se alcanzó pero tiene errores de display — precios mal formateados y símbolo de cantidad incorrecto.

### 🔄 Decisión pendiente: Futuro del gateway de pagos

**Opción 1 — NAVE externalizado:** Redirigir al `checkout_url` de NAVE (hosted page), redirigir de vuelta post-pago.
- ✅ Comisiones bajas + meses de bonificación
- ❌ El usuario sale del sitio
- ❌ Documentación mínima, sandbox inestable

**Opción 2 — MercadoPago Checkout API:** Migrar completamente a MP con formulario de tarjeta propio (HTML nativo).
- ✅ Control total del UI (inputs HTML normales, CSS propio)
- ✅ Documentación excelente, SDKs oficiales (JS + Node.js), sandbox estable
- ✅ Más métodos de pago (tarjeta, QR MP, Rapipago, etc.)
- ⚠️ Comisiones más altas
- ⚠️ ~10h de trabajo de migración

**Estado:** Naza evaluando opciones. Se generó análisis exhaustivo en `docs/MERCADOPAGO_CHECKOUT_API.md`.

### Estado de cierre — 18/03/2026

**Lo que funciona (probado end-to-end):**
1. ✅ Carrito → Checkout Step 1 → Step 2 → Step 3 → Pago → Confirmación
2. ✅ NAVE SDK carga y procesa pagos en sandbox
3. ✅ Eventos del SDK capturados correctamente (`SUCCESS_PROCESSED`)
4. ✅ Navegación SPA post-pago funciona (confirmación → shop)

**Problemas abiertos:**
1. ❌ UX del SDK NAVE inaceptable para producción (ver arriba)
2. ❌ Página de confirmación con errores de display (precios, cantidades)
3. ❌ Webhook URL registrada con NAVE sigue siendo `/api/webhooks/galicia`
4. 🔄 Decisión gateway pendiente (NAVE externalizado vs MercadoPago)

---

## 2026-03-19

### Segundo cerebro — Sistema de registros
- Se definió y documentó el sistema de 3 registros: Bitácora (técnico) / Memoria (conversacional) / Diario (personal de Naza)
- Se actualizó `_Claude Instructions.md` del vault con workflow obligatorio de sesión
- Se actualizó `CLAUDE.md` del repo con sistema de registros obligatorio
- Se actualizó `/wrap-up` skill para incluir paso de Memoria

### Credenciales y accesos
- `Contraseñas.md` reestructurada: template completo para Supabase, Vercel, OCA, NAVE, Resend, Hostinger, GitHub + tabla de ~28 env vars
- Credenciales de Supabase pobladas (Project ID, API URL, usuario DB, anon key, service_role, publishable key, secret key)
- Deployment URL de Vercel agregada
- `API Keys y credenciales.md` reestructurada como referencia técnica (endpoints, auth flows, SDKs)

### Herramientas Obsidian instaladas
- mcpvault (MCP server) instalado globalmente via npm + configurado en `.mcp.json` del repo
- kepano/obsidian-skills instaladas en vault `.claude/skills/` (5 skills: markdown, CLI, bases, canvas, defuddle)

### Vault actualizado
- `_Index.md` — secciones ACCESOS y SEGUIMIENTO ampliadas con Memoria, Diario, Contraseñas, API Keys
- `Diario/Notas.md` — template copiable creado para Naza
- `Memoria.md` — reestructurada con header y primera entry
- Plan Activo actualizado: decisión NAVE vs MercadoPago como tarea desbloqueada, worktree lucid-curie en backlog

### Vault como sistema operativo — WIDO y Automatizaciones (tarde)
- Naza escribió primera entry en Diario con takeaways del podcast Greg Isenberg (Obsidian + Claude Code)
- Se transcribieron imágenes del podcast (screenshots de commands) y se incorporaron al texto
- `WIDO.md` reestructurada: visión del sistema, arquitectura (diagrama), roadmap técnico, análisis Cowork/Dispatch, filosofía
- `Automatizaciones.md` reestructurada: diagrama del sistema, componentes (Supabase, Meta Ads, IG, TikTok, WhatsApp), tabla de agentes/subagentes, 3 opciones de metodología (n8n/scripts/OpenClaw)
- `Comandos.md` creada: 8 activos + 15 propuestos, cruce con skills existentes, priorización (alta/media/baja)
- `Ideas.md` creada con template y sistema de marcado
- 6 nuevos slash commands implementados: `/hoy`, `/cerrar-dia`, `/semana`, `/contexto [tema]`, `/conectar [A] [B]`, `/mapa`
- Imágenes del podcast movidas de root a `assets/` con nombres descriptivos
- `_Index.md` actualizado: secciones TECH y SEGUIMIENTO ampliadas

---

## 2026-03-20

### Cookie consent banner — diseño + integración

**Diseño:** Se diseñó y aprobó via preview HTML (`public/cookie-consent-preview.html`) un banner de consentimiento de cookies estilo barra inferior fija. Estética coherente con GÜIDO: fondo `#FAFAFA`, texto Univers Regular, botón ACEPTAR en Univers Condensed con animación fill izq→der (misma que `btn-rect` del home), botón Rechazar con hover rojo GÜIDO (`#AD1C1C`).

**Integración al sitio:**

| Archivo | Cambio |
|---------|--------|
| `src/app/page.tsx` | Agregado `<div id="cookie-consent">` con banner HTML (texto + link Política de Cookies + botones) |
| `src/app/globals.css` | ~100 líneas: animación slide-in/out, estilos del banner, botón con `::before` fill animation, hover rojo en rechazar |
| `public/js/start.js` | IIFE `initCookieConsent()`: localStorage check, accept/decline handlers, hook `activateTracking()` para futuro Meta Pixel/analytics |

**Comportamiento:**
- Aparece 1.5s después de cargar la página (slide-up suave)
- Al aceptar → guarda `guido_cookie_consent: accepted` en localStorage, llama `activateTracking()` (TODO: Meta Pixel, GA)
- Al rechazar → guarda `declined`, solo cookies esenciales
- Si ya aceptó/rechazó → no se muestra
- Link "Política de Cookies" apunta a sección legales existente (`data-section="cookies"`)

**Build:** ✅ `npm run build` sin errores

### OCA — credenciales webservice

Se contactó a soporte OCA ePak para obtener `OCA_USUARIO` y `OCA_CLAVE` (credenciales webservice XML). Respuesta estimada: semana que viene. Datos ya confirmados: `OCA_OPERATIVA_PP=464200`, `OCA_OPERATIVA_PS=464201`, `OCA_NUMERO_CUENTA=197239/000`, `OCA_CUIT=33719179199` (sin guiones). `OCA_SANDBOX=false` es correcto (OCA no tiene sandbox real; se testea con `confirmarRetiro: false`).

### Mobile responsiveness — documentación

Se creó nota `Tech/Mobile Responsiveness.md` en vault Obsidian documentando:
- Estado actual: sitio exclusivamente desktop, no hay breakpoints
- Tabla de cada componente y qué se rompe en mobile (header dropdown, product hover, PDP layout, cart sidebar, etc.)
- Plan de adaptación en 3 fases: fundamentos → animaciones táctiles → optimización mobile-specific
- Mapping hover→touch por componente
- Decisiones pendientes (hamburger vs bottom nav, scroll snap en mobile, etc.)

**Decisión:** Approach desktop-first. Mobile se hace después de cerrar el flujo desktop completo.

### Vault actualizado
- `Tech/Mobile Responsiveness.md` — nueva nota completa
- `Ejecución/Plan Activo.md` — cookie consent + OCA credenciales + mobile como tarea bloqueada
- `_Index.md` — agregada Mobile Responsiveness en sección TECH

### Backend health check — limpieza Supabase
- Se eliminaron 28 órdenes de test (estados pendiente, envio_calculado, pago_pendiente) + clientes, items, direcciones huérfanas
- Se eliminaron 2 cuentas de test de `auth.users` (quedó solo la cuenta real de Naza)
- Se eliminó 1 webhook_log de prueba de Galicia
- Se verificó que migración `09_webhook_logs.sql` estaba ejecutada
- Base de datos limpia: 0 órdenes, 0 clientes, 0 items, 0 direcciones (ready para producción)

### Migración 10 — RLS para dashboard de usuario
- Creada y aplicada `10_dashboard_rls.sql`: políticas SELECT en `ordenes` e `items_orden` para que usuarios autenticados lean sus propias órdenes (matchea por `auth.email()` contra `clientes.email`)
- Archivo guardado en `backend/sql/10_dashboard_rls.sql`

### Auth UX — mejoras post-login/signup
- **Post-login:** Saludo personalizado `¡BIENVENIDO/A, NOMBRE!` (interpolado desde `user_metadata`). Eliminado `location.reload()` — ahora navega directo al dashboard sin recarga
- **Post-signup:** Texto de instrucciones agregado: "REVISÁ TU BANDEJA Y HACÉ CLICK EN EL LINK DE CONFIRMACIÓN." + fade automático al login después de 4 segundos
- **Post-email-confirm:** Ahora rutea directo al dashboard si la sesión está activa (antes mostraba login con mensaje)

### Dashboard de usuario (/cuenta) — infraestructura
- Sección `#account-dashboard` agregada en `page.tsx`: saludo personalizado, datos del usuario (nombre, apellido, email), botón "CERRAR SESIÓN"
- `enableAccountState()` refactorizada: ahora hace `getSession()` y brancha entre `_showAccountLogin()` (sin sesión) y `_showAccountDashboard()` (con sesión)
- Logout funcional: `supabaseClient.auth.signOut()` → muestra login
- El diseño final del dashboard se trabajará como HTML separado (iterativo con Naza)

**Archivos modificados:** `src/app/page.tsx`, `public/js/start.js`
**Archivos creados:** `backend/sql/10_dashboard_rls.sql`

### Plan estratégico documentado
- Se generó plan comprehensivo en `.claude/plans/` cubriendo 6 temas: backend health, automatizaciones (n8n), Google Workspace, Meta Ads, dashboard usuario, auth UX
- Roadmap organizado por desbloqueadores (ahora / Workspace / gateway / contenido)
- Estructura de cuentas Workspace propuesta: `ncgc@`, `fmgc@`, `pedidos@`, `hola@`, `no-reply@` en `güidocapuzzi.com`
- Nota sobre dominio IDN: Google Workspace soporta `güidocapuzzi.com` (Punycode: `xn--gidocapuzzi-thb.com`), pero algunos servicios de terceros pueden rechazar la ü

### Google Workspace — registro de dominio y setup de emails

**Problema encontrado:** Google Workspace no permite usar `@güidocapuzzi.com` (con ü) en el campo de email de contacto del formulario de pago. Hubo confusión inicial: el campo de "Contacto principal" pide un email de recuperación preexistente (no el email de Workspace), pero en ese punto se decidió reconsiderar el dominio.

**Decisión adoptada:** Registrar `guidocapuzzi.com` (ASCII, sin ü) en Hostinger como dominio operativo. Costo: ~$10-15 USD/año. Motivo: Workspace, Resend, Meta Business y otros servicios van a usar esta dirección — tener la ü en el dominio operativo era un riesgo real (formularios que la rechazan, servicios que no la soportan correctamente).

**Arquitectura resultante:**
- `güidocapuzzi.com` — URL del sitio web (dominio de marca, ya registrado)
- `guidocapuzzi.com` — dominio operativo: emails, APIs, servicios. Redirige a `güidocapuzzi.com`

**Google Workspace configurado** con `guidocapuzzi.com` como dominio primario. Cuentas creadas:

| Email | Uso |
|-------|-----|
| `ncgc@guidocapuzzi.com` | Admin principal — Naza |
| `fmgc@guidocapuzzi.com` | Socio (Fede) |
| `ventas@guidocapuzzi.com` | Sender para emails transaccionales (Resend) |
| `info@guidocapuzzi.com` | Email público en el sitio + Instagram bio |
| `no-reply@guidocapuzzi.com` | Sender de Supabase Auth (confirm/recovery) |

**Desbloqueado por Workspace:**
- Configurar SMTP custom en Supabase Auth (elimina delay 5-10min, mejora sender)
- Verificar dominio en Resend (habilita `ventas@guidocapuzzi.com` para emails de compra)
- Instalar Meta Pixel con consent mode (siguiente paso: crear cuenta Meta Business)

**Skill `/como-sigo` creado** — devuelve top 5 pasos priorizados leyendo plan + handoff + bitácora, sin argumentos necesarios.

---

## 2026-03-21

### Migración de cuentas — Supabase y Resend
- Supabase migrado a `ncgc@guidocapuzzi.com` (cuenta del dominio operativo)
- Resend migrado a `ncgc@guidocapuzzi.com`
- Stack operativo centralizado bajo el dominio del negocio

### Supabase Auth SMTP configurado
- Host: `smtp.gmail.com`, Puerto: 587 (STARTTLS)
- App Password de Google Workspace configurado en Supabase Auth settings
- Sender: `no-reply@guidocapuzzi.com` (alias de `ncgc@guidocapuzzi.com`)
- Elimina el delay de 5-10min del SMTP de Supabase por defecto

### Meta Business Suite — setup completo desde cero
- Meta Business Suite creada con `ncgc@guidocapuzzi.com`
- Ad Account creada: **GÜIDO ADS** (ID: `1303341605016642`)
- Pixel creado: **GÜIDO Pixel** (ID: `1882249755738633`)
- Instagram @gu.idocapuzzi conectada al portfolio
- Dominios verificados en Meta:
  - `guidocapuzzi.com` (ID: 1017941284742082)
  - `xn--gidocapuzzi-thb.com` — Punycode de `güidocapuzzi.com` (ID: 4346137195666577)
- Bug encontrado y resuelto: el Pixel no se podía crear hasta tener una Ad Account activa primero

### Meta Pixel — instalación con Consent Mode v2

**`src/app/layout.tsx`:**
- fbq stub con `noscript` fallback
- `consent('default', { ad_storage: 'denied', analytics_storage: 'denied' })` por defecto
- `fbq('init', PIXEL_ID)` — inicialización sin disparar PageView hasta consentimiento

**`public/js/start.js`:**
- `activateTracking()`: `consent('update', { ad_storage: 'granted', analytics_storage: 'granted' })` + `fbq('track', 'PageView')`. Llamada desde `initCookieConsent()` al aceptar.
- `ViewContent` disparado en `enablePDPState()` con `content_name`, `content_ids`, `value`, `currency`
- `AddToCart` disparado en `addToCart()` con `content_name`, `content_ids`, `value`, `currency`, `num_items`
- `InitiateCheckout` disparado en `enableCheckoutState()` con `num_items`, `value`, `currency`
- Purchase event pendiente (requiere gateway funcional)

**Flujo Consent Mode v2:**
1. Usuario carga el sitio → Pixel inicializado, tracking bloqueado (denied)
2. Cookie banner aparece (1.5s delay)
3. Usuario acepta → `activateTracking()` → grant + PageView
4. Eventos de comportamiento (ViewContent, AddToCart, InitiateCheckout) solo si aceptó

**Build:** `npm run build` sin errores

### Pixel ID corregido y timing fix
- **Pixel ID corregido:** `1303341605016642` era el Ad Account ID, no el Pixel ID. Pixel real: `1882249755738633`. Corregido en `layout.tsx`
- **Timing fix:** `<Script strategy="afterInteractive">` → `<script dangerouslySetInnerHTML>` sincrónico en `<head>` (fbq no estaba disponible para usuarios con cookies ya aceptadas)
- **Pixel verificado:** 200 OK a `facebook.com/tr` en Chrome Network tab

### Resend — dominio verificado
- Dominio: `guidocapuzzi.com` (reemplazó `xn--gidocapuzzi-thb.com`, plan free = 1 dominio)
- Habilita `ventas@guidocapuzzi.com` para emails transaccionales

### Migración de cuentas — Vercel y GitHub
- Vercel: `ncgc@guidocapuzzi.com` (usuario: `nccapuzzigc`)
- GitHub: `ncgc@guidocapuzzi.com` como primario
- Stack completo centralizado bajo dominio del negocio

### Deploys a producción
- 3 deploys a `gc.com` (Vercel). Proyecto duplicado "guidocapuzzi" pendiente de eliminar

### Cambio de paleta — Negro profundo
- `#202020` → `#1A1A1A` en 12 archivos (9 repo + 3 vault)

### Skills y documentación
- Skill `/sync` creado — renombre de `/wrap-up`, comando unificado de cierre de sesión
- `/sync-bitacora` eliminado (redundante)
- `CLAUDE.md` actualizado con skills vigentes
- Nota `Tech/Meta.md` creada en vault: guía completa del pixel + log de cambios

---

## 2026-03-23

### Dashboard de cuenta `/cuenta` — diseño final e implementación
- Diseño iterado con Naza via preview HTML (`public/cuenta-preview.html`) antes de integrar
- Layout dos columnas estilo legales: sidebar sticky (izquierda) + contenido principal (derecha)
- Sidebar: título "CUENTA" (clamp 3rem–4.5rem), nav links (Mis Pedidos / Mis Datos), botón CERRAR SESIÓN
- Botón logout: rectángulo negro, hover fill izq→der en rojo GÜIDO, Univers 67 Condensed uppercase — matchea CTAs del home
- Nav links: opacity 0.35 → negrito+underline al activar, hover underline animado
- Sección "Mis Datos": filas label/value con separadores, pobladas desde `user.user_metadata` de Supabase auth
- Sección "Mis Pedidos": placeholder con link a /shop. CSS preparado para órdenes reales con status badges
- Greeting sutil: "BIENVENIDO, NOMBRE." en Univers Regular, opacity 0.35
- Responsive: <900px colapsa a columna única, sidebar estática, nav horizontal
- **Archivo modificado:** `src/app/page.tsx` — sección `#account-dashboard` reescrita
- **Archivo modificado:** `src/app/globals.css` — ~200 líneas CSS de cuenta dashboard
- **Archivo modificado:** `public/js/start.js` — `_showAccountDashboard()` + `_initCuentaNav()` nueva

### Bug: dashboard aparecía y desaparecía (flash)
- **Problema encontrado:** Después del login, el dashboard hacía un flash (aparecía y desaparecía). La página quedaba en blanco.
- **Causa raíz:** CSS tenía `#account-dashboard { opacity: 0; }`. La función `transitionState()` anima el enter (sets inline `opacity: 1`), pero al completar (420ms) limpia todos los inline styles (`enterEl.style.opacity = ''`). Al limpiar el inline, el CSS `opacity: 0` tomaba control → dashboard invisible.
- **Solución adoptada:** Eliminar `display: none; opacity: 0; transition` del CSS de `#account-dashboard`. La visibilidad la controla `transitionState()` exclusivamente via inline styles del HTML.
- **Lección:** Nunca poner `opacity: 0` en CSS para secciones manejadas por `transitionState()` — esa función espera que al limpiar inline styles, el elemento quede visible.

### Kapso — exploración como capa WhatsApp de WIDO
- Kapso (kapso.ai) es plataforma completa: SDK TypeScript, MCP server alpha, 3 agent skills, claude-code-whatsapp, inbox, broadcasts
- Cuenta creada, API key obtenida. Free tier: 2K msgs/mes
- **Bloqueado:** Flujo de "Digital phone numbers" requería conectar número personal a WhatsApp Business API — no deseado
- **Decisión:** Abortar por ahora. Comprar SIM dedicada para la marca en el futuro y reconectar

### obsidian-git — vault sincronizada a GitHub
- Repo privado `naza89/gu.ido-vault` creado en GitHub
- Git inicializado en vault, `.gitignore` excluye archivos sensibles
- Commit inicial: 74 archivos. Push exitoso
- Plugin obsidian-git instalado: auto-backup cada 10 min
- **Propósito:** Bridge vault→cloud para integraciones futuras (Kapso, WIDO, servicios cloud)
