# MercadoPago Checkout API — Guía de Integración Completa

## 1. Overview

MercadoPago Checkout API (también llamado "Checkout Transparente") es la solución de pago que ofrece **control total del checkout** sin redirigir al usuario fuera del sitio. A diferencia de Checkout Pro (redirect) y Checkout Bricks (componentes pre-armados), con Checkout API el formulario de pago es HTML/CSS propio.

El SDK de JS se encarga de tokenizar los datos de tarjeta de forma segura (PCI SAQ-A), y el backend crea el pago usando el token.

**Nota (2025-2026):** MercadoPago está migrando de la API legacy `/v1/payments` a la nueva **Orders API** (`/v1/orders`). El SDK de Node.js v2+ usa `Order` como clase principal. Esta guía cubre ambos approaches.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                    │
│                                                         │
│  1. Cargar SDK:  sdk.mercadopago.com/js/v2              │
│  2. mp = new MercadoPago(PUBLIC_KEY)                    │
│  3. Opción A: mp.cardForm({...})  (automático)          │
│     Opción B: mp.fields.create()  (manual/custom)       │
│  4. Usuario completa formulario HTML propio              │
│  5. SDK tokeniza datos → card_token                     │
│  6. Enviar token + datos al backend                     │
│                                                         │
│              ┌──────────────┐                           │
│              │  Card Token  │                           │
│              └──────┬───────┘                           │
│                     │ POST                              │
└─────────────────────┼───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                     │
│                                                         │
│  7. Recibir token + transaction_amount + installments   │
│  8. POST /v1/orders (o /v1/payments legacy)             │
│     con ACCESS_TOKEN en header                          │
│  9. Procesar respuesta (status)                         │
│ 10. Retornar resultado al frontend                      │
│                                                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 MERCADOPAGO API                          │
│                                                         │
│  - Valida token, procesa pago                           │
│  - Puede requerir 3DS challenge                         │
│  - Envía webhook a notification_url                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Integration

### 3.1 Cargar el SDK

**Via script tag (recomendado para vanilla JS — nuestro caso):**
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
<script>
  const mp = new MercadoPago("YOUR_PUBLIC_KEY", {
    locale: "es-AR",
    advancedFraudPrevention: true
  });
</script>
```

**Via NPM:**
```bash
npm install @mercadopago/sdk-js
```
```javascript
import { loadMercadoPago } from "@mercadopago/sdk-js";

await loadMercadoPago();
const mp = new window.MercadoPago("YOUR_PUBLIC_KEY", {
  locale: "es-AR",
  advancedFraudPrevention: true
});
```

**Opciones de inicialización:**
- `locale`: `"es-AR"` para Argentina
- `advancedFraudPrevention`: `true` (default) — habilita Device Fingerprinting anti-fraude
- `trackingDisabled`: `false` (default)

### 3.2 CardForm (Approach recomendado)

CardForm es el approach más simple. El SDK maneja automáticamente:
- Detección de medio de pago por BIN (primeros 6-8 dígitos)
- Consulta de emisores (issuers/bancos)
- Consulta de cuotas (installments)
- Tipos de documento de identidad
- Tokenización de la tarjeta

#### HTML del formulario (100% nuestro, 100% customizable)

```html
<form id="form-checkout">
  <input type="text" id="form-checkout__cardNumber" placeholder="Número de tarjeta" />
  <input type="text" id="form-checkout__expirationDate" placeholder="MM/YY" />
  <input type="text" id="form-checkout__securityCode" placeholder="CVV" />
  <input type="text" id="form-checkout__cardholderName" placeholder="Titular de la tarjeta" />
  <input type="email" id="form-checkout__cardholderEmail" placeholder="Email" />

  <select id="form-checkout__issuer">
    <option value="" disabled selected>Banco emisor</option>
  </select>

  <select id="form-checkout__installments">
    <option value="" disabled selected>Cuotas</option>
  </select>

  <select id="form-checkout__identificationType">
    <option value="" disabled selected>Tipo de documento</option>
  </select>

  <input type="text" id="form-checkout__identificationNumber" placeholder="Número de documento" />

  <button type="submit" id="form-checkout__submit">PAGAR</button>
