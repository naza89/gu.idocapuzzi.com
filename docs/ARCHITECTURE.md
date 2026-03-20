# GÜIDO CAPUZZI — Arquitectura técnica

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | Vanilla JS (DOM manipulation directo) |
| Base de datos | Supabase (PostgreSQL + REST API + RLS) |
| Pagos | NAVE / Banco Galicia (OAuth2 + SDK) |
| Envíos | OCA ePak (XML over HTTP) |
| Hosting | Vercel |
| Dominio | guidocapuzzi.com |

## Patrón arquitectónico: SPA híbrida

```
Browser request → Next.js (Vercel)
                    ↓
              page.tsx (Server Component)
                    ↓
              dangerouslySetInnerHTML → HTML estático completo
                    ↓
              Browser carga JS:
                1. supabase-config.js  → Supabase client + helpers stock
                2. checkout-logic.js   → Formularios checkout Step 1-2
                3. checkout-payment.js → NAVE SDK Step 3
                4. start.js            → APP PRINCIPAL (3220 líneas)
```

### Por qué esta arquitectura

El sitio se construyó originalmente como HTML + vanilla JS. Se migró a Next.js para tener API routes (necesarias para proxy a OCA y NAVE), pero se mantuvo el frontend vanilla para no reescribir todo. `page.tsx` inyecta el HTML como string y React NO hidrata esos nodos — `start.js` controla todo el DOM.

## Routing

Next.js rewrites en `next.config.ts`:
- `/shop` → `/`
- `/shop/:slug` → `/`
- `/cuenta` → `/`
- `/contacto` → `/`

`start.js` detecta la URL con History API y muestra/oculta secciones:
- `state-home` — Hero + secciones de campaña
- `state-shop` — Grilla de productos con filtros por categoría
- `state-pdp` — Product Detail Page (imágenes, talles, stock, agregar al carrito)
- `state-cart` — Cart drawer lateral
- `state-checkout` — 3 pasos (datos → envío → pago)
- `state-account` — Cuenta del usuario
- `state-contact` — Formulario de contacto
- `state-legales` — Términos y condiciones

## Flujo de datos

### Producto → Carrito → Checkout

```
1. start.js renderiza productos desde datos hardcoded en HTML
2. Stock real se consulta a Supabase vía supabase-config.js
3. "Agregar al carrito" → push a array `cart[]` en memoria
4. Checkout Step 1: Form → POST a Supabase (cliente + dirección + orden + items)
5. Checkout Step 2: POST /api/oca/cotizar → opciones de envío → PATCH /api/ordenes/[id]
6. Checkout Step 3: POST /api/nave/crear-pago → SDK tarjetas o QR MODO
7. Webhook /api/webhooks/nave → actualiza orden a 'pagado'
```

### Diagrama de estados de orden

```
pendiente → envio_calculado → pago_pendiente → pagado → preparando → enviado → entregado
                                                                                    ↓
                                                                               cancelado
```

## Base de datos

### Tablas (Supabase PostgreSQL)

| Tabla | Descripción | Migración |
|-------|------------|-----------|
| `productos` | Productos base (nombre, precio_centavos, categoría) | 01 |
| `variantes_producto` | SKU + color + talle + stock + dimensiones | 01, 07 |
| `clientes` | Email único, nombre, teléfono | 01 |
| `direcciones_envio` | Dirección completa + campos separados OCA | 01, 07 |
| `ordenes` | Estado, montos en centavos, campos NAVE y OCA | 01, 07, 08 |
| `items_orden` | Snapshot de producto al momento de compra | 01 |

### Migraciones SQL (ejecutar en orden)

1. `01_crear_tablas.sql` — Estructura base
2. `02_politicas_rls.sql` — Row Level Security
3. `03_insertar_productos.sql` — Datos iniciales productos
4. `04_verificacion.sql` — Verificación de datos
5. `05_agregar_update_policies.sql` — Políticas UPDATE
6. `06_actualizar_productos_feb2026.sql` — Actualización catálogo
7. `07_oca_envios.sql` — Columnas OCA en ordenes + dimensiones variantes
8. `08_nave_payment.sql` — Columnas NAVE en ordenes (nave_payment_id, nave_status)

## API Routes

### Pagos (NAVE)

| Método | Ruta | Descripción | Estado |
|--------|------|------------|--------|
| POST | `/api/nave/crear-pago` | Crea intención de pago | Implementado |
| POST | `/api/webhooks/nave` | Recibe notificación de pago | Implementado |
| POST | `/api/webhooks/galicia` | Webhook alternativo con HMAC | Implementado |

### Envíos (OCA)

| Método | Ruta | Descripción | Estado |
|--------|------|------------|--------|
| POST | `/api/oca/cotizar` | Cotizar costo de envío | Implementado |
| GET | `/api/oca/sucursales` | Sucursales por CP | Implementado |
| GET | `/api/oca/centros-costo` | Centros de costo | Implementado |
| POST | `/api/oca/crear-envio` | Crear envío en OCA | Implementado, sin testear |
| GET | `/api/oca/etiqueta` | Descargar etiqueta | Implementado, sin testear |
| GET | `/api/oca/tracking` | Consultar tracking | Implementado, sin testear |
| POST | `/api/oca/anular` | Anular envío | Implementado, sin testear |

### Órdenes

| Método | Ruta | Descripción | Estado |
|--------|------|------------|--------|
| PATCH | `/api/ordenes/[id]` | Actualizar con info de envío | Implementado |

### Utilidades

| Método | Ruta | Descripción | Estado |
|--------|------|------------|--------|
| GET | `/api/health` | Health check | Implementado |

## Dependencias

```json
{
  "@supabase/supabase-js": "^2.95.3",
  "fast-xml-parser": "^5.4.1",
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3"
}
```

Dependencias mínimas — deliberadamente. No hay UI libraries, CSS frameworks, ni state management.
