# GÜIDO CAPUZZI — Bitácora del Proyecto

Registro cronológico de decisiones, problemas resueltos y cambios importantes.

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