</form>
```

#### Inicialización de CardForm

```javascript
const cardForm = mp.cardForm({
  amount: "15000.00",          // REQUIRED: monto total (string)
  autoMount: true,             // montar al instanciar (default: true)
  iframe: false,               // usar inputs HTML nativos (no iframes)

  form: {
    id: "form-checkout",
    cardNumber:          { id: "form-checkout__cardNumber", placeholder: "Número de tarjeta" },
    expirationDate:      { id: "form-checkout__expirationDate", placeholder: "MM/YY", mode: "short" },
    securityCode:        { id: "form-checkout__securityCode", placeholder: "CVV" },
    cardholderName:      { id: "form-checkout__cardholderName", placeholder: "Titular" },
    cardholderEmail:     { id: "form-checkout__cardholderEmail", placeholder: "Email" },
    issuer:              { id: "form-checkout__issuer", placeholder: "Banco emisor" },
    installments:        { id: "form-checkout__installments", placeholder: "Cuotas" },
    identificationType:  { id: "form-checkout__identificationType", placeholder: "Tipo doc" },
    identificationNumber:{ id: "form-checkout__identificationNumber", placeholder: "Nº doc" }
  },

  callbacks: {
    onFormMounted: (error) => {
      if (error) return console.error("Form mount error:", error);
      console.log("CardForm mounted");
    },

    onFormUnmounted: (error) => {
      if (error) return console.error("Form unmount error:", error);
    },

    onIdentificationTypesReceived: (error, identificationTypes) => {
      if (error) return console.error("IdentificationTypes error:", error);
      // identificationTypes = [{ id: "DNI", name: "DNI" }, { id: "CI", ... }]
    },

    onPaymentMethodsReceived: (error, paymentMethods) => {
      if (error) return console.error("PaymentMethods error:", error);
      // Detectado por BIN: { id: "visa", name: "Visa", ... }
    },

    onIssuersReceived: (error, issuers) => {
      if (error) return console.error("Issuers error:", error);
      // Lista de bancos emisores para esta tarjeta
    },

    onInstallmentsReceived: (error, installments) => {
      if (error) return console.error("Installments error:", error);
      // Cuotas disponibles con costos financieros
    },

    onCardTokenReceived: (error, token) => {
      if (error) return console.error("CardToken error:", error);
      // Token generado: { id: "abc123..." }
    },

    onSubmit: (event) => {
      event.preventDefault();
      const data = cardForm.getCardFormData();

      // data = {
      //   token: "abc123...",
      //   installments: "3",
      //   paymentMethodId: "visa",
      //   issuerId: "310",
      //   identificationType: "DNI",
      //   identificationNumber: "12345678"
      // }

      fetch("/api/mercadopago/crear-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          installments: Number(data.installments),
          payment_method_id: data.paymentMethodId,
          issuer_id: Number(data.issuerId),
          transaction_amount: 15000.00,
          payer: {
            email: document.getElementById("form-checkout__cardholderEmail").value,
            identification: {
              type: data.identificationType,
              number: data.identificationNumber
            }
          }
        })
      })
      .then(res => res.json())
      .then(result => { /* manejar respuesta */ })
      .catch(err => console.error("Payment error:", err));
    },

    onFetching: (resource) => {
      // Mostrar spinner mientras SDK consulta APIs
      return () => { /* ocultar spinner */ };
    },

    onBinChange: (bin) => {
      // BIN cambió (primeros 6-8 dígitos)
    },

    onValidityChange: (error, field) => {
      // Validación de campo cambió
    },

    onError: (error, event) => {
      console.error("CardForm error:", error, event);
    }
  }
});
```

#### Métodos de la instancia CardForm

```javascript
cardForm.mount();              // Montar (si autoMount: false)
cardForm.unmount();            // Desmontar
cardForm.createCardToken();    // Crear token manualmente
cardForm.getCardFormData();    // Obtener datos (incluyendo token)
cardForm.submit();             // Disparar submit programáticamente
cardForm.update("cardNumber", { placeholder: "Ingresá tu tarjeta" });
```

### 3.3 Core Methods (Control absoluto)

Para control total, usar los Core Methods directamente sin CardForm:

```javascript
// Obtener medios de pago por BIN
const paymentMethods = await mp.getPaymentMethods({ bin: "41111111" });

