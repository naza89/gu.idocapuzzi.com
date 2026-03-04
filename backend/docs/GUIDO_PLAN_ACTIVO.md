# GÜIDO CAPUZZI — Plan Activo de Backend
> Documento maestro unificado. Última actualización: 2 de Marzo, 2026.
> Reemplaza: PLAN_MAESTRO_INTEGRACION.md + PLAN_INFRAESTRUCTURA_GALICIA_NAVE.md

---

## Estado del proyecto al día de hoy

| Capa | Estado | Detalle |
|---|---|---|
| **Infraestructura** | ✅ Operativa | Next.js en Vercel, dominio `güidocapuzzi.com`, HTTPS, CI/CD desde GitHub |
| **Supabase** | ✅ Conectado | URL y anon key en `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` pendiente de cargar |
| **Frontend — Checkout Step 1** | ✅ Completo | `checkout-logic.js` → crea cliente + dirección + orden en Supabase |
| **Frontend — Checkout Step 2** | ✅ Completo | `start.js` → cotiza OCA por CP, muestra opciones |
| **Frontend — Checkout Step 3** | ✅ Completo | `checkout-payment.js` → SDK NAVE (tarjeta) + QR, botón PAGAR, animación, redirect |
| **Backend OCA — cotizar** | ✅ Completo | `POST /api/oca/cotizar` operativo |
| **Backend OCA — sucursales** | ✅ Completo | `GET /api/oca/sucursales` operativo |
| **Backend OCA — crear-envio** | 🔲 Fase 2 | No bloquea el flujo de pago |
| **Backend NAVE — crear-pago** | 🔲 BLOQUEANTE | Bloquea todo el Step 3 |
| **Backend NAVE — webhook** | 🔲 BLOQUEANTE | Sin esto el pago nunca se confirma en BD |
| **PATCH /api/ordenes/[id]** | 🔲 BLOQUEANTE | Sin esto el envío elegido no se persiste antes del pago |
| **SQL columnas NAVE** | 🔲 EJECUTAR YA | `08_nave_payment.sql` — sin esto el webhook no puede actualizar la orden |
| **Sandbox NAVE — end-to-end** | 🔲 Bloqueado | Disponible una vez implementado el backend |

---

## Orden de implementación (Fase 1 — Pagos)

### 1 · Ejecutar SQL en Supabase `08_nave_payment.sql`
Prerrequisito absoluto. Sin las columnas `nave_payment_id` y `nave_status` el webhook no tiene dónde escribir.

```bash
# Archivo: backend/sql/08_nave_payment.sql
# Ir a Supabase Dashboard > SQL Editor > New query > pegar > Run
```

### 2 · `PATCH /api/ordenes/[id]` — Persistir envío elegido

**Gap identificado en `diagrama_flujo_pagos.html`**: al confirmar envío en Step 2, el backend no actualiza la orden con `tipo_envio` y `precio_envio`. La orden queda incompleta antes de pasar al Step 3.

**Archivo**: `src/app/api/ordenes/[id]/route.ts`

```typescript
// PATCH /api/ordenes/{id}
// Llamado desde start.js al confirmar el envío en Step 2
// Body: { tipo_envio, precio_envio, id_sucursal_oca?, operativa_oca? }
// → UPDATE ordenes SET estado='envio_calculado', tipo_envio, precio_envio WHERE id=?
```

**Disparador en `start.js`**: agregar llamada a este endpoint antes de ejecutar `window.mostrarCheckoutStep3()`.

### 3 · `POST /api/nave/crear-pago`

**Archivo**: `src/app/api/nave/crear-pago/route.ts`

Ver sección completa en `nave/INTEGRACION_NAVE.md` → sección 8.

Secuencia interna:
1. Auth NAVE → obtener `access_token` (cachear, válido 86400s)
2. POST `/payment_request/ecommerce` → `{ id, qr_data, checkout_url }`
3. UPDATE `ordenes` → `estado='pago_pendiente'`, `nave_payment_id=id`, `nave_status='PENDING'`
4. Devolver `{ payment_request_id, qr_data, checkout_url, environment }`

### 4 · `POST /api/webhooks/nave`

**Archivo**: `src/app/api/webhooks/nave/route.ts`

⚠️ **CRÍTICO**: Responder HTTP 200 ANTES de hacer cualquier otra cosa. Si no responde 200, NAVE reintenta 5 veces (última a las 6.7 horas).

Secuencia:
1. Parsear body: `{ payment_id, payment_check_url, external_payment_id }`
2. **Responder HTTP 200 inmediatamente**
3. Async: GET `payment_check_url` → `{ status: APPROVED | REJECTED | CANCELLED }`
4. UPDATE `ordenes` según estado:
   - `APPROVED` → `estado='pagado'`, `nave_status='APPROVED'`, `nave_monto_ars`, `pagado_at=now()`
   - `REJECTED` | `CANCELLED` → `estado='cancelado'`, `nave_status`

---

## Variables de entorno necesarias

### `.env.local` (agregar estas si no están)

