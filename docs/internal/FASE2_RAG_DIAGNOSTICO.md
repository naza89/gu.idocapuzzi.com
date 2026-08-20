# FASE 2 — RAG en GÜIDO · diagnóstico contra el repo real

> **Qué es esto:** el contraste entre el plan externo
> `C:\Users\LAUTA\ObsidianVaults\naza\Plan FASE 2 — RAG en GÜIDO.md` (escrito
> leyendo el repo desde afuera) y lo que efectivamente hay en el código.
> **Fecha:** 2026-08-20 · **Commit base:** `513ba80` · **Deploy en producción:** `dpl_2pJapixu…` (READY)

---

## A. Afirmación del plan → ¿es cierta?

| # | Afirmación del plan | ¿Cierta? | Evidencia |
|---|---|---|---|
| 1 | No existe CI: ni `.github/`, ni `azure-pipelines.yml`, ni tests, ni `npm test` | **Era cierta** | Verificado antes de esta sesión. **Ya no**: se crearon los tres |
| 2 | El catálogo está duplicado: literal JS en `start.js` + `productos` en Supabase | **Cierta** | `public/js/start.js:128` (`const products = [`, 23 productos) vs. tabla `productos` (15 filas) |
| 3 | Los precios pueden estar desincronizados entre front y base | **Falsa hoy** | `verificar-catalogo` no encontró **ni un** `precio-desincronizado`. Los 23 productos coinciden al centavo |
| 4 | Si un SKU no resuelve, `crear-orden` devuelve 409 y ese producto no se puede comprar | **Cierta, y está pasando** | `src/app/api/checkout/crear-orden/route.ts:234-241`. Ver hallazgo **B.1** |
| 5 | `crear-orden` resuelve el precio contra `productos.precio_centavos` e ignora el body | **Cierta** | `route.ts:196-217`; la interfaz `ItemIn` (`route.ts:40-47`) no tiene ningún campo de precio |
| 6 | La migración 17 cerró la RLS; el asistente tendrá que leer con `service_role` | **Cierta** | `backend/sql/17_rls_lockdown_checkout.sql`, corrida el 20-ago |
| 7 | La próxima migración es la 21 | **Cierta** | `backend/sql/` llega hasta `20_ajuste_stock_xs_l.sql` |
| 8 | Existe `src/lib/security.ts` como lugar donde colgar el rate limiting | **Cierta pero engañosa** | El archivo existe y tiene **una sola función** (`safeEqualStr`). **No hay rate limiting de ningún tipo en el repo.** Ver **B.2** |
| 9 | Observabilidad: ninguna | **Cierta, y peor** | No sólo no había: `/api/health` devolvía `{status:'ok'}` incondicionalmente — un verde falso. Ver **C.4** |
| 10 | La guía de talles vive en `SIZE_CHARTS` de `start.js` (9 calces) | **Cierta** | `start.js:~230` en adelante |
| 11 | Faltan T&C y política de cambios/devoluciones | **Parcialmente falsa** | Ya existen dentro de `src/app/page.tsx` (~línea 1362: plazo de 7 días, nota de crédito a 60 días). Están **escritos pero embebidos en el HTML**, que es exactamente el problema que el plan quería evitar |
| 12 | El widget sería el primer componente React del repo | **Cierta** | No hay ningún `.tsx` de UI fuera de `layout.tsx` y `page.tsx` |
| 13 | La clave de OCA filtrada sigue pendiente de rotar | **Sin verificar desde acá** | Es una acción de Naza en el panel de ePak. Sigue en el Plan Activo |

---

## B. Hallazgos que el plan no vio

### B.1 · ✅ RESUELTO (opción A, mismo día) — las 4 piezas 1/1 no se podían comprar

Lo encontró `scripts/verificar-catalogo.mjs` en su primera corrida.

**El hecho:** las cuatro INTERVENCIONES existen en `variantes_producto` **sólo en talle M**:

