# INTEGRACION_NAVE.md
## GÜIDO CAPUZZI — Integración de Pagos con NAVE (Banco Galicia)
> Documentación técnica completa del Step 3 y del flujo de pagos.
> Última actualización: 2 de Marzo, 2026. Credenciales Sandbox recibidas.

---

## ÍNDICE

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Estado actual del proyecto](#2-estado-actual-del-proyecto)
3. [Arquitectura de la solución](#3-arquitectura-de-la-solución)
4. [Métodos de pago soportados](#4-métodos-de-pago-soportados)
5. [Estructura del Checkout (3 pasos)](#5-estructura-del-checkout-3-pasos)
6. [Gap crítico: Step 2 → Step 3 (PATCH ordenes)](#6-gap-crítico-step-2--step-3-patch-ordenes)
7. [Ciclo de vida de un pago](#7-ciclo-de-vida-de-un-pago)
8. [Frontend: Step 3 Pago](#8-frontend-step-3-pago)
9. [Backend: POST /api/nave/crear-pago](#9-backend-post-apinavecrearpago)
10. [Backend: POST /api/webhooks/nave](#10-backend-post-apiwebhooksnave)
11. [SDK embebido: @ranty/ranty-sdk](#11-sdk-embebido-rantyranty-sdk)
12. [QR / MODO: Billeteras virtuales](#12-qr--modo-billeteras-virtuales)
13. [Credenciales Sandbox](#13-credenciales-sandbox)
14. [Variables de entorno](#14-variables-de-entorno)
15. [Tarjetas de prueba (Sandbox)](#15-tarjetas-de-prueba-sandbox)
16. [Testing en Sandbox: checklist paso a paso](#16-testing-en-sandbox-checklist-paso-a-paso)
17. [Estados posibles y manejo de errores](#17-estados-posibles-y-manejo-de-errores)
18. [Integración OCA (ePak): estado y contexto](#18-integración-oca-epak-estado-y-contexto)

---

## 1. Resumen ejecutivo

**NAVE** es la plataforma de cobros online de Banco Galicia. Permite integrar pagos vía API con:
- **Tarjeta de crédito y débito** (Visa, Mastercard, Amex, Cabal, Naranja, Maestro)
- **QR interoperable**: escaneable por cualquier app bancaria argentina y la billetera **MODO**
- **Checkout embebido** (SDK `@ranty/ranty-sdk`) o redirección a URL de NAVE

El sitio de Güido Capuzzi utiliza el **SDK embebido** para tarjeta (el formulario de pago aparece dentro del propio checkout sin abandonar el sitio) y **QR renderizado** para pagos por MODO o app bancaria.

---

## 2. Estado actual del proyecto

| Componente | Estado | Notas |
|---|---|---|
| **Credenciales Sandbox** | ✅ **Recibidas** | Client ID, Client Secret, POS ID en mano |
| **Credenciales Producción** | ⏳ Pendiente solicitud | Se piden a NAVE cuando el sitio esté listo para producción |
| **SQL columnas NAVE** | 🔲 **Ejecutar** | `backend/sql/08_nave_payment.sql` |
| **Frontend Step 1** | ✅ Implementado | `checkout-logic.js` → crea orden en Supabase |
| **Frontend Step 2** | ✅ Implementado | `start.js` → cotiza OCA, muestra opciones |
| **Frontend Step 3** | ✅ Implementado | `checkout-payment.js` → SDK + QR + botón PAGAR + animación |
| **PATCH /api/ordenes/[id]** | 🔲 **Crear** | Gap: envío no se persiste antes del Step 3 |
| **POST /api/nave/crear-pago** | 🔲 **Crear** | Bloquea todo el Step 3 |
| **POST /api/webhooks/nave** | 🔲 **Crear** | Sin esto el pago nunca se confirma en BD |
| **Testing Sandbox end-to-end** | 🔲 Bloqueado | Disponible una vez implementado el backend |
| **Producción** | 🔲 Pendiente | Requiere credenciales productivas |

---

## 3. Arquitectura de la solución

```
CLIENTE (Browser)
    │
    ├── Step 1: Información
    │     ├── checkout-logic.js  — validación + guardado en Supabase (orden 'pendiente')
    │     └── supabase-config.js — cliente de Supabase
    │
    ├── Step 2: Envío
    │     ├── start.js → cargarOpcionesEnvioOCA(cp) — opciones OCA en tiempo real
    │     └── [NUEVO] PATCH /api/ordenes/{id} → actualiza tipo_envio, precio_envio
    │           └── estado: 'envio_calculado'
    │
    └── Step 3: Pago
          │
          ├── checkout-payment.js → POST /api/nave/crear-pago
          │                              └── BACKEND (Next.js API Route)
          │                                    ├── POST NAVE auth → access_token
          │                                    ├── POST NAVE /payment_request/ecommerce
          │                                    ├── UPDATE ordenes → pago_pendiente + nave_payment_id
          │                                    └── Response: { payment_request_id, qr_data, checkout_url }
          │
          ├── TARJETA: monta @ranty/ranty-sdk en #nave-payment-container
          └── QR: renderiza qr_data con qrcode.js


NAVE → POST /api/webhooks/nave → BACKEND (Next.js API Route)
    ├── HTTP 200 INMEDIATO
    ├── async: GET payment_check_url → { status }
    ├── UPDATE ordenes → estado + nave_status + pagado_at (si APPROVED)
    └── (Fase 2) → POST /api/oca/crear-envio si APPROVED

FRONTEND: escucha window.message (PAYMENT_MODAL_RESPONSE)
    ├── success → barra roja → overlay de confirmación → redirect
    ├── rejected → banner de error rojo
    └── expiration → renueva la intención de pago automáticamente
```

---

## 4. Métodos de pago soportados

| Método | Tipo | Soportado por NAVE | Implementado |
|---|---|---|---|
| Visa Crédito | Tarjeta | ✅ | ✅ (SDK) |
| Visa Débito | Tarjeta | ✅ | ✅ (SDK) |
| Mastercard Crédito | Tarjeta | ✅ | ✅ (SDK) |
| Maestro Débito | Tarjeta | ✅ | ✅ (SDK) |
| American Express | Tarjeta | ✅ | ✅ (SDK) |
| Cabal | Tarjeta | ✅ | ✅ (SDK) |
| Naranja Crédito | Tarjeta | ✅ | ✅ (SDK) |
| **MODO** | Billetera virtual | ✅ | ✅ (QR) |
| Apps bancarias (QR) | QR interoperable | ✅ | ✅ (QR) |

**Cuotas**: el SDK muestra automáticamente las opciones disponibles. No requiere configuración adicional en el frontend.

---

## 5. Estructura del Checkout (3 pasos)

El checkout es una **Single Page Application dentro de `#checkout`**, sin navegación entre páginas. Los pasos se muestran/ocultan con `display: block/none`.

### Arquitectura de archivos

```
/public/js/
    supabase-config.js     — cliente Supabase, funciones de autenticación
    checkout-logic.js      — Step 1: validación, creación de orden en Supabase
    checkout-payment.js    — Step 3: integración NAVE (existente)
    start.js               — orquestador principal, Steps 1 y 2

/src/app/
    page.tsx               — HTML de toda la UI del sitio + checkout
    globals.css            — todos los estilos
```

### Orden de carga de scripts

```
supabase-config.js → checkout-logic.js → checkout-payment.js → start.js
```

### Flujo de estados

```javascript
// Constantes de estado (body classList)
STATE_HOME     = 'state-home'
STATE_SHOP     = 'state-shop'
STATE_PDP      = 'state-pdp'
STATE_CHECKOUT = 'state-checkout'

// Variable de step interno (solo en STATE_CHECKOUT)
checkoutCurrentStep = 1 | 2 | 3

// Step 1 → 2: mostrarCheckoutStep2()        — en start.js
// Step 2 → 3: window.mostrarCheckoutStep3() — en checkout-payment.js (después del PATCH)
// Step 3 → 2: volverAStep2()                — en checkout-payment.js
```

---

## 6. Gap crítico: Step 2 → Step 3 (PATCH ordenes)

**Problema identificado**: cuando el usuario confirma el envío en Step 2, el dato (`tipo_envio`, `precio_envio`, `id_sucursal_oca`) se conoce en el frontend pero **no se persiste en Supabase** antes de pasar al Step 3. La orden queda con esos campos vacíos.

### Solución: `PATCH /api/ordenes/[id]`

**Archivo a crear**: `src/app/api/ordenes/[id]/route.ts`

```typescript
// PATCH /api/ordenes/{id}
// Body:
// {
//   tipo_envio: 'puerta_puerta' | 'sucursal',
//   precio_envio: number,        // en pesos
//   id_sucursal_oca?: number,    // solo si es sucursal
//   operativa_oca?: number
// }
//
// Acción: UPDATE ordenes SET
//   estado = 'envio_calculado',
//   tipo_envio = ...,
//   precio_envio = ...,
//   id_sucursal_oca = ...,
//   operativa_oca = ...
// WHERE id = {id}
```

**Modificación en `start.js`**: antes de llamar a `window.mostrarCheckoutStep3()`, agregar el PATCH:

```javascript
// En la función que confirma el envío y pasa al Step 3:
const ordenId = window._currentCheckoutOrdenId;
await fetch(`/api/ordenes/${ordenId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo_envio: metodoEnvioSeleccionado.tipo,
    precio_envio: metodoEnvioSeleccionado.precio,
    id_sucursal_oca: metodoEnvioSeleccionado.idSucursal ?? null,
    operativa_oca: metodoEnvioSeleccionado.operativa ?? null
  })
});
// Recién después:
window.mostrarCheckoutStep3({ ordenId, totalARS, cartItems, email, ... });
```

---

## 7. Ciclo de vida de un pago

```
1. [Step 2] Usuario confirma envío
   └── PATCH /api/ordenes/{id} → estado: 'envio_calculado'

2. [Step 3] Usuario hace click en "PAGAR"
   └── checkout-payment.js → POST /api/nave/crear-pago

3. Backend (Next.js):
   ├── GET token NAVE (cachear, válido 86400s)
   ├── POST /payment_request/ecommerce → { id, checkout_url, qr_data }
   ├── UPDATE ordenes → estado: 'pago_pendiente', nave_payment_id: id, nave_status: 'PENDING'
   └── Devolver { payment_request_id, qr_data, checkout_url, environment }

4. Frontend:
   ├── TARJETA: RantySDK.mount('#nave-payment-container')
   └── QR: qrcode.js renderiza qr_data

5. Usuario completa el pago en NAVE

6. NAVE → POST /api/webhooks/nave:
   { payment_id, payment_check_url, external_payment_id }
   ├── Backend responde HTTP 200 INMEDIATAMENTE
   ├── Backend async: GET payment_check_url → status
   └── Backend: UPDATE ordenes
       ├── APPROVED → estado: 'pagado', nave_status: 'APPROVED', pagado_at: now()
       └── REJECTED/CANCELLED → estado: 'cancelado', nave_status: ...

7. Frontend (SDK Event window.message):
   ├── success  → barra roja retrocede → overlay de confirmación → redirect
   ├── rejected → banner de error rojo
   └── expiration → renovar intención automáticamente
```

---

## 8. Frontend: Step 3 Pago

El frontend del Step 3 ya está implementado. El `checkout-payment.js` llama al backend así:

```javascript
// En checkout-payment.js — función initPago()
const response = await fetch('/api/nave/crear-pago', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    external_payment_id: window._currentCheckoutOrdenId,  // UUID de Supabase (≤36 chars)
    total_ars: totalARS,                                   // número en pesos
    cart_items: cartItems                                  // array de { name, quantity, price }
  })
});
const { payment_request_id, qr_data, environment } = await response.json();
```

**Respuesta esperada del backend:**
```json
{
  "payment_request_id": "ebac56ab-89f2-4419-941e-670f801d9c7b",
  "qr_data": "00020101...",
  "checkout_url": "https://sandbox.../nave/sdk?payment_request_id=...",
  "environment": "sandbox"
}
```

---

## 9. Backend: POST /api/nave/crear-pago

**Archivo**: `src/app/api/nave/crear-pago/route.ts`

### Request recibido del frontend

```json
{
  "external_payment_id": "uuid-de-la-orden-en-supabase",
  "total_ars": 298000,
  "cart_items": [
    { "name": "REMERA GÜIDO OVERSIZED", "quantity": 1, "price": 50000 },
    { "name": "JEAN SELVEDGE JAPONES",  "quantity": 1, "price": 240000 },
    { "name": "Envío OCA Domicilio",    "quantity": 1, "price": 8000 }
  ]
}
```

### Implementación completa

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Cache en memoria del token (válido 24hs)
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getNaveToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const isSandbox = process.env.NAVE_ENVIRONMENT === 'sandbox';
  const authUrl = isSandbox
    ? 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
    : 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.NAVE_CLIENT_ID,
      client_secret: process.env.NAVE_CLIENT_SECRET,
      audience:      process.env.NAVE_AUDIENCE ?? 'https://naranja.com/ranty/merchants/api'
    })
  });

  if (!res.ok) throw new Error(`NAVE auth failed: ${res.status}`);
  const data = await res.json();

  cachedToken = {
    value:     data.access_token,
    expiresAt: now + (Number(data.expires_in) - 300) * 1000  // 5min de margen
  };

  return cachedToken.value;
}

export async function POST(request: NextRequest) {
  try {
    const { external_payment_id, total_ars, cart_items } = await request.json();

    if (!external_payment_id || !total_ars || !cart_items?.length) {
      return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    const isSandbox = process.env.NAVE_ENVIRONMENT === 'sandbox';
    const apiUrl = isSandbox
      ? 'https://api-sandbox.ranty.io/api/payment_request/ecommerce'
      : 'https://api.ranty.io/api/payment_request/ecommerce';

    // PASO 1: Token
    const token = await getNaveToken();

    // PASO 2: Crear intención de pago
    const products = cart_items.map((item: { name: string; quantity: number; price: number }) => ({
      name:        item.name,
      description: item.name,
      quantity:    item.quantity,
      unit_price: {
        currency: 'ARS',
        value:    item.price.toFixed(2)
      }
    }));

    const paymentRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        external_payment_id: external_payment_id.substring(0, 36),  // máx 36 chars
        seller: {
          pos_id: process.env.NAVE_POS_ID
        },
        transactions: [{
          amount: {
            currency: 'ARS',
            value:    total_ars.toFixed(2)
          },
          products
        }],
        additional_info: {
          callback_url: 'https://xn--guidocapuzzi-vpb.com/checkout/confirmacion'
        },
        duration_time: '600'  // 10 minutos de expiración
      })
    });

    if (!paymentRes.ok) {
      const errBody = await paymentRes.text();
      console.error('NAVE payment_request error:', paymentRes.status, errBody);
      return NextResponse.json(
        { error: 'Error al crear intención de pago en NAVE' },
        { status: 502 }
      );
    }

    const { id, checkout_url, qr_data } = await paymentRes.json();

    // PASO 3: Actualizar orden en Supabase
    const supabase = createClient();
    await supabase
      .from('ordenes')
      .update({
        estado:          'pago_pendiente',
        nave_payment_id: id,
        nave_status:     'PENDING',
        nave_monto_ars:  total_ars
      })
      .eq('id', external_payment_id);

    // PASO 4: Devolver al frontend
    return NextResponse.json({
      payment_request_id: id,
      qr_data,
      checkout_url,
      environment: isSandbox ? 'sandbox' : 'production'
    });

  } catch (error) {
    console.error('Error en /api/nave/crear-pago:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
```

---

## 10. Backend: POST /api/webhooks/nave

**Archivo**: `src/app/api/webhooks/nave/route.ts`

> ⚠️ **CRÍTICO**: Responder HTTP 200 **antes** de hacer cualquier otra cosa. Si no se responde 200, NAVE reintenta 5 veces (la última a las ~6.7 horas).

### Body del webhook recibido de NAVE

```json
{
  "payment_id": "ID_DEL_PAGO_EN_NAVE",
  "payment_check_url": "api.ranty.io/ranty-payments/payments/ID",
  "external_payment_id": "uuid-de-la-orden-en-supabase"
}
```

### Implementación completa

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  let body: {
    payment_id: string;
    payment_check_url: string;
    external_payment_id: string;
  };

  try {
    body = await request.json();
  } catch {
    // Si el body no es JSON válido, responder 200 igual para evitar reintentos
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { payment_id, payment_check_url, external_payment_id } = body;

  // ⚠️ HTTP 200 INMEDIATO — CRÍTICO
  // La lógica de verificación y actualización de Supabase se ejecuta en background
  // (Next.js serverless: el código después del return no se ejecuta de forma
  //  garantizada en producción. Usar waitUntil si está disponible.)
  
  // Ejecutar la lógica async SIN esperar
  procesarWebhookNave(payment_id, payment_check_url, external_payment_id).catch(
    (err) => console.error('[webhook/nave] Error en procesamiento async:', err)
  );

  return NextResponse.json({ received: true }, { status: 200 });
}

async function procesarWebhookNave(
  payment_id: string,
  payment_check_url: string,
  external_payment_id: string
) {
  try {
    console.log('[webhook/nave] Procesando:', { payment_id, external_payment_id });

    // PASO 1: Obtener un token fresco para verificar el pago
    // (reutilizar el mismo helper de getNaveToken del crear-pago)
    const isSandbox = process.env.NAVE_ENVIRONMENT === 'sandbox';
    const authUrl = isSandbox
      ? 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
      : 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';

    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.NAVE_CLIENT_ID,
        client_secret: process.env.NAVE_CLIENT_SECRET,
        audience:      process.env.NAVE_AUDIENCE ?? 'https://naranja.com/ranty/merchants/api'
      })
    });

    if (!authRes.ok) throw new Error(`Auth NAVE failed: ${authRes.status}`);
    const { access_token } = await authRes.json();

    // PASO 2: Verificar estado del pago
    // Usar la URL del webhook o el endpoint estándar
    const checkUrl = payment_check_url.startsWith('http')
      ? payment_check_url
      : (isSandbox
          ? `https://api-sandbox.ranty.io/ranty-payments/payments/${payment_id}`
          : `https://api.ranty.io/ranty-payments/payments/${payment_id}`);

    const paymentRes = await fetch(checkUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentRes.ok) throw new Error(`Check payment failed: ${paymentRes.status}`);
    const paymentData = await paymentRes.json();
    const status: string = paymentData?.status?.name ?? 'UNKNOWN';

    console.log('[webhook/nave] Estado NAVE:', status, 'para orden:', external_payment_id);

    // PASO 3: Actualizar Supabase
    const supabase = createClient();

    const updateData: Record<string, unknown> = {
      nave_payment_id: payment_id,
      nave_status:     status
    };

    if (status === 'APPROVED') {
      updateData.estado     = 'pagado';
      updateData.pagado_at  = new Date().toISOString();
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      updateData.estado = 'cancelado';
    }
    // Para otros estados (PENDING, etc.) solo actualizar nave_status

    const { error } = await supabase
      .from('ordenes')
      .update(updateData)
      .eq('id', external_payment_id);

    if (error) {
      console.error('[webhook/nave] Error Supabase UPDATE:', error);
    } else {
      console.log('[webhook/nave] Orden actualizada:', external_payment_id, '→', status);
    }

    // Fase 2 (no implementado aún):
    // if (status === 'APPROVED') {
    //   await fetch('/api/oca/crear-envio', { ... });
    //   await supabase.from('variantes_producto').update(...)...  // descuento de stock
    // }

  } catch (err) {
    console.error('[webhook/nave] Error en procesarWebhookNave:', err);
  }
}
```

---

## 11. SDK embebido: @ranty/ranty-sdk

### Instalación

```bash
npm install @ranty/ranty-sdk
```

Alternativa CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@ranty/ranty-sdk/dist/ranty-sdk.min.js"></script>
```

### Uso

```javascript
import { RantySDK } from '@ranty/ranty-sdk';

const sdk = new RantySDK({
  paymentRequestId: '<payment_request_id>',  // el "id" devuelto por /api/nave/crear-pago
  environment: 'sandbox'                     // o 'production'
});

sdk.mount('#nave-payment-container');        // ID del elemento donde se renderiza
```

### Eventos

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type !== 'PAYMENT_MODAL_RESPONSE') return;
  const { success, closeModal, rejected, expiration } = event.data.data;

  if (success && closeModal)  { /* Pago aprobado → barra roja → overlay → redirect */ }
  else if (rejected)          { /* Pago rechazado → banner rojo */ }
  else if (expiration)        { /* Intención expirada → renovar vía POST /api/nave/crear-pago */ }
});
```

---

## 12. QR / MODO: Billeteras virtuales

Dependencia CDN (ya incluida en `page.tsx`):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

```javascript
new QRCode(document.getElementById('pago-qr-image-wrapper'), {
  text: qrData,           // string qr_data devuelto por /api/nave/crear-pago
  width: 220,
  height: 220,
  colorDark: '#1A1A1A',
  colorLight: '#FAFAFA',
  correctLevel: QRCode.CorrectLevel.M
});
```

---

## 13. Credenciales Sandbox

> ⚠️ Estas credenciales son solo de **Sandbox**. No funcionan en producción.

| Campo | Valor |
|---|---|
| **Client ID** | `d3OkB2jExe4gBCUQzEeTiuAOV6e8kGSc` |
| **Client Secret** | `cuDRa5Tz19sFZwPRHP1Tcexsjv8f98slQ88o_OWUbr4f4YlxPpgp27QaV5OY3q0y` |
| **POS ID (Test)** | `f71ba756-1d80-4ab3-9f43-5dc247fd6c4a` |
| **Audience** | `https://naranja.com/ranty/merchants/api` |

### Endpoints Sandbox

| Función | URL |
|---|---|
| Auth | `https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate` |
| Crear intención | `https://api-sandbox.ranty.io/api/payment_request/ecommerce` |
| Consultar intención | `https://api-sandbox.ranty.io/api/payment_requests/{id}` |
| Verificar pago | `https://api-sandbox.ranty.io/ranty-payments/payments/{payment_id}` |
| Cancelar intención | `DELETE https://api-sandbox.ranty.io/api/payment_requests/{id}` |
| Refund | `DELETE https://api-sandbox.ranty.io/api/payments/{payment_id}` |

### Producción (cuando llegue el momento)

Contactar a NAVE con el CUIT del comercio y la URL de `notification_url` de producción:
- Email: `integraciones@navenegocios.com`
- Auth: `https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate`
- API: `https://api.ranty.io/api/payment_request/ecommerce`

---

## 14. Variables de entorno

Agregar en `.env.local` y en Vercel Dashboard (Settings → Environment Variables):

```bash
# NAVE Sandbox
NAVE_CLIENT_ID=d3OkB2jExe4gBCUQzEeTiuAOV6e8kGSc
NAVE_CLIENT_SECRET=cuDRa5Tz19sFZwPRHP1Tcexsjv8f98slQ88o_OWUbr4f4YlxPpgp27QaV5OY3q0y
NAVE_POS_ID=f71ba756-1d80-4ab3-9f43-5dc247fd6c4a
NAVE_AUDIENCE=https://naranja.com/ranty/merchants/api
NAVE_ENVIRONMENT=sandbox

# Supabase Backend (necesario para UPDATE desde server-side)
# Obtener en: Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=<pendiente>
```

> ⚠️ **NUNCA** poner estas variables en el código fuente ni commitearlas. Solo en `.env.local` (que está en `.gitignore`) y en Vercel Dashboard.

---

## 15. Tarjetas de prueba (Sandbox)

### APPROVED

| Marca | Número | Expiry | CVV |
|---|---|---|---|
| Visa Crédito (1 cuota) | `4025 2200 0000 0139` | Cualquiera | Cualquiera |
| Visa Crédito (6 cuotas) | `4761 2299 9900 0231` | `12/31` | `078` |
| Visa Débito | `4507 9900 0000 0019` | Cualquiera | Cualquiera |
| Mastercard | `5413 3300 0000 0011` | Cualquiera | Cualquiera |
| Maestro Débito | `5413 3300 0000 0011` | Cualquiera | Cualquiera |
| American Express | `3712 3300 0000 0015` | Cualquiera | Cualquiera |
| Cabal | `5896 5700 0000 0018` | Cualquiera | Cualquiera |
| Naranja Crédito | `5895 6248 4026 3355` | `04/40` | `928` |

### REJECTED

| Marca | Número |
|---|---|
| Visa Crédito (Error) | `4025 2200 0000 0127` |

---

## 16. Testing en Sandbox: checklist paso a paso

### Pre-requisitos

- [ ] SQL `08_nave_payment.sql` ejecutado en Supabase
- [ ] Variables de entorno NAVE en `.env.local` y Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- [ ] Backend `PATCH /api/ordenes/[id]` deployado
- [ ] Backend `POST /api/nave/crear-pago` deployado
- [ ] Backend `POST /api/webhooks/nave` deployado
- [ ] Webhook URL configurada en credenciales Sandbox de NAVE

### Para testear el webhook localmente

```bash
ngrok http 3000
# URL generada → usar como notification_url en las credenciales Sandbox de NAVE
# Avisar a NAVE o configurar en el portal de integraciones
```

### Test 1: Pago APPROVED

1. Agregar producto → INICIAR COMPRA
2. Step 1 → completar datos → CONTINUAR A ENVÍOS
3. Step 2 → seleccionar envío → verificar que la consola muestra PATCH exitoso → CONTINUAR AL PAGO
4. Step 3: verificar spinner → SDK carga → formulario de tarjeta aparece
5. Ingresar `4025 2200 0000 0139`, fecha futura, CVV cualquiera
6. Click PAGAR → barra roja → overlay de confirmación → redirect
7. Verificar en Supabase: orden con `estado='pagado'`, `nave_status='APPROVED'`, `pagado_at` poblado
8. Verificar en logs: webhook recibido y procesado

### Test 2: Pago REJECTED

1. Steps 1-4 del Test 1
2. Tarjeta: `4025 2200 0000 0127`
3. Esperado: banner rojo, opción de reintentar

### Test 3: QR / MODO

1. Steps 1-3 del Test 1
2. Tab "QR · MODO" → verificar QR renderiza correctamente
3. (Opcional) escanear con app bancaria en Sandbox

---

## 17. Estados posibles y manejo de errores

### Estados del **pago** (llegan por webhook)

| Estado NAVE | Acción del frontend | Acción en Supabase |
|---|---|---|
| `APPROVED` | Barra roja → overlay → redirect | `estado='pagado'`, `pagado_at=now()` |
| `REJECTED` | Banner rojo, permitir reintentar | `estado='cancelado'` |
| `CANCELLED` | Tratar como rechazado | `estado='cancelado'` |
| `PENDING` | Esperar siguiente webhook | Solo actualizar `nave_status` |

### Motivos de rechazo frecuentes

| Código | Mensaje al usuario |
|---|---|
| `denied` | "Error al procesar. Intentá nuevamente." |
| `no_amount_available` | "Fondos insuficientes." |
| `account_identity_validation_error` | "Datos de tarjeta incorrectos." |
| `expired_card_invalid_expiry_date` | "La tarjeta está vencida." |
| `denied_hold_card` | "El banco rechazó el pago. Contactate con tu banco." |
| `gateway_not_available` | "Servicio no disponible. Intentá más tarde." |

### Reintentos del webhook NAVE (si el backend no responde 200)

| Intento | Delay |
|---|---|
| 1 | 10 segundos |
| 2 | 70 segundos |
| 3 | ~8 minutos |
| 4 | ~55 minutos |
| 5 | ~6.7 horas |

---

## 18. Integración OCA (ePak): estado y contexto

### Estado actual

Implementada en `start.js` → `cargarOpcionesEnvioOCA(cp)`. Consulta la API de OCA con el CP del cliente y renderiza opciones reales de envío (domicilio y sucursal con precios y plazos).

### Por qué OCA es Fase 2

La **creación del envío en OCA** (no la cotización) solo debe ocurrir **después de que el pago esté confirmado** (webhook `APPROVED`). Implementarla antes no tiene sentido y no bloquea el flujo de pagos.

### OCA no tiene Sandbox formal

A diferencia de NAVE, OCA ePak opera directamente con credenciales reales. Para testear usar CPs válidos (`1043` CABA, `5000` Córdoba).

### Checklist OCA (Fase 2)

- [ ] `POST /api/oca/crear-envio` disparado desde el webhook NAVE `APPROVED`
- [ ] `UPDATE ordenes SET nro_envio_oca, id_orden_retiro_oca, estado='preparando'`
- [ ] Descuento de stock en `variantes_producto`
- [ ] Tracking visible en cuenta OCA ePak

---

*GÜIDO CAPUZZI — 2 de Marzo, 2026*
*Credenciales Sandbox activas. Producción se solicita al momento de lanzar.*
*Ver también: `NAVE_CHECKOUT_API_DOCS.md` (documentación oficial completa) y `diagrama_flujo_pagos.html` (arquitectura visual).*