```bash
# NAVE Sandbox
NAVE_CLIENT_ID=d3OkB2jExe4gBCUQzEeTiuAOV6e8kGSc
NAVE_CLIENT_SECRET=cuDRa5Tz19sFZwPRHP1Tcexsjv8f98slQ88o_OWUbr4f4YlxPpgp27QaV5OY3q0y
NAVE_POS_ID=f71ba756-1d80-4ab3-9f43-5dc247fd6c4a
NAVE_AUDIENCE=https://naranja.com/ranty/merchants/api
NAVE_ENVIRONMENT=sandbox

# Supabase (Backend — agregar la service role key)
SUPABASE_SERVICE_ROLE_KEY=<obtener de Supabase Dashboard > Settings > API>
```

> ⚠️ Las credenciales de Sandbox ya están en poder del equipo. Las de Producción se solicitan a NAVE cuando el sitio esté listo para salir vivo.

---

## Estructura de archivos backend (referencia rápida)

```
src/app/api/
├── nave/
│   └── crear-pago/
│       └── route.ts          ← POST /api/nave/crear-pago  [CREAR]
├── webhooks/
│   ├── galicia/              ← ruta legacy (mantener por si existe webhook configurado)
│   │   └── route.ts
│   └── nave/
│       └── route.ts          ← POST /api/webhooks/nave    [CREAR]
├── ordenes/
│   ├── route.ts              ← GET/POST /api/ordenes      [✅ existe]
│   └── [id]/
│       └── route.ts          ← GET/PATCH /api/ordenes/[id] [CREAR PATCH]
├── oca/
│   ├── cotizar/route.ts      ← [✅ existe]
│   ├── sucursales/route.ts   ← [✅ existe]
│   ├── crear-envio/route.ts  ← [Fase 2]
│   ├── tracking/route.ts     ← [Fase 2]
│   └── etiqueta/route.ts     ← [Fase 2]
└── health/route.ts           ← [✅ existe]

src/lib/
├── supabase.ts               ← cliente Supabase
├── nave/
│   ├── client.ts             ← auth + crear intención   [CREAR]
│   └── types.ts              ← TypeScript types          [CREAR]
└── oca/                      ← [✅ existe]
```

---

## Credenciales Sandbox NAVE

| Campo | Valor |
|---|---|
| Client ID | `d3OkB2jExe4gBCUQzEeTiuAOV6e8kGSc` |
| Client Secret | `cuDRa5Tz19sFZwPRHP1Tcexsjv8f98slQ88o_OWUbr4f4YlxPpgp27QaV5OY3q0y` |
| POS ID (Test) | `f71ba756-1d80-4ab3-9f43-5dc247fd6c4a` |
| Audience | `https://naranja.com/ranty/merchants/api` |
| Auth endpoint | `https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate` |
| API endpoint | `https://api-sandbox.ranty.io/api/payment_request/ecommerce` |
| Payments endpoint | `https://api-sandbox.ranty.io/ranty-payments/payments/{id}` |

---

## Fase 2 — Post-pagos (no bloquea el flujo principal)

Estos ítems se implementan una vez que el flujo Fase 1 esté completo y testeado en Sandbox:

- **Crear envío OCA** post-pago: `POST /api/oca/crear-envio` — disparado desde el webhook `APPROVED`
- **Descuento de stock**: en el webhook `APPROVED`, `UPDATE variantes_producto SET stock = stock - cantidad`
- **Email de confirmación**: trigger desde webhook `APPROVED`
- **Tracking OCA**: `GET /api/oca/tracking`
- **Página de confirmación completa**: `/checkout/confirmacion`
- **Panel de admin**: vista de órdenes con estados

---

## Documentos de referencia

| Documento | Ubicación | Uso |
|---|---|---|
| Documentación oficial NAVE | `backend/docs/nave/NAVE_CHECKOUT_API_DOCS.md` | Fuente de verdad de la API |
| Integración técnica NAVE | `backend/docs/nave/INTEGRACION_NAVE.md` | Step 3, SDK, flujo completo |
| Diagrama de flujo de pagos | `backend/docs/nave/diagrama_flujo_pagos.html` | Arquitectura visual |
| Guía de Supabase | `backend/docs/SUPABASE_GUIA.md` | Referencia de la BD |
| Arquitectura del backend | `backend/ARQUITECTURA.md` | Modelo de datos y relaciones |

---

## Testing Sandbox — Tarjetas de prueba

| Resultado | Marca | Número | Expiry | CVV |
|---|---|---|---|---|
| ✅ APPROVED | Visa Crédito (1 cuota) | `4025 2200 0000 0139` | cualquiera | cualquiera |
| ✅ APPROVED | Visa Crédito (6 cuotas) | `4761 2299 9900 0231` | `12/31` | `078` |
| ✅ APPROVED | Mastercard | `5413 3300 0000 0011` | cualquiera | cualquiera |
| ✅ APPROVED | American Express | `3712 3300 0000 0015` | cualquiera | cualquiera |
| ❌ REJECTED | Visa Crédito (Error) | `4025 2200 0000 0127` | cualquiera | cualquiera |

Para testear el webhook localmente: `ngrok http 3000` y usar la URL de ngrok como `notification_url`.

---

*GÜIDO CAPUZZI — 2 de Marzo, 2026*