// Obtener emisores (bancos)
const issuers = await mp.getIssuers({ paymentMethodId: "visa", bin: "41111111" });

// Obtener cuotas
const installments = await mp.getInstallments({
  amount: "15000",
  bin: "41111111",
  locale: "es-AR"
});

// Crear token de tarjeta manualmente
const cardToken = await mp.createCardToken({
  cardNumber: "4509953566233704",
  cardholderName: "APRO",
  cardExpirationMonth: "11",
  cardExpirationYear: "2030",
  securityCode: "123",
  identificationType: "DNI",
  identificationNumber: "12345678"
});
// cardToken.id → string del token
```

### 3.4 Secure Fields (iframes PCI-compliant)

Para máxima seguridad PCI, `mp.fields` renderiza inputs en iframes aislados:

```javascript
const cardNumberField = mp.fields.create("cardNumber", {
  placeholder: "Número de tarjeta",
  style: { fontFamily: "Univers", fontSize: "16px", color: "#1A1A1A" }
});

const securityCodeField = mp.fields.create("securityCode", { placeholder: "CVV" });
const expirationDateField = mp.fields.create("expirationDate", { placeholder: "MM/YY" });

// Montar en contenedores HTML
cardNumberField.mount("card-number-container");
securityCodeField.mount("security-code-container");
expirationDateField.mount("expiration-date-container");

// Eventos
cardNumberField.on("binChange", ({ bin }) => { /* detectar medio de pago */ });
cardNumberField.on("validityChange", ({ field, errorMessages }) => { /* validación */ });