| SKU | talle | stock | one_of_one |
|---|---|---|---|
| `JEA-1/1-SUR-M` | M | 1 | true |
| `JEA-1/1-ENC-M` | M | 1 | true |
| `JEA-1/1-WAX-M` | M | 1 | true |
| `BER-1/1-CAM-M` | M | 1 | true |

Pero la PDP hardcodea cuatro botones de talle para **todo** producto, con **S**
marcado como activo por defecto (`public/js/start.js:1404-1407`):

```html
<button class="size-btn" ...>XS</button>
<button class="size-btn active">S</button>   <!-- ← activo por defecto -->
<button class="size-btn" ...>M</button>
<button class="size-btn" ...>L</button>
```

Y el carrito arma el SKU como `${product.sku}-${size}` (`start.js:798-800`).

**La consecuencia:** un cliente entra a "JEAN PINTOR WILDCAT", aprieta AÑADIR sin
tocar el talle, y el carrito manda `JEA-1/1-SUR-S`. Ese SKU no existe →
`crear-orden` acumula el item en `noResueltos` y corta con **409**. El cliente ve
*"No pudimos procesar: … Escribinos y lo resolvemos"* y no puede comprar.

Son **$580.000 de inventario** (150k + 150k + 150k + 130k) invendibles por el
camino por defecto. Sólo se compran si el cliente elige M a mano — y nada en la
pantalla le dice que M es el único talle.

Esto es la confirmación dura del pendiente que ya estaba anotado como *"las 4
piezas 1/1 muestran talle S hardcodeado"*: no era cosmético.

**Tres arreglos posibles, en orden de preferencia:**

1. **Que la PDP muestre los talles reales por producto** (leer los talles del
   catálogo en vez de hardcodear cuatro). Es el arreglo correcto y el que además
   deja de mentir en el resto de los productos. Toca `start.js`, así que
   **lo decide Naza**.
2. **Mínimo, acotado a INTERVENCIONES:** que las piezas `1/1` rendericen sólo M
   activo y deshabiliten los otros tres botones. Cambio chico, mismo archivo.
3. ~~Crear las variantes XS/S/L con stock 0 en la base~~ — **no**: `crear-orden`
   hoy **no valida stock** (está en la lista de pendientes del Tier 1). Se
   crearía la orden igual y se vendería una prenda que no existe. Cambia un 409
   honesto por una sobreventa silenciosa.

> **✅ Resuelto el 2026-08-20.** Naza eligió la **opción 1**. La PDP ahora lee los
> talles reales: `TALLES_DEFAULT` + `getSizes(product)` + `getDefaultSize(product)`
> junto al catálogo en `start.js`; las 4 INTERVENCIONES declaran `sizes: ['M']`.
> Se dibujan igual las cuatro posiciones (no se toca el ancho de la fila ni el CSS),
> pero las no disponibles van con `opacity:.5`, `pointer-events:none`, `aria-disabled`
> y `title`, y el handler además corta si el botón tiene `size-btn--na` — `pointer-events`
> por sí solo no frena un click sintético. El talle activo se le pasa a `buildSizeGuide`
> en lugar del `'S'` literal.
>
> **Verificado:** en browser, `jean-pintor-wildcat` → XS/S/L atenuados, **M activo**;
> `remera-guido-negro` sin cambios. Contra Supabase con la consulta exacta de
> `crear-orden`: `JEA-1/1-SUR-S` no resuelve, los cuatro `-M` resuelven con su precio.
> `verificar:catalogo`: **12 errores → 0**.
>
> **Y quedó guardado:** `tallesDeProducto()` en el verificador es el espejo de
> `getSizes()` y chequea los talles declarados, no cuatro fijos; se sumó el caso
> inverso (`talle-no-ofrecido`) y 9 tests que impiden que vuelva el `'S'` hardcodeado.

### B.2 · 🟠 No hay rate limiting en ningún endpoint público

`src/lib/security.ts` tiene exactamente una función (`safeEqualStr`). No hay
throttle en `/api/oca/cotizar`, `/api/checkout/crear-orden` ni
`/api/nave/crear-pago` — todos públicos, todos pegándole a Supabase o a un
proveedor externo por request.

