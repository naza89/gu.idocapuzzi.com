# GÜIDO CAPUZZI — E-commerce

E-commerce de moda independiente argentina. Next.js (App Router) + Supabase + Vercel.
Pagos con NAVE (Banco Galicia), envíos con OCA ePak. Dominio: guidocapuzzi.com

## Comandos

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Build producción
npm run start    # Servidor producción
npm run lint     # ESLint
```

## Estructura de carpetas

```
src/
  app/
    page.tsx              # Página única — inyecta HTML vía dangerouslySetInnerHTML
    layout.tsx            # Root layout (metadata, globals.css)
    globals.css           # Estilos globales
    api/
      health/             # GET — healthcheck
      nave/crear-pago/    # POST — crear intención de pago NAVE
      oca/                # cotizar, sucursales, centros-costo, crear-envio, etiqueta, tracking, anular
      ordenes/[id]/       # PATCH — actualizar orden con info de envío
      webhooks/nave/      # POST — webhook de notificación NAVE
      webhooks/galicia/   # POST — webhook alternativo Galicia
  lib/
    supabase.ts           # Clientes admin (service_role) y anon
    nave/client.ts        # OAuth2 + crear pago + verificar pago
    oca/                  # config, client, xml-generator, xml-parser, calculators, types, validations
public/
  js/
    start.js              # APP PRINCIPAL (3220 líneas) — SPA vanilla JS, navegación, carrito, UI
    checkout-logic.js     # Checkout Step 1-2 (formulario + Supabase + OCA cotización)
    checkout-payment.js   # Checkout Step 3 (NAVE SDK + QR)
    supabase-config.js    # Cliente Supabase browser + helpers de stock
  assets/                 # brand/, fonts/, icons/, images/products/
backend/
  sql/                    # 9 migraciones SQL (01 a 09, ejecutar en orden en Supabase SQL Editor)
docs/
  ARCHITECTURE.md         # Arquitectura técnica completa
  BRAND_GUIDELINES.md     # Paleta, tipografía, tono, reglas de marca
  GAPS_AND_TODOS.md       # Estado real y tareas pendientes
  NAVE_CHECKOUT_API_DOCS.md  # API reference NAVE
  OCAePak.md              # API reference OCA
  internal/               # Guías internas y planes de integración