// Crear token con fields
const token = await mp.fields.createCardToken({
  cardholderName: "APRO",
  identificationType: "DNI",
  identificationNumber: "12345678"
});
```

**Tipos de campo:** `cardNumber`, `securityCode`, `expirationMonth`, `expirationYear`, `expirationDate`

**Eventos:** `blur`, `focus`, `ready`, `change`, `paste`, `validityChange`, `error`, `binChange` (solo cardNumber)

---

## 4. Backend Integration

### 4.1 Instalación

```bash
npm install --save mercadopago
```

Requiere Node.js 16+.

### 4.2 Inicialización

```javascript
import { MercadoPagoConfig, Order } from "mercadopago";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: "unique-key-per-request"  // recomendado
  }
});
```

### 4.3 Crear Pago — Orders API (v2, recomendado)

```typescript
// src/app/api/mercadopago/crear-pago/route.ts
import { MercadoPagoConfig, Order } from "mercadopago";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const order = new Order(mpClient);

  const result = await order.create({
    body: {
      type: "online",
      processing_mode: "automatic",
      total_amount: body.transaction_amount.toFixed(2),
      external_reference: body.external_reference,
      payer: { email: body.payer.email },
      transactions: {
        payments: [{
          amount: body.transaction_amount.toFixed(2),
          payment_method: {
            id: body.payment_method_id,
            type: "credit_card",
            token: body.token,
            installments: body.installments,
            statement_descriptor: "GUIDOCAPUZZI"
          }
        }]
      }
    },
    requestOptions: {
      idempotencyKey: `gc_${Date.now()}_${Math.random().toString(36).slice(2)}`
    }
  });

  return Response.json({
    id: result.id,
    status: result.status,
    status_detail: result.status_detail
  });
}
```

### 4.4 Crear Pago — Payments API (legacy, aún funcional)

```javascript
const response = await fetch("https://api.mercadopago.com/v1/payments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    "X-Idempotency-Key": `idem_${Date.now()}`
  },
  body: JSON.stringify({
    token: body.token,
    transaction_amount: body.transaction_amount,
    installments: body.installments,
    payment_method_id: body.payment_method_id,
    issuer_id: body.issuer_id,
    description: "GÜIDO CAPUZZI - Compra online",
    external_reference: `order_${Date.now()}`,
    notification_url: "https://guidocapuzzi.com/api/webhooks/mercadopago",
    statement_descriptor: "GUIDOCAPUZZI",
    binary_mode: false,
    payer: {
      email: body.payer.email,
      identification: {
        type: body.payer.identification.type,
        number: body.payer.identification.number
      }
    }
  })
});
```

### 4.5 Campos del request POST /v1/payments

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `token` | string | Sí | Token de tarjeta del frontend |
| `transaction_amount` | number | Sí | Monto total |
| `installments` | integer | Sí | Número de cuotas |
| `payment_method_id` | string | Sí | "visa", "master", "amex", etc. |
| `issuer_id` | integer | No | ID del banco emisor |
| `description` | string | No | Descripción del pago |
| `external_reference` | string | No | ID propio para trackear |
| `notification_url` | string | No | URL para webhooks |
| `statement_descriptor` | string | No | Texto en resumen de tarjeta (22 chars max) |
| `binary_mode` | boolean | No | `true` = solo approved/rejected |
| `payer.email` | string | Sí | Email del comprador |
| `payer.identification.type` | string | Sí (AR) | "DNI", "CUIT", etc. |
| `payer.identification.number` | string | Sí (AR) | Número de documento |

### 4.6 Manejo de 3D Secure (3DS)

3DS 2.0 valida la identidad del titular para transacciones de alto riesgo.

**Configuración (Orders API):**
```javascript
config: {
  online: {
    transaction_security: {
      validation: "on_fraud_risk",  // o "never"
      liability_shift: "required"
    }
  }
}
```

**Flujo:**
1. Crear orden con config de 3DS
2. Si `status: "action_required"` + `status_detail: "pending_challenge"`:
   - Extraer URL: `transactions.payments[0].payment_method.transaction_security.url`
   - Mostrar en iframe
3. Escuchar `window.message` con `status: "COMPLETE"`
4. Timeout: 40 minutos

### 4.7 Response Statuses

**Orders API:**

| Status | Status Detail | Significado |
|--------|---------------|-------------|
| `processed` | `accredited` | ✅ Pago aprobado |
| `processing` | `in_process` | Transacción en curso |
| `processing` | `pending_review_manual` | En revisión manual |
| `action_required` | `pending_challenge` | Challenge 3DS (40 min) |
| `action_required` | `waiting_capture` | Autorizado, esperando captura |
| `failed` | (ver códigos abajo) | ❌ Transacción fallida |
| `refunded` | `refunded` | Reembolso total |
| `canceled` | `canceled` | Cancelado |
| `expired` | `expired` | Expirado |

**Legacy API:**

| Status | Significado |
|--------|-------------|
| `approved` | ✅ Pago aprobado |
| `rejected` | ❌ Pago rechazado |
| `in_process` | En proceso |
| `pending` | Pendiente |

---

## 5. Webhooks / Notificaciones

### 5.1 Configuración

- **Dashboard:** "Tus integraciones" > App > Webhooks → URL para test y producción
- **Por pago (legacy):** Campo `notification_url` en el body del POST /v1/payments

### 5.2 Payload del Webhook

```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2026-03-18T10:04:58.396-04:00",
  "user_id": 44444,
  "api_version": "v1",
  "action": "payment.created",
  "data": {
    "id": "999999999"
  }
}
```

### 5.3 Webhook Handler

```typescript
// src/app/api/webhooks/mercadopago/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  // 1. Verificar HMAC signature
  if (xSignature && process.env.MP_WEBHOOK_SECRET) {
    const parts: Record<string, string> = {};
    xSignature.split(",").forEach((part) => {
      const [key, ...rest] = part.split("=");
      parts[key.trim()] = rest.join("=").trim();
    });

    const ts = parts.ts;
    const v1 = parts.v1;
    const dataId = String(body.data?.id || "");

    const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
      .update(signedTemplate)
      .digest("hex");

    if (expectedSignature !== v1) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // 2. Consultar estado del pago
  if (body.action === "payment.created" || body.action === "payment.updated") {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${body.data.id}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    const payment = await response.json();

    switch (payment.status) {
      case "approved":
        // Actualizar orden, decrementar stock, enviar email
        break;
      case "rejected":
        // Registrar rechazo
        break;
      case "in_process":
      case "pending":
        // Marcar como pendiente
        break;
    }
  }

  // 3. Siempre responder 200
  return NextResponse.json({ received: true }, { status: 200 });
}
```

### 5.4 Verificación HMAC (x-signature)

```javascript
import crypto from "crypto";