El plan lo menciona como requisito del asistente ("rate limiting desde el día
uno"), pero el agujero **ya existe hoy**, sin asistente. `cotizar` es el más
expuesto: sin auth, sin límite, y cada llamada golpea la API de OCA.

No lo implementé: meter middleware en el camino del dinero la noche anterior al
E2E cambia lo que el E2E está por validar. Va después del go-live, o antes si
Naza lo prioriza.

### B.3 · 🟡 El lint del repo estaba efectivamente apagado

`npm run lint` daba **56 errores y 281 warnings** — imposible usarlo como gate.
Pero 52 de los 56 venían de `public/vendor/supabase-js.umd.js`, que es el bundle
UMD de Supabase que genera `scripts/vendor-supabase.mjs`: código de terceros,
regenerado en cada build, que no tiene sentido lintear.

Descontando lo vendorizado quedaban **2 errores reales** (`prefer-const`).
Ambos arreglados. El repo está en **0 errores**.

### B.4 · 🟡 Los T&C existen pero embebidos en `page.tsx`

El plan asumía que faltaban. Están escritos (plazo de cambio de 7 días, nota de
crédito a 60 días, dirección de contacto) pero viven dentro del HTML de
`src/app/page.tsx`. Es exactamente el escenario que la sección 3.3 del plan
quería evitar: *"si los escribís solo dentro del HTML, dentro de dos meses los
vas a tener que volver a extraer"*.

Ya hay que extraerlos. La buena noticia: el contenido no hay que escribirlo,
sólo moverlo a `docs/corpus/*.md` con frontmatter.

### B.5 · 🟢 Dos descripciones de producto quedaron de placeholder

`bermuda-double-knee-negro` → *"WORKWEAR ESTILO."* (16 caracteres)
`bermuda-patchwork-indigo` → *"CONSTRUCCIÓN PATCHWORK."* (23 caracteres)

Hoy no molesta: las dos están en `BERMUDAS / SHORTS`, que es categoría teaser
(no comprable). Pero son las dos únicas del catálogo así, y son corpus del
asistente el día de mañana.

---

## C. Qué se hizo en esta sesión

| # | Entregable | Archivos | Riesgo para el lanzamiento |
|---|---|---|---|
| C.1 | **Verificador de catálogo** — diff front ↔ Supabase, sale ≠ 0 si hay diferencias | `scripts/verificar-catalogo.mjs`, `scripts/catalogo-front.mjs` | **Ninguno** (solo lectura) |
| C.2 | **43 tests** — OCA calculators/validations, extractor de catálogo, invariantes de seguridad | `tests/*.test.ts` | **Ninguno** |
| C.3 | **CI en Actions y Azure DevOps** — Lint → Test → Build | `.github/workflows/ci.yml`, `azure-pipelines.yml` | **Ninguno** |
| C.4 | **`/api/health` real** — chequea Supabase + env vars, 503 si algo crítico falta | `src/app/api/health/route.ts` | **Bajo** (endpoint aislado, no toca el camino de compra) |
| C.5 | **Migración 21 · pgvector** — tabla, HNSW, RLS cerrada, RPC. **Escrita, NO corrida** | `backend/sql/21_pgvector_documentos_chunks.sql` | **Ninguno** (no la lee nadie) |
| C.6 | **Lint a cero errores** — vendor ignorado + 2 `prefer-const` | `eslint.config.mjs`, 2 rutas | **Ninguno** |

### Sobre el stack de tests: por qué `node --test` y no vitest

`CLAUDE.md` pide no instalar dependencias sin confirmar. Node 24 (el que corre
acá y el que usan los dos pipelines) trae runner de tests nativo y *type
stripping* de TypeScript, así que los 43 tests corren **sin agregar una sola
dependencia**. Si más adelante hacen falta mocks o cobertura, vitest se discute
entonces — pero la deuda de "no hay tests" ya está saldada sin tocar
`package.json` más que para agregar scripts.

Costo lateral: el runner nativo resuelve como ESM y exige la extensión en el
import, por eso los tests importan `'../src/lib/oca/validations.ts'` y se agregó
`allowImportingTsExtensions` al `tsconfig.json`. También se cambiaron tres
imports de `src/lib/oca/` a `import type` (eran tipos usados como valor).

### Sobre el invariante de seguridad como test

`tests/invariante-precio-servidor.test.ts` verifica la **forma** del contrato —
que el body de `crear-orden` no declare campos de precio, que el precio salga de
`productos.precio_centavos`, que los endpoints de OCA sigan detrás de
`requireAdmin`, que `public/js/` no mencione ningún secreto de servidor.

**No** ejercita los handlers: eso pediría credenciales dentro del CI, y el CI no
puede tener las claves productivas (el 18-ago ya se filtró la de OCA en este
mismo repo). El chequeo de comportamiento real sigue siendo el E2E manual. Este
test cubre exactamente donde estuvo el agujero del 18-ago, y nada más.

---

## D. Backlog priorizado

### P0 — antes del go-live

| Ítem | Esfuerzo | Riesgo | Quién |
|---|---|---|---|
| **Decidir y aplicar el arreglo de talles de las 1/1** (B.1) | 1-2 h | **Alto si no se hace** | Naza decide, agente implementa |
| Correr la migración 21 en Supabase (opcional; no bloquea nada) | 5 min | Ninguno | Naza |
| Conectar el pipeline de Azure DevOps al repo (los 3 pasos del encabezado del YAML) | 15 min | Ninguno | Naza |
| Correr `npm run verificar:catalogo` **antes y después** de cargar los precios finales | 1 min | Ninguno | Naza |

### P1 — pre-lanzamiento, sin bloquear

| Ítem | Esfuerzo | Riesgo |
|---|---|---|
| Extraer T&C + política de envíos + cambios de `page.tsx` a `docs/corpus/*.md` (B.4) | 2-3 h | Ninguno |
| Exportar `SIZE_CHARTS` (9 calces) a `docs/corpus/talles.md` | 1 h | Ninguno |
| Dataset dorado: 30-50 preguntas reales de DM/WhatsApp en `evals/preguntas.jsonl` | continuo | Ninguno |
| Descripciones de las 2 bermudas placeholder (B.5) | 30 min | Ninguno |
| Crear el proyecto de Langfuse para GÜIDO y guardar las claves | 5 min | Ninguno |
| Elegir proveedor de embeddings (define la dimensión de la migración 21) | decisión | Ninguno |

### P2 — post-lanzamiento

| Ítem | Nota |
|---|---|
| Rate limiting en los endpoints públicos (B.2) | Empezar por `/api/oca/cotizar` |
| Alertas del camino del dinero (webhook de NAVE que falla y nadie se entera) | Es la observabilidad que la tienda necesita, distinta de la del asistente |
| Ingest + `/api/asistente` + widget React | El grueso de la FASE 2 |
| Evals de retrieval como gate del CI | Cuelga del stage Test que ya existe |

---

## E. Preguntas abiertas para Naza

1. **Talles de las 1/1 (B.1):** ¿arreglo completo (la PDP lee los talles reales
   del catálogo) o el mínimo acotado a INTERVENCIONES? El completo es mejor y
   toca más `start.js`.
2. **Proveedor de embeddings:** define la dimensión de `vector(n)` en la
   migración 21. Hoy está en 1536 (OpenAI `text-embedding-3-small` / Cohere
   multilingual v3). Cambiarla después obliga a reembeber.
3. **Nombre y org del proyecto de Azure DevOps.** El YAML asume que la service
   connection apunta a `naza89/gu.idocapuzzi.com`. Si la org no es `naza89`, hay
   que ajustar el comentario del encabezado (el pipeline en sí no depende).
4. **Rate limiting (B.2):** ¿entra antes del go-live o después? Mi
   recomendación: después, salvo que se promocione la tienda de entrada.
5. **`ADMIN_API_TOKEN` en Vercel:** el `/api/health` nuevo lo usa para decidir si
   devuelve el detalle. Si no está seteada, el endpoint funciona igual pero
   siempre en modo público. Sigue en la lista de env vars pendientes.