```

## Arquitectura clave

- **SPA híbrida**: `page.tsx` inyecta HTML estático, `start.js` maneja toda la lógica client-side
- **No hay React components** — todo es vanilla JS con manipulación DOM directa
- **Routing**: Next.js rewrites (`/shop`, `/shop/:slug`, `/cuenta`, `/contacto`) → `page.tsx`. `start.js` usa History API
- **Carrito**: Array en memoria JS (`let cart = []`), renderizado en DOM, no persiste en backend
- **Precios**: En centavos en Supabase (`precio_centavos`), convertidos a ARS en frontend

## Base de datos (Supabase)

**Tablas:** `productos`, `variantes_producto`, `clientes`, `direcciones_envio`, `ordenes`, `items_orden`

**Estados de orden:** `pendiente` → `envio_calculado` → `pago_pendiente` → `pagado` → `preparando` → `enviado` → `entregado` | `cancelado`

**Convenciones:**
- SKU: `TIPO-MODELO-COLOR-TALLE` (ej: `REM-LOGO-NBL-XS`)
- Precios siempre en centavos (integer)
- UUID para todos los IDs
- `anon key` para frontend (RLS), `service_role` para backend (bypass RLS)

## Integraciones externas

### NAVE (pagos) — Estado: código implementado, sandbox inestable
- Auth OAuth2 con token cache (24h, refresh a 5min del vencimiento)
- `POST /api/nave/crear-pago` → crea intención de pago
- `POST /api/webhooks/nave` → recibe notificación (responde 200 inmediato, procesa async)
- SDK `@ranty/ranty-sdk` embebido para tarjetas, QR para MODO
- Sandbox tuvo errores de timeout (stores_error, qr_generator_error) — problemas del lado NAVE
- Migración `08_nave_payment.sql` ya ejecutada

### OCA ePak (envíos) — Estado: cotización y sucursales funcionando, crear envío pendiente de test
- Todas las API routes implementadas (cotizar, sucursales, crear-envio, tracking, etiqueta, anular)
- XML sobre HTTP, proxy via Next.js API routes (OCA no tiene CORS)
- Dependencia: `fast-xml-parser` para parseo XML
- Migración `07_oca_envios.sql` ya ejecutada

## Convenciones de código

- TypeScript en `src/` (strict mode), vanilla JS en `public/js/`
- Path alias: `@/*` → `./src/*`
- API routes usan `createAdminClient()` de `@/lib/supabase`
- Respuestas API: `NextResponse.json({ ... })` con status codes apropiados
- Variables de entorno: `NEXT_PUBLIC_*` para frontend, sin prefijo para backend

## No hacer sin consultar

- No modificar CSS/estilos — ver @docs/BRAND_GUIDELINES.md
- No reestructurar `start.js` ni `page.tsx` sin discutirlo
- No hacer `git push` — Naza pushea manualmente
- No instalar dependencias nuevas sin confirmar
- No tocar `.env.local`

## Knowledge Base (Obsidian Vault)

Para contexto operativo del negocio (costos, clientes, proveedores, procesos), consultar el vault:

```
C:\Users\LAUTA\ObsidianVaults\GÜIDO\
```

Archivos clave:
- `_Index.md` — Dashboard y navegación del vault
- `_Claude Instructions.md` — Cómo interpretar el vault y convenciones
- `Ejecución/Plan Activo.md` — Tareas con dependencias (qué está bloqueado y por qué)
- `Ejecución/Handoff Notes.md` — Notas de continuidad entre sesiones
- `Bitácora/Página Web.md` — Log de avances (espejo de `docs/BITACORA.md`)
- `Memoria.md` — Diario de conversaciones (decisiones, Q&A, insights)
- `Diario/Notas.md` — Documentación personal de Naza (template, no tocar entries)
- `Contraseñas.md` — Credenciales y accesos (vault privado)
- `API Keys y credenciales.md` — Referencia técnica de APIs

### Sistema de registros (OBLIGATORIO)

Cada sesión DEBE actualizar al cerrar (`/wrap-up`):

1. **Bitácora** (vault `Bitácora/Página Web.md` + repo `docs/BITACORA.md`) — Qué se hizo técnicamente. Tono factual, tercera persona.
2. **Memoria** (vault `Memoria.md`) — Qué se discutió y decidió. Tono personal, primera persona (como si escribiera Naza).
3. **Handoff Notes** (vault `Ejecución/Handoff Notes.md`) — Contexto para la próxima sesión.
4. **Plan Activo** (vault `Ejecución/Plan Activo.md`) — Marcar tareas completadas, agregar nuevas.

El agente **NO** escribe en `Diario/Notas.md` — eso es personal de Naza.

**Regla:** Si se trabajó en el proyecto, se registra en Obsidian. Sin excepciones.

### Skills de sesión
- `/resume` — Inicio de sesión: lee handoff notes + plan activo + bitácora + git log
- `/wrap-up` — Cierre de sesión: actualiza handoff notes + plan + bitácora + **memoria**
- `/status-guido` — Dashboard del negocio: catálogo, stock, órdenes, progreso
- `/sync-bitacora` — Sincroniza bitácora entre repo y vault

## Documentación detallada

- `docs/BRAND_GUIDELINES.md` — Paleta (#FAFAFA, #AD1C1C, #442517, #202020), tipografía, tono
- `docs/ARCHITECTURE.md` — Arquitectura técnica completa
- `docs/GAPS_AND_TODOS.md` — Estado real y tareas pendientes
- `docs/NAVE_CHECKOUT_API_DOCS.md` — API reference NAVE completa
- `docs/OCAePak.md` — API reference OCA completa
- `docs/internal/` — Guías internas: plan activo, guía Supabase, integración NAVE/OCA
- `docs/BITACORA.md` — Registro cronológico de decisiones y cambios del proyecto