function verifySignature(xSignature, xRequestId, dataId) {
  const parts = {};
  xSignature.split(",").forEach(part => {
    const [key, value] = part.split("=");
    parts[key.trim()] = value.trim();
  });

  const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const secret = process.env.MP_WEBHOOK_SECRET;

  const cyphedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedTemplate)
    .digest("hex");

  return cyphedSignature === parts.v1;
}
```

---

## 6. Credenciales & Entorno

### 6.1 Tipos de credenciales

| Credencial | Uso | Dónde |
|------------|-----|-------|
| **Public Key** | Frontend (SDK JS) | `new MercadoPago("PUBLIC_KEY")` |
| **Access Token** | Backend (API calls) | Header `Authorization: Bearer TOKEN` |

### 6.2 Sandbox vs Producción

| | Sandbox (Test) | Producción |
|---|----------------|------------|
| Prefijo credenciales | `TEST-xxxx` | `APP_USR-xxxx` |
| Dinero real | No | Sí |
| URL base API | `api.mercadopago.com` (misma) | `api.mercadopago.com` (misma) |
| Activación | Automática | Requiere completar datos en dashboard |

### 6.3 Obtener credenciales

1. [mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
2. Crear o seleccionar aplicación
3. Sección "Pruebas" → credenciales de test
4. Sección "Producción" → credenciales productivas

### 6.4 Crear usuarios de prueba

Dashboard > App > "Cuentas de prueba" > "Crear cuenta de prueba"
- País: Argentina
- Tipo: Vendedor o Comprador
- Saldo ficticio configurable
- Límite: 15 cuentas por aplicación

### 6.5 Tarjetas de prueba (Argentina)

#### Tarjetas de crédito

| Marca | Número | CVV | Vencimiento |
|-------|--------|-----|-------------|
| Mastercard | `5031 7557 3453 0604` | `123` | `11/30` |
| Visa | `4509 9535 6623 3704` | `123` | `11/30` |
| American Express | `3711 803032 57522` | `1234` | `11/30` |

#### Tarjetas de débito

| Marca | Número | CVV | Vencimiento |
|-------|--------|-----|-------------|
| Mastercard Debit | `5287 3383 1025 3304` | `123` | `11/30` |
| Visa Debit | `4002 7686 9439 5619` | `123` | `11/30` |

#### Nombres para simular resultados

| Nombre del titular | DNI | Resultado |
|--------------------|-----|-----------|
| `APRO` | `12345678` | ✅ Pago aprobado |
| `OTHE` | `12345678` | ❌ Rechazado (error general) |
| `CONT` | — | Pendiente de revisión |
| `CALL` | — | Rechazado (requiere autorización) |
| `FUND` | — | Rechazado (fondos insuficientes) |
| `SECU` | — | Rechazado (CVV inválido) |
| `EXPI` | — | Rechazado (tarjeta vencida) |
| `FORM` | — | Rechazado (error en formulario) |

### 6.6 Variables de entorno

```env
# MercadoPago - Test
MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# MercadoPago - Production
# MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 7. Seguridad

### 7.1 PCI Compliance
- Con CardForm o Secure Fields, los datos de tarjeta **nunca tocan tu servidor**
- PCI SAQ-A (nivel más bajo, sin cuestionarios extensos)
- Tokens expiran en **7 días** y son de **un solo uso**

### 7.2 HTTPS
- Obligatorio en producción
- El SDK no funciona en HTTP (excepto `localhost`)

### 7.3 Access Token
- **NUNCA** exponer en el frontend
- Usar variables de entorno del servidor

