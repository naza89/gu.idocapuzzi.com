# GÜIDO CAPUZZI — Bitácora del Proyecto

Registro cronológico de decisiones, problemas resueltos y cambios importantes.

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
