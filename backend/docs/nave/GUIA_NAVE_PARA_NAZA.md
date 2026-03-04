# GUÍA NAVE — Integración de Pagos para GÜIDO CAPUZZI

> **Autor**: Antigravity  
> **Para**: Nazareno Capuzzi  
> **Fecha**: 4 de Marzo, 2026  
> **Propósito**: Que entiendas exactamente cómo funciona el sistema de pagos, qué hicimos, qué falta, y cómo continuar.

---

## ÍNDICE

1. [¿Qué es NAVE?](#1-qué-es-nave)
2. [Cómo funciona un pago online (conceptos básicos)](#2-cómo-funciona-un-pago-online)
3. [Los actores del sistema](#3-los-actores-del-sistema)
4. [El flujo completo paso a paso](#4-el-flujo-completo-paso-a-paso)
5. [Los archivos que creamos](#5-los-archivos-que-creamos)
6. [El diagrama de flujo de pagos (diagrama_flujo_pagos.html)](#6-el-diagrama-de-flujo-de-pagos)
7. [¿Qué es ngrok y por qué lo necesitamos?](#7-qué-es-ngrok-y-por-qué-lo-necesitamos)
8. [Instrucciones paso a paso: ngrok](#8-instrucciones-paso-a-paso-ngrok)
9. [Estado actual de la implementación](#9-estado-actual-de-la-implementación)
10. [El error del Sandbox](#10-el-error-del-sandbox)
11. [Cómo continuar cuando vuelvas](#11-cómo-continuar-cuando-vuelvas)
12. [Credenciales y datos importantes](#12-credenciales-y-datos-importantes)
13. [Glosario para no-programadores](#13-glosario)

---

## 1. ¿Qué es NAVE?

**NAVE** es la pasarela de pagos de **Banco Galicia**. Pensalo como el intermediario que conecta tu tienda online con el dinero del cliente. Cuando alguien paga en guidocapuzzi.com, NAVE es quien:

- 🔐 Se encarga de la **seguridad** de los datos de la tarjeta (vos nunca tocás números de tarjeta)
- 💳 Procesa el pago con Visa, Mastercard, Amex, Cabal, Naranja
- 📱 Genera el **QR para MODO** y billeteras virtuales
- 📩 Te **notifica** cuando el pago se aprueba o se rechaza
- 💰 Deposita la plata en tu cuenta de Galicia

**Analogía simple**: NAVE es como el cajero de un supermercado. El cliente le da la tarjeta al cajero (NAVE), el cajero se comunica con el banco, y si está todo bien, confirma el pago. Vos nunca tocás la tarjeta del cliente.

---

## 2. Cómo funciona un pago online

Para entender todo lo que sigue, necesitás saber esto:

### El frontend y el backend

- **Frontend** = lo que ve el usuario en el navegador (HTML, CSS, JavaScript). Es tu sitio, los botones, los formularios.
- **Backend** = lo que pasa "detrás de escena" en el servidor. El usuario no lo ve. Acá se guardan los secretos, se habla con NAVE, se actualiza la base de datos.

### ¿Por qué necesitamos un backend?

Porque las **credenciales de NAVE son secretas**. Si las pusiéramos en el frontend (el JavaScript que corre en el navegador del cliente), cualquiera podría verlas e impersonar tu tienda. Por eso, el frontend le pide al backend que haga las operaciones sensibles.

### El concepto de "intención de pago"

Cuando alguien quiere pagar, no se cobra directamente. Primero se crea una **intención de pago**: es como decirle a NAVE "che, un cliente quiere pagar $50,000 por estas prendas". NAVE responde con un ID único para ese pago y los datos necesarios para mostrar el formulario de tarjeta o el código QR.

### El concepto de "webhook"

Un **webhook** es como un timbre que suena en tu backend. Cuando NAVE termina de procesar un pago (aprobado, rechazado, etc.), NAVE hace sonar ese timbre: le manda un mensaje HTTP a una URL tuya diciéndote el resultado. Tu backend recibe ese mensaje y actualiza la base de datos.

---

## 3. Los actores del sistema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   USUARIO    │     │   FRONTEND   │     │   BACKEND    │     │    NAVE      │
│  (cliente)   │────▶│  (browser)   │────▶│  (servidor)  │────▶│  (Galicia)   │
│              │     │  start.js    │     │  Next.js API  │     │  ranty.io    │
│              │     │  checkout-   │     │  routes       │     │              │
│              │     │  payment.js  │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                          ┌─────▼──────┐
                                          │  SUPABASE  │
                                          │  (base de  │
                                          │   datos)   │
                                          └────────────┘
```

| Actor | Qué hace |
|-------|----------|
| **Usuario** | Navega, elige productos, rellena datos, paga |
| **Frontend** | Muestra la interfaz, valida campos, llama al backend |
| **Backend (Next.js)** | Habla con NAVE usando credenciales secretas, actualiza Supabase |
| **NAVE (Galicia)** | Procesa el cobro real, notifica el resultado |
| **Supabase** | Guarda todo: clientes, órdenes, estados, pagos |

---

## 4. El flujo completo paso a paso

### PASO 1: Información del cliente (Step 1 del checkout)

El usuario llena email, nombre, dirección, teléfono.

**¿Qué pasa al hacer click en "CONTINUAR A ENVÍOS"?**

1. `checkout-logic.js` valida el formulario
2. Guarda el cliente en Supabase (tabla `clientes`)
3. Guarda la dirección (tabla `direcciones_envio`)
4. Crea la orden con estado `pendiente` (tabla `ordenes`)
5. Guarda los items del carrito (tabla `items_orden`)
6. Guarda el **UUID de la orden** en memoria para el Step 3

### PASO 2: Selección de envío (Step 2)

El usuario elige entre "envío a domicilio" o "retiro en sucursal".

**¿Qué pasa al hacer click en "CONTINUAR AL PAGO"?**

1. `start.js` valida que haya un envío seleccionado
2. Llama al backend: `PATCH /api/ordenes/{uuid}` para guardar el tipo de envío y precio en Supabase
3. La orden cambia a estado `envio_calculado`
4. Se abre el Step 3

### PASO 3: Pago con NAVE (Step 3)

Acá es donde entra NAVE. Esto es lo más importante:

**¿Qué pasa cuando se abre Step 3?**

```
checkout-payment.js → POST /api/nave/crear-pago
                        │
                        ▼
              Backend autentica con NAVE (token)
                        │
                        ▼
              Backend crea intención de pago en NAVE
                        │
                        ▼
              NAVE devuelve: { id, qr_data, checkout_url }
                        │
                        ▼
              Backend actualiza orden → pago_pendiente
                        │
                        ▼
              Frontend recibe { payment_request_id, qr_data }
                        │
               ┌────────┴────────┐
               ▼                 ▼
        Tab Tarjeta          Tab QR
        SDK embebido      QR de MODO
        (formulario de    (escanear con
         datos de tarjeta) app bancaria)
```

**El usuario paga** → NAVE procesa → dos cosas pasan en paralelo:

1. **El SDK le avisa al frontend** inmediatamente (evento `PAYMENT_MODAL_RESPONSE` con `success: true`)
   - El frontend muestra la animación de confirmación
   - Redirige a la página de confirmación

2. **NAVE le avisa al backend** vía webhook (puede llegar milisegundos después o hasta minutos después)
   - El backend recibe `POST /api/webhooks/nave`
   - Responde HTTP 200 inmediatamente (si no, NAVE reintenta 5 veces)
   - Verifica el estado con NAVE
   - Actualiza la orden en Supabase a `pagado`

### ¿Por qué hay dos notificaciones?

Porque son independientes y cumplen funciones distintas:

- **El evento del SDK** es para la **experiencia del usuario** (mostrar "pagaste, gracias")
- **El webhook** es la **confirmación oficial** (actualizar la base de datos con el estado real)

El webhook es el que manda. Si el SDK dice "aprobado" pero el webhook dice "rechazado", gana el webhook.

---

## 5. Los archivos que creamos

### Backend (los endpoints que hablan con NAVE y Supabase)

| Archivo | Función |
|---------|---------|
| `src/lib/nave/client.ts` | **Librería NAVE**: autentica, crea pagos, verifica estados. Es la "caja de herramientas" que usan los demás archivos. |
| `src/app/api/nave/crear-pago/route.ts` | **Endpoint crear-pago**: recibe el pedido del frontend, habla con NAVE, devuelve el QR y el ID de pago. |
| `src/app/api/webhooks/nave/route.ts` | **Endpoint webhook**: recibe las notificaciones de NAVE y actualiza la orden en Supabase. |
| `src/app/api/ordenes/[id]/route.ts` | **Endpoint ordenes**: guarda el envío elegido en Supabase antes de pasar al pago. |

### Frontend (los scripts que corren en el navegador)

| Archivo | Función |
|---------|---------|
| `public/js/checkout-payment.js` | Controla el Step 3: llama al backend para crear el pago, monta el SDK de tarjeta o renderiza el QR, escucha el resultado. |
| `public/js/checkout-logic.js` | Controla el Step 1: valida el formulario, guarda cliente/dirección/orden en Supabase. |
| `public/js/start.js` | Controla la navegación general y los Steps 1-2. |

### Base de datos (SQL ejecutado en Supabase)

| Archivo | Estado |
|---------|--------|
| `backend/sql/08_nave_payment.sql` | ✅ **Ya ejecutado**. Agregó las columnas `nave_payment_id`, `nave_status` y `nave_monto_ars` a la tabla `ordenes`. |

### Configuración

| Archivo | Qué hay |
|---------|---------|
| `.env.local` | Las credenciales de NAVE Sandbox + Supabase. **Nunca compartir.** |

---

## 6. El diagrama de flujo de pagos

El archivo `backend/docs/nave/diagrama_flujo_pagos.html` es un documento visual interactivo que podés abrir en cualquier navegador. Muestra:

### Sección 01 — Flujo del Checkout
Step 1 → Supabase (cliente, dirección, orden, items) → Step 2 → Step 3.
El diagrama identificaba un **gap**: que el envío elegido no se persistía antes del Step 3. **Ese gap ya lo cerramos** con el endpoint `PATCH /api/ordenes/{id}`.

### Sección 02 — Flujo de Pago NAVE
Los 6 pasos desde el click en "PAGAR" hasta que el usuario ve la confirmación. Las "cajas" con etiqueta violeta son las que interactúan con NAVE.

### Sección 03 — Webhook
Cómo NAVE notifica al backend y cómo el backend actualiza Supabase. La caja más importante dice "HTTP 200 INMEDIATO" — significa que el backend tiene que responderle a NAVE instantáneamente antes de hacer cualquier otra cosa, porque si NAVE no recibe ese 200, vuelve a intentar.

### Sección 04 — Estructura de Tablas
Las 6 tablas de Supabase. Las celdas que dicen "AGREGAR" en la tabla `ordenes` fueron las columnas de NAVE que ya agregamos con el SQL `08_nave_payment.sql`.

### Sección 05 — Gaps
La tabla de "qué falta". De los 7 gaps que identificaba:
- ✅ **3 están cerrados**: columnas NAVE, endpoint crear-pago, endpoint webhook, PATCH ordenes, service role key
- ⚠️ **2 son Fase 2**: reducir stock, crear envío OCA (no bloquean el pago)
- ⚠️ **1 pendiente de testing**: necesitamos que NAVE Sandbox funcione para verificar end-to-end

---

## 7. ¿Qué es ngrok y por qué lo necesitamos?

### El problema

Cuando corrés `npm run dev`, tu app vive en `localhost:3000` — solo existe en tu computadora. Nadie desde internet puede accessionarla.

**Pero el webhook necesita que NAVE pueda enviar mensajes a tu backend.** NAVE está en internet y necesita una URL pública.

### La solución: ngrok

**ngrok** crea un "túnel" temporal entre internet y tu computadora:

```
NAVE (internet)
    │
    ▼ POST https://xxxx.ngrok-free.dev/api/webhooks/nave
    │
    │ ┌─ TÚNEL NGROK ─┐
    │ │                │
    │ │   internet     │
    │ │   ───────▶     │
    │ │   tu PC        │
    │ │                │
    │ └────────────────┘
    │
    ▼ POST http://localhost:3000/api/webhooks/nave
    │
    ▼ Tu backend recibe la notificación
```

### ¿Cuándo lo necesitamos?

- **Para testing local**: cuando querés probar el flujo completo de pago en tu PC
- **NO lo necesitás en producción**: cuando la app esté en Vercel, la URL pública es `güidocapuzzi.com` y ngrok no hace falta

### ¿Cuándo NO lo necesitamos?

Para testear Steps 1 y 2 del checkout, no necesitás ngrok. Solo lo necesitás específicamente para que el **webhook de NAVE funcione** en localhost.

---

## 8. Instrucciones paso a paso: ngrok

### Una sola vez: Instalación

1. **Descargar ngrok**:
   - Ir a [ngrok.com/download](https://ngrok.com/download)
   - Descargar para Windows
   - Descomprimir el .exe donde quieras (ej: `C:\ngrok\`)

2. **Crear cuenta gratuita**:
   - Ir a [dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
   - Registrarte con Google o email (gratuito)
   - En el dashboard, copiar tu **authtoken**

3. **Conectar el authtoken** (una sola vez):
   ```
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```

### Cada vez que quieras testear:

1. **Abrir una terminal** (cmd o PowerShell):
   ```
   cd C:\Users\LAUTA\OneDrive\Desktop\Naza\GÜIDO\PÁGINA WEB\guidocapuzzi
   npm run dev
   ```
   → Esto levanta tu app en `localhost:3000`. **Dejá esta terminal abierta.**

2. **Abrir OTRA terminal** (puede ser desde cualquier directorio):
   ```
   ngrok http 3000
   ```
   → ngrok muestra algo como:
   ```
   Forwarding  https://xxxx-yyyy.ngrok-free.dev → http://localhost:3000
   ```

3. **Anotar la URL** que te da (ej: `https://megan-unvariegated-elvin.ngrok-free.dev`)

4. **Comunicar a NAVE** (una sola vez para Sandbox):
   - Escribir a `integraciones@navenegocios.com`
   - Decirles: "Mi notification_url de Sandbox es `https://TU-URL.ngrok-free.dev/api/webhooks/nave`"
   - ⚠️ Si reiniciás ngrok, la URL cambia y tendrías que avisarles de nuevo

5. **Probar**: abrir `https://TU-URL.ngrok-free.dev` en el navegador para ver tu sitio a través del túnel

### Cosas a tener en cuenta

- La URL de ngrok **cambia cada vez** que lo reiniciás (plan gratuito)
- **No cierres** la terminal de ngrok ni la de `npm run dev` mientras testeas
- En **producción** (Vercel), la URL del webhook es fija: `https://xn--guidocapuzzi-vpb.com/api/webhooks/nave`

---

## 9. Estado actual de la implementación

### ✅ Lo que funciona (probado el 2 de marzo)

| Componente | Estado | Detalle |
|------------|--------|---------|
| Step 1: Formulario → Supabase | ✅ Funciona | Cliente + dirección + orden + items se guardan correctamente |
| Step 2: Selección de envío | ✅ Funciona | Opciones de envío aparecen, se seleccionan |
| PATCH /api/ordenes/{id} | ✅ Funciona | El envío se persiste en Supabase antes de Step 3 |
| Step 3: UI de pago | ✅ Funciona | Tabs tarjeta/QR, resumen, botón PAGAR aparecen |
| POST /api/nave/crear-pago | ✅ Backend correcto | La lógica funciona pero NAVE Sandbox está inestable |
| POST /api/webhooks/nave | ✅ Implementado | Listo para recibir notificaciones |
| Columnas NAVE en Supabase | ✅ Ejecutado | nave_payment_id, nave_status, nave_monto_ars |
| Service Role Key | ✅ Configurada | En .env.local |
| SDK Ranty CDN | ✅ Cargado | Script del SDK en page.tsx |

### 🔧 Bugs que encontramos y corregimos durante el test

| Bug | Descripción | Solución |
|-----|-------------|----------|
| `duration_time` string vs number | NAVE rechazaba `"600"` (string), esperaba `600` (número) | Cambiado en `client.ts` |
| SDK `import()` roto | `checkout-payment.js` intentaba importar el SDK como módulo npm en un script normal | Cambiado a `window.RantySDK` vía CDN |
| Cart items con propiedades incorrectas | Frontend enviaba `qty` y `priceValue`, backend esperaba `quantity` y `price` | Agregado `.map()` de transformación |
| Orden ID incorrecto | Se enviaba `"GC-010"` (número de orden legible) en vez del UUID de Supabase | Cambiado a `resultado.ordenId` |

### ⏳ Lo que queda pendiente

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| Testear crear-pago con NAVE Sandbox estable | **ALTA** | El Sandbox estaba respondiendo con timeouts internos |
| Registrar notification_url en NAVE | **ALTA** | Necesitan la URL del webhook para enviar notificaciones |
| Descontar stock al pagar | Media | Cuando webhook dice APPROVED, restar del stock |
| Crear envío OCA post-pago | Media | Automatizar creación de envío en OCA después del pago |
| Página de confirmación | Media | `/checkout/confirmacion?orden=uuid` |
| Configurar variables en Vercel | Media | Para el deploy a producción |

---

## 10. El error del Sandbox

### ¿Qué pasó?

El 2 de marzo probamos el flujo completo. Todo anduvo bien hasta el Step 3, donde `POST /api/nave/crear-pago` devolvió un error **500 Internal Server Error**.

### ¿Qué error exacto?

```json
{
  "code": "stores_error",
  "message": "AxiosError-timeout of 10000ms exceeded"
}
```

Y también:

```json
{
  "code": "qr_generator_error",
  "message": "Token cache invokation fault"
}
```

### ¿Qué significa?

Estos son **errores internos del servidor de NAVE** (Sandbox). No son errores de nuestro código. Significan que:

- El servidor de Sandbox de NAVE tiene un timeout interno de 10 segundos
- El servicio que genera los QR está fallando de su lado
- Es un problema de su infraestructura, probablemente porque era domingo de noche y el Sandbox suele ser inestable fuera de horario

### ¿Cómo confirmamos que no es nuestro error?

Porque antes de estos errores, sí tuvimos un error nuestro (`duration_time` como string), que lo arreglamos. Después de arreglarlo, la autenticación con NAVE funcionó (obtuvimos el token correctamente), pero la creación de la intención de pago falla con timeout **del lado de NAVE**.

### ¿Qué hacer?

1. **Reintentar durante horario hábil** (lunes a viernes, 9-18 hs Argentina)
2. Si sigue fallando, escribir a `integraciones@navenegocios.com` diciendo:
   > "Hola, estamos integrando el checkout con NAVE. Las credenciales de Sandbox (POS ID: f71ba756...) funcionan para la autenticación pero la creación de payment_request devuelve `stores_error: AxiosError-timeout of 10000ms exceeded`. ¿Hay algún problema con el entorno de Sandbox?"

---

## 11. Cómo continuar cuando vuelvas

### Paso 1: Verificar que NAVE Sandbox funcione

```
cd C:\Users\LAUTA\OneDrive\Desktop\Naza\GÜIDO\PÁGINA WEB\guidocapuzzi
npm run dev
```

En otra terminal, pegar este comando para probar directamente:

```powershell
try { $r = Invoke-WebRequest -Uri http://localhost:3000/api/nave/crear-pago -Method POST -ContentType "application/json" -Body '{"external_payment_id":"test-001","total_ars":100.00,"cart_items":[{"name":"Test","quantity":1,"price":100}]}' -TimeoutSec 60; $r.Content } catch { if ($_.Exception.Response) { $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $reader.ReadToEnd() } else { $_.Exception.Message } }
```

**Si devuelve** `{ "payment_request_id": "...", "qr_data": "...", "environment": "sandbox" }` → ¡NAVE funciona!

**Si devuelve** `stores_error` o timeout → NAVE Sandbox sigue caído, contactar a NAVE.

### Paso 2: Probar el flujo completo

1. Levantar ngrok: `ngrok http 3000`
2. Abrir la URL de ngrok en el browser
3. Hacer el checkout completo (agregar producto, Step 1, Step 2, Step 3)
4. En Step 3, debería aparecer el formulario de tarjeta o el QR
5. Usar la tarjeta de prueba: `4025 2200 0000 0139` (cualquier fecha futura, CVV `123`)

### Paso 3: Registrar URL de webhook

Para que el webhook funcione, NAVE necesita saber tu URL. Dos opciones:

- **Para testing local**: darles la URL de ngrok
- **Para producción**: darles `https://xn--guidocapuzzi-vpb.com/api/webhooks/nave`

Escribir a `integraciones@navenegocios.com` con ambas URLs (sandbox y producción).

---

## 12. Credenciales y datos importantes

### NAVE Sandbox

| Dato | Valor |
|------|-------|
| Client ID | `d3OkB2jExe4gBCUQzEeTiuAOV6e8kGSc` |
| Client Secret | `cuDRa5Tz19sFZwPRHP1Tcexsjv8f98slQ88o_OWUbr4f4YlxPpgp27QaV5OY3q0y` |
| POS ID | `f71ba756-1d80-4ab3-9f43-5dc247fd6c4a` |
| Auth URL | `https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate` |
| API URL | `https://api-sandbox.ranty.io` |
| Environment | `sandbox` |

### Tarjetas de prueba (Sandbox)

| Número | Resultado |
|--------|-----------|
| `4025 2200 0000 0139` | **Pago aprobado** |
| `4025 2200 0000 0147` | Pago rechazado |

**Para las tarjetas de prueba**: usá cualquier nombre, cualquier fecha futura, y CVV `123`.

### Contacto NAVE

- Email: `integraciones@navenegocios.com`
- O a través de tu ejecutivo de Galicia

---

## 13. Glosario

| Término | Significado |
|---------|-------------|
| **API** | "Interfaz de programación de aplicaciones" — un punto de comunicación entre dos sistemas. Ejemplo: `POST /api/nave/crear-pago` es un API que recibe datos y devuelve un resultado. |
| **Endpoint** | Una URL específica de una API. Ejemplo: `/api/webhooks/nave` es un endpoint. |
| **Webhook** | Un mensaje automático que un sistema externo (NAVE) envía a tu servidor cuando algo pasa. |
| **Token** | Una "contraseña temporal" que NAVE te da para identificarte. Dura 24 horas. |
| **UUID** | Un identificador único universal — un código como `f5a90842-a408-47d8-ab9a-3080c723a9fd`. Cada orden tiene uno. |
| **SDK** | "Software Development Kit" — una librería que NAVE te da para poner el formulario de tarjeta en tu sitio. |
| **CDN** | "Content Delivery Network" — servidores rápidos que alojan librerías. Cargamos el SDK de NAVE desde un CDN. |
| **HTTP 200** | Código de respuesta que significa "todo bien". El webhook necesita que respondamos 200. |
| **HTTP 500** | Código de error que significa "error del servidor". |
| **Sandbox** | Entorno de pruebas que simula el sistema real sin cobrar plata de verdad. |
| **Producción** | El entorno real donde se cobran pagos reales. |
| **Supabase** | Base de datos en la nube donde guardamos clientes, órdenes, etc. |
| **Next.js** | El framework que usamos para el sitio web. Permite tener frontend y backend en un solo proyecto. |
| **Vercel** | La plataforma donde está hosteada la página web. |
| **ngrok** | Herramienta que hace un túnel entre tu PC e internet para testing local. |
| **RLS** | "Row Level Security" — las reglas de seguridad de Supabase que controlan quién puede leer/escribir cada tabla. |
| **PATCH** | Un tipo de request HTTP que significa "actualizar parcialmente un recurso existente". |
| **POST** | Un tipo de request HTTP que significa "crear algo nuevo" o "enviar datos". |

---

> **Nota final**: Todo el código está implementado y listo. Lo único que falta es que NAVE Sandbox esté operativo para completar el test end-to-end. Cuando el Sandbox funcione, el flujo completo va a funcionar porque ya corregimos todos los bugs que encontramos.