### 7.4 Fraud Prevention
- `advancedFraudPrevention: true` habilita Device Fingerprinting
- Enviar `additional_info` mejora la detección

---

## 8. Códigos de Rechazo

| Código | Descripción | Mensaje sugerido al usuario |
|--------|-------------|----------------------------|
| `bad_filled_card_data` | Datos incorrectos | "Revisá los datos de tu tarjeta" |
| `insufficient_amount` | Fondos insuficientes | "Tu tarjeta no tiene fondos suficientes" |
| `high_risk` | Fraude/riesgo alto | "No pudimos procesar tu pago. Intentá con otro medio" |
| `card_disabled` | Tarjeta deshabilitada | "Tu tarjeta está deshabilitada. Contactá a tu banco" |
| `max_attempts_exceeded` | Intentos excedidos | "Superaste el límite de intentos. Intentá en 24 horas" |
| `rejected_by_issuer` | Rechazado por banco | "Tu banco rechazó el pago. Contactá a tu banco" |
| `required_call_for_authorize` | Autorización telefónica | "Debés autorizar el pago con tu banco" |
| `amount_limit_exceeded` | Límite excedido | "El monto excede el límite de tu tarjeta" |
| `processing_error` | Error de procesamiento | "Hubo un error. Intentá nuevamente" |
| `invalid_installments` | Cuotas inválidas | "El número de cuotas no es válido" |
| `invalid_card_token` | Token inválido/expirado | Regenerar token y reintentar |

---

## 9. Errores frecuentes de integración

| Problema | Solución |
|----------|----------|
| "MercadoPago is not defined" | Script del SDK no cargó. Verificar network tab |
| Formulario no se monta | Verificar que los IDs del HTML coincidan con el `form` config |
| Cuotas no aparecen | Verificar que `amount` sea string con decimales (`"15000.00"`) |
| Token vacío | Verificar que `onCardTokenReceived` se ejecutó sin error |
| Public Key test + Access Token prod | Usar credenciales del mismo entorno |
| Webhook no llega | URL debe ser HTTPS y accesible públicamente |
| "Unsupported payment method" | `payment_method_id` no coincide con BIN |
| HTTP 429 | Rate limiting. Implementar exponential backoff |

---

## 10. Diferencias Legacy vs Orders API

| Aspecto | Legacy (`/v1/payments`) | Orders API (`/v1/orders`) |
|---------|------------------------|---------------------------|
| SDK class | `Payment` | `Order` |
| Amount format | Number (`15000`) | String (`"15000.00"`) |
| Status "approved" | `status: "approved"` | `status: "processed"` + `detail: "accredited"` |
| Status "rejected" | `status: "rejected"` | `status: "failed"` |
| 3DS config | Separado | Integrado en `config.online.transaction_security` |

---

## 11. Relevancia para GÜIDO CAPUZZI

### Ventajas clave vs NAVE SDK
- **HTML nativo** — No hay Shadow DOM, no hay inyección de estilos frágil
- **CSS propio** — Inputs se estilizan con las clases de GÜIDO (`checkout-input`, font Univers, colores brand)
- **Vanilla JS** — Compatible con la arquitectura actual (no requiere React)
- **Documentación** — Oficial, completa, con ejemplos para Argentina
- **Sandbox estable** — Tarjetas de prueba bien documentadas, resultados predecibles

### Mapeo de componentes NAVE → MP

| NAVE | MercadoPago |
|------|-------------|
| `<payfac-sdk>` web component | `mp.cardForm({...})` con inputs HTML |
| `src/lib/nave/client.ts` | `mercadopago` npm + `Order` class |
| OAuth2 M2M (CLIENT_ID + SECRET) | Access Token directo |
| `POST /payment_request` | `POST /v1/orders` o `/v1/payments` |
| `POST /api/webhooks/nave` | `POST /api/webhooks/mercadopago` |
| `nave_payment_id`, `nave_status` | `mp_payment_id`, `mp_status` |

---

*Documento generado el 2026-03-18. Basado en documentación oficial de MercadoPago, SDK JS v2, SDK Node.js v2, y GitHub repos oficiales.*
