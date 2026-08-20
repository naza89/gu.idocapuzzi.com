# GÜIDO CAPUZZI — Bitácora del Proyecto

Registro cronológico de decisiones, problemas resueltos y cambios importantes.

---

## 2026-08-20

### ✅ Opción A — la PDP ahora lee los talles reales del catálogo
- **Problema encontrado:** el bloqueante de más arriba. La PDP hardcodeaba los cuatro botones XS/S/M/L con **S activo**, y las 4 piezas 1/1 existen sólo en M. Lo llamativo del bug es que el mecanismo para resolverlo **ya estaba**: `isArchive` (que es `category === 'INTERVENCIONES'`) atenuaba y deshabilitaba los otros tres botones, y `buildSizeGuide` recibía un `fixedSize` para fijar la fila de la tabla. Pero el talle habilitado estaba clavado en `'S'` en los dos lugares. O sea: el único talle seleccionable de una pieza 1/1 era justo el que no existe en la base.
- **Solución adoptada:** Naza eligió la opción A (la correcta, no la mínima). Se agregó `TALLES_DEFAULT` y dos helpers, `getSizes(product)` y `getDefaultSize(product)`, junto al catálogo. Un producto declara `sizes: [...]` sólo si no tiene los cuatro talles; las 4 INTERVENCIONES ahora declaran `sizes: ['M']`. La PDP dibuja las **cuatro posiciones** —para no cambiar el ancho de la fila ni el diseño— pero sólo las disponibles son clickeables: las otras van con `opacity: .5`, `pointer-events: none`, `aria-disabled` y `title="Sin stock en este talle"`. El talle activo pasa a ser el primero real (S si existe, si no el primero que haya), y ese mismo valor se le pasa a `buildSizeGuide` en lugar del `'S'` literal. El handler de click además chequea `size-btn--na` y corta: `pointer-events` solo no frena un click sintético. **Cero cambios de CSS.**
- **Verificado:** en el browser, `jean-pintor-wildcat` renderiza XS/S/L atenuados y sin `pointer-events`, con **M activo**; `remera-guido-negro` queda igual que antes (XS, S activo, M, L, los cuatro habilitados), o sea sin regresión visual en los 19 productos normales. Contra Supabase, con la consulta exacta de `crear-orden`: `JEA-1/1-SUR-S` **no resuelve** (era el 409) y `JEA-1/1-SUR-M`, `JEA-1/1-ENC-M`, `JEA-1/1-WAX-M` y `BER-1/1-CAM-M` resuelven con su precio. `npm run verificar:catalogo` pasó de **12 errores a 0**.
- **Archivo modificado:** `public/js/start.js` (helpers de talles + 4 entradas del catálogo con `sizes` + render de botones + handler), `scripts/catalogo-front.mjs`, `scripts/verificar-catalogo.mjs`, `tests/catalogo-front.test.ts`.
- **Pendiente:** ninguno. El E2E de mañana ya puede comprar una pieza 1/1.

### El verificador y los tests quedaron guardando el mecanismo nuevo
- **Problema encontrado:** si la solución vive sólo en `start.js`, el mismo bug puede volver en la próxima carga de producto sin que nadie se entere. Y el verificador seguía asumiendo que todo producto ofrece los cuatro talles, con lo cual habría empezado a mentir en sentido contrario.
- **Solución adoptada:** `tallesDeProducto()` en `scripts/catalogo-front.mjs` es el espejo exacto de `getSizes()` de `start.js`, y el verificador ahora chequea **los talles declarados**, no cuatro fijos. Se sumó el chequeo inverso: si la base tiene un talle **con stock** que la PDP no ofrece, sale un aviso `talle-no-ofrecido` (venta que no se puede concretar, típico de cargar un talle nuevo y olvidarse de `sizes`). Del lado de los tests, 9 nuevos: que `TALLES_DEFAULT` sea idéntico en los dos archivos, que las 4 INTERVENCIONES declaren sólo M, que ningún producto declare `sizes` vacío o con talles inexistentes, que no vuelva el markup `<button class="size-btn active">S</button>`, que `buildSizeGuide` no vuelva a recibir `'S'` literal y que siga el guard de `size-btn--na` en el handler. **52 tests en verde.**
- **Archivo modificado:** `scripts/catalogo-front.mjs`, `scripts/verificar-catalogo.mjs`, `tests/catalogo-front.test.ts`.
- **Pendiente:** ninguno. A partir de acá, un talle que la PDP ofrezca y la base no tenga **frena el CI**.


### CI, tests y verificador de catálogo — el andamiaje que faltaba (FASE 2, sub-fase 2.1)
- **Problema encontrado:** el repo no tenía **ninguna** red: sin `.github/`, sin `azure-pipelines.yml`, sin un solo test, sin `npm test`. Vercel buildea después del push a `main` y eso era todo el control de calidad. Además `npm run lint` daba **56 errores**, o sea que era inusable como gate — pero 52 de esos 56 salían de `public/vendor/supabase-js.umd.js`, el bundle UMD de terceros que regenera `scripts/vendor-supabase.mjs` en cada build.
- **Solución adoptada:** pipeline `Lint → Test → Build` duplicado en GitHub Actions y en Azure DevOps, con los mismos comandos en los dos (si uno pasa y el otro no, eso ya es la señal). Se agregó `npm run typecheck` (`tsc --noEmit`), `npm test` y `npm run verificar:catalogo`. Se ignoró el código vendorizado en `eslint.config.mjs` y se arreglaron los 2 errores reales (`prefer-const` en `crear-orden` y en el webhook de OCA): **el repo quedó en 0 errores de lint**. Ningún stage recibe credenciales — la clave productiva de OCA ya se filtró una vez en este repo el 18-ago y el CI no puede ser la segunda puerta. No hay stage de Deploy: deploya Vercel solo, y poner uno que no hace nada sería teatro.
- **Archivo modificado:** `.github/workflows/ci.yml` (nuevo), `azure-pipelines.yml` (nuevo), `eslint.config.mjs`, `package.json`, `tsconfig.json`, `src/app/api/checkout/crear-orden/route.ts`, `src/app/api/webhooks/oca/route.ts`.
- **Pendiente:** conectar el pipeline de Azure DevOps al repo desde el panel (service connection a GitHub, que es por proyecto y no se hereda de Mercedino).

### 43 tests con el runner nativo de Node, sin agregar dependencias
- **Problema encontrado:** hacían falta tests, pero `CLAUDE.md` pide no instalar dependencias sin confirmar, y vitest arrastra bastante.
- **Solución adoptada:** Node 24 —el que corre local y el de los dos pipelines— trae runner de tests nativo y *type stripping* de TypeScript, así que los tests corren sin una sola dependencia nueva. Cubren `src/lib/oca/calculators.ts` (peso, volumen, el caso de `peso: 0` que distingue `??` de `||`), `src/lib/oca/validations.ts` (CP argentino, tope de 50 kg, campos requeridos) y el extractor de catálogo. Costo lateral: el runner nativo resuelve como ESM y exige la extensión en el import, así que los tests importan `'../src/lib/oca/validations.ts'` y se sumó `allowImportingTsExtensions` al `tsconfig.json`; tres imports de `src/lib/oca/` pasaron a `import type` (eran tipos usados como valor).
- **Archivo modificado:** `tests/oca-calculators.test.ts`, `tests/oca-validations.test.ts`, `tests/catalogo-front.test.ts`, `tests/invariante-precio-servidor.test.ts` (todos nuevos), `tsconfig.json`, `src/lib/oca/{validations,xml-generator,xml-parser}.ts`.
- **Pendiente:** ninguno. Si algún día hacen falta mocks o cobertura, ahí se discute vitest.

### El invariante del camino del dinero, convertido en algo que frena el merge
- **Problema encontrado:** que `crear-orden` ignore el precio del browser era, desde el 18-ago, una convención escrita en un comentario. Nada impedía que alguien la revirtiera.
- **Solución adoptada:** `tests/invariante-precio-servidor.test.ts` verifica la **forma** del contrato sobre el código fuente: que ninguna interfaz del body de `crear-orden` declare un campo de precio, que el precio salga de `productos!inner(precio_centavos)`, que los items sin precio corten con 409, que el webhook de NAVE valide `X-API-KEY` con `safeEqualStr`, que los 5 endpoints de backoffice de OCA sigan detrás de `requireAdmin`, que `requireAdmin` siga siendo fail-closed y que ningún archivo de `public/js/` mencione un secreto de servidor. **Deliberadamente no ejercita los handlers**: eso pediría credenciales dentro del CI, que es justo lo que no puede pasar. El chequeo de comportamiento sigue siendo el E2E manual; esto cubre exactamente donde estuvo el agujero.
- **Archivo modificado:** `tests/invariante-precio-servidor.test.ts` (nuevo).
- **Pendiente:** ninguno.

### 🔴 El verificador de catálogo encontró que las 4 piezas 1/1 no se pueden comprar
- **Problema encontrado:** `scripts/verificar-catalogo.mjs`, en su primera corrida contra Supabase, tiró 12 errores. Las cuatro INTERVENCIONES existen en `variantes_producto` **sólo en talle M** (`JEA-1/1-SUR-M`, `JEA-1/1-ENC-M`, `JEA-1/1-WAX-M`, `BER-1/1-CAM-M`, stock 1 cada una), pero la PDP hardcodea cuatro botones de talle para todo producto con **S activo por defecto** (`start.js:1404-1407`) y el carrito arma el SKU como `${product.sku}-${size}` (`start.js:798-800`). O sea: quien entre a una pieza 1/1 y apriete AÑADIR sin tocar el talle manda `JEA-1/1-SUR-S`, que no existe, y `crear-orden` corta con 409. **Son $580.000 de inventario invendibles por el camino por defecto**, y nada en pantalla avisa que M es el único talle. Confirma como bloqueante el pendiente que estaba anotado como cosmético.
- **Solución adoptada:** **ninguna todavía** — el arreglo toca `start.js`, que `CLAUDE.md` pide no reestructurar sin discutirlo, y es visible en pantalla. Quedan planteadas dos opciones (que la PDP lea los talles reales del catálogo, o el mínimo acotado a INTERVENCIONES) y descartada una tercera: crear las variantes XS/S/L con stock 0 cambiaría un 409 honesto por una sobreventa silenciosa, porque `crear-orden` todavía no valida stock.
- **Archivo modificado:** ninguno del front. `scripts/verificar-catalogo.mjs` y `scripts/catalogo-front.mjs` (nuevos).
- **Pendiente:** **decidir el arreglo antes del E2E.** Buena noticia de la misma corrida: los precios del front y de la base **coinciden al centavo** en los 23 productos, y no hay una sola imagen rota.

### `/api/health` dejó de mentir
- **Problema encontrado:** el endpoint devolvía `{status:'ok'}` incondicionalmente. Se confirmó sirviendo un build con las credenciales de Supabase apuntando a un placeholder: respondía **200 "ok"** igual. Un healthcheck que no puede fallar es peor que ninguno, porque se le cree.
- **Solución adoptada:** readiness check real — hace una lectura barata contra `productos` (la misma tabla de la que `crear-orden` saca el precio autoritativo: si no responde, no se puede cobrar) y chequea 9 env vars críticas más 3 recomendadas. Devuelve **503** si algo crítico falta, para que un monitor externo lo levante sin parsear el body. Dos respuestas según quién pregunta: la **pública** es `{status, timestamp}` y nada más (enumerar la configuración faltante de un e-commerce es regalar el mapa); la **admin**, detrás del mismo `x-admin-token` de los endpoints de OCA, trae el detalle completo — qué chequeo falló, qué env vars faltan, `NAVE_ENVIRONMENT` activo y el commit del deploy. Los secretos nunca se devuelven, sólo booleanos. Verificado end-to-end sobre un build servido: público `{status:'degraded'}` 503, admin con el detalle y `NAVE_WEBHOOK_API_KEY` correctamente reportada como faltante, token incorrecto → respuesta pública sin filtrar nada.
- **Archivo modificado:** `src/app/api/health/route.ts`.
- **Pendiente:** setear `ADMIN_API_TOKEN` en Vercel para poder ver el detalle en producción (ya estaba en la lista de env vars pendientes). Sin ella el endpoint funciona igual, siempre en modo público.

### Migración 21 — pgvector, escrita y sin correr
- **Problema encontrado:** la FASE 2 necesita infraestructura vectorial, pero nada de lo que se monte ahora puede arriesgar el lanzamiento.
- **Solución adoptada:** `21_pgvector_documentos_chunks.sql` crea la extensión, la tabla `documentos_chunks` con metadata de citation (`url_publica`, `seccion`, `sku`), índice HNSW coseno, RLS **habilitada y sin políticas** (coherente con la 17: sólo entra `service_role`, lo que obliga a que la superficie del asistente sea un solo endpoint auditable) y el RPC `match_documentos` con los permisos revocados a `anon`/`authenticated`. La tabla **no guarda precios ni stock** a propósito: ese es el guardrail central, esos datos salen siempre de una consulta determinista contra `productos`/`variantes_producto`, nunca del texto recuperado. Impacto en la tienda: ninguno, no la lee nadie.
- **Archivo modificado:** `backend/sql/21_pgvector_documentos_chunks.sql` (nuevo, **sin correr**).
- **Pendiente:** elegir proveedor de embeddings **antes** de correrla — la dimensión está en `vector(1536)` (OpenAI `text-embedding-3-small` / Cohere multilingual v3) y cambiarla después obliga a reembeber todo.

### Diagnóstico del Plan FASE 2 contra el repo real
- **Problema encontrado:** el `Plan FASE 2 — RAG en GÜIDO` de la bóveda `naza` se escribió leyendo el repo desde afuera, y varias de sus afirmaciones había que verificarlas.
- **Solución adoptada:** informe en `docs/internal/FASE2_RAG_DIAGNOSTICO.md` con la tabla afirmación→¿es cierta?→evidencia. Tres correcciones al plan: (a) los precios **no** están desincronizados, coinciden al centavo; (b) los T&C y la política de cambios **ya existen**, pero embebidos en `src/app/page.tsx`, que es exactamente el escenario que el plan quería evitar — hay que extraerlos, no escribirlos; (c) `src/lib/security.ts` existe pero tiene una sola función, **no hay rate limiting de ningún tipo** en ningún endpoint público, y ese agujero ya existe hoy sin asistente (`/api/oca/cotizar` es el más expuesto: sin auth, sin límite, y cada llamada golpea la API de OCA).
- **Archivo modificado:** `docs/internal/FASE2_RAG_DIAGNOSTICO.md` (nuevo).
- **Pendiente:** rate limiting queda para después del go-live salvo que Naza lo priorice — meter middleware en el camino del dinero la noche anterior al E2E cambia lo que el E2E está por validar.


### Fotos de producción: los 21 productos con material real
- **Problema encontrado:** llegó el material del shoot del 11/8 y no había convención para mapear archivos sueltos a los 21 productos del catálogo de `start.js`, ni forma de que Naza eligiera a mano qué foto va en cada uno.
- **Solución adoptada:** tabla prefijo→producto (`REMERA_LOGO_ROJO_1.jpg`, …), con el número como orden de la PDP y dos posiciones de rol fijo: `_1` portada del Shop, `_2` hover de la card. Se crearon las 21 subcarpetas de entrada más `_HOME`, `_ARCHIVO` y `_DESCARTES`, para poder arrastrar en vez de tipear. Las 96 fotos se convirtieron a WebP de 1800px, calidad 82 (de 5-7MB a entre 51 y 446KB) y se conectaron a los 21 `images: []`. Verificado en browser: 96 rutas declaradas, cero rotas, cero PNG en el catálogo.
- **Archivo modificado:** `public/js/start.js`, `scripts/procesar-fotos.mjs` (nuevo), `docs/internal/FOTOS_PRODUCTO_NOMBRES.md` (nuevo), `.gitignore`, 96 WebP en `public/assets/images/products/`.
- **Pendiente:** commitear · descripciones de remeras, musculosas y bermudas · material de Fini para el home y el Archivo.

### La galería de la PDP pasó a 4:5 (y dejó de ser sticky)
- **Problema encontrado:** los originales vienen en 4000×6000 (2:3) y la galería de la PDP era `height: calc(100vh - header)` sobre un ancho del 52.27%, o sea una caja **casi cuadrada** (0.92 en 1440×900, 1.00 en 1920×1080). Con `object-fit: cover` eso le comía entre 27% y 34% del alto a cada foto: en las de cuerpo entero se iban la cabeza y las botas. Se simuló el recorte con `sharp` sobre las fotos reales para confirmarlo. **No había posición de recorte que las salvara:** el modelo ocupa ~74% del cuadro y sólo entraba el 66%.
- **Solución adoptada:** `aspect-ratio: 4/5`, que baja el recorte a 16.7%. **Primer intento fallido:** se topeó el ancho con `min(52.27%, (100vh − header) × 0.8)` para que la caja entrara en el viewport y el sticky tuviera dónde pegarse, pero ese tope ata el ancho a la *altura* de la ventana y en una de 724px la galería colapsó al 33.1% del ancho, con 548px de vacío a la derecha. **Segunda vuelta:** ancho de vuelta al 52.27% fijo y fuera el sticky — un sticky más alto que el viewport se clava arriba y su pie no se ve nunca, que era justo el problema original. Ahora la galería scrollea con la página. Medido contra el SVG en su canvas de 1425×900: galería 737 (spec 744.8), info en 750 (spec 757.8), ancho 482 (spec 482.2), margen derecho 178 (spec 185) — la diferencia es el ancho de la barra de scroll. Mobile sin cambios (0.625).
- **Archivo modificado:** `src/app/globals.css` (`.pdp-gallery` y `--pdp-gallery-w`).
- **Pendiente:** ninguno. El compromiso aceptado es que la foto entra al scrollear: con 52.27% de ancho y ratio 4:5 no hay pantalla real donde entre entera arriba del pliegue.

### Migración 18 y el 404 preexistente de la Baby Tee
- **Problema encontrado:** al ir a borrar los 45 PNG huérfanos apareció que `productos.imagenes` de Supabase todavía apunta a ellos, y esa columna la leen las miniaturas de las órdenes (`GET /api/ordenes/[id]` de la confirmación post-pago y `GET /api/cliente/ordenes` de "Mis Pedidos"). Borrarlos antes rompería esas miniaturas. Consultando la base apareció además que la Baby Tee apunta a `remera-babytee-blanca-front.png` y `-back.png`, que **no existen en disco** — el archivo real se llama `remera-bbytee-blanca-front.png` y el `-back` nunca existió, así que esa miniatura viene dando 404 desde antes de esta sesión.
- **Solución adoptada:** `backend/sql/18_fotos_produccion_webp.sql`, que apunta las 14 filas de `productos` a los WebP nuevos y arregla de paso el path roto de la Baby Tee. Lleva un bloque de verificación que falla si queda algún `.png` o alguna fila sin exactamente 2 imágenes. **No se corrió:** va después del deploy, igual que las migraciones 16 y 17. Los 45 PNG viejos se dejaron en su lugar a propósito.
- **Archivo modificado:** `backend/sql/18_fotos_produccion_webp.sql` (nuevo, sin ejecutar).
- **Pendiente:** correr la 18 después de deployar, y recién ahí borrar los 45 PNG en un commit aparte.

### Video de denim, gráficas de campaña y el home separado en desktop/mobile
- **Problema encontrado:** la sección SELVEDGE tenía fondo marrón plano, el hero un video rojo viejo, y no había bloque de gráficas. Además el material del shoot vino en dos relaciones de aspecto, así que lo que sirve en desktop no sirve en mobile.
- **Solución adoptada:** `selvedge-loop.mp4` (6 cortes del master concatenados, 26.0s, sin audio) de fondo en Selvedge, con el marrón abajo como fallback. Bloque de gráficas nuevo entre el video y el footer, rotando cada 5s con crossfade: el stage adopta la relación de aspecto de la gráfica activa, así ocupan el ancho completo sin recorte ni franjas. Y el home entero separado por el breakpoint de 768px — hero, video y shuffle distintos en cada plataforma. El `<video>` va sin `src` en el HTML a propósito: con dos `<source>` el navegador se baja el que no corresponde.
- **Archivo modificado:** `src/app/page.tsx`, `src/app/globals.css`, `public/js/start.js`, `public/assets/video/`, `public/assets/images/graficas/`.
- **Pendiente:** el material de Fini para `_HOME` y el fashion film que reemplaza a la gráfica del hero.

### Dos bugs propios encontrados y corregidos en el camino
- **Problema encontrado:** (1) el texto y los botones de SELVEDGE quedaron tapados al meter el video. (2) En mobile aparecía el material de desktop.
- **Solución adoptada:** (1) la culpa era una regla que agregué, `.selvedge-block { position: relative }`, que le pisaba el `position: absolute; top: 100px` original: el bloque caía al pie de la sección y ahí el `overflow: hidden` —también mío— lo recortaba. Nunca hizo falta: `.section-content-block` ya trae `z-index: 60`. (2) `matchMedia` se leía **una sola vez al cargar**, así que cruzar el breakpoint después dejaba montado el material de la otra plataforma; ahora se re-evalúa y reconstruye, colgado de `change`, `resize` y `orientationchange`.
- **Archivo modificado:** `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** ninguno.

### Página Archivo con las 95 fotos reales
- **Problema encontrado:** el Archivo seguía con placeholders numerados desde el 2026-07-10.
- **Solución adoptada:** las 95 fotos de `_ARCHIVO` a WebP de 1400px (7.9MB en total, contra 553MB de originales), repartidas por orientación como pide la estructura del dato: 93 verticales a LOOKS (tiles 4:5) y 2 apaisadas a DETALLES (5:4), en el orden numérico de los `IMG_XXXX`. El grid de la landing toma las 5 primeras. `grafica-17` quedó de fondo del hero de la colección, y el film completo (`ss26-film.mp4`, 75s con audio) reemplazó al placeholder de ffmpeg.
- **Archivo modificado:** `public/js/archive-data.js`, `public/assets/images/archive/ss26/`, `public/assets/video/ss26-film.mp4`.
- **Pendiente:** DETALLES quedó con sólo 2 fotos, que son las únicas apaisadas del set.

### Producto nuevo: REMERA LOGO GÜIDO STRASS
- **Problema encontrado:** Naza pidió sumar la variante con strass a último momento, sin stock propio porque la hace a pedido.
- **Solución adoptada:** producto nuevo a $65.000 con dos colorways sobre tela negra (LOGO ROJO y LOGO BLANCO), 5 fotos cada uno. El stock sale de la remera logo común: 4 unidades de cada talle de las dos variantes negras, 16 por colorway. Migración 19 **ejecutada y verificada** en Supabase. Falló en el primer intento porque `variantes_producto.color` es NOT NULL y no estaba en el INSERT; el conector envuelve todo en una transacción, así que revirtió limpio. Dos campos opcionales nuevos en el catálogo: `swatch` (para que el chip muestre el color del logo y no el de la tela, que es negra en las dos) y `colorLabel` (etiqueta de la PDP).
- **Archivo modificado:** `public/js/start.js`, `backend/sql/19_remera_logo_strass.sql`, 10 WebP nuevos.
- **Pendiente:** ⚠️ **XS y L de la remera logo negra quedaron en CERO** en los dos colorways — es la aritmética de restar 4 donde había exactamente 4. Devolverles unidades es un UPDATE.

### Botones y tabla de talles a Helvetica Neue Condensed
- **Problema encontrado:** los botones usaban Helvetica Roman, y en mobile venían con el fondo blanco forzado y `!important`, así que la animación de fill era invisible y la tipografía no coincidía con el resto de la página. La tabla de talles mezclaba dos caras.
- **Solución adoptada:** `.btn-rect` a Condensed bold con el marco en `currentColor`, idéntico en desktop y mobile, con el fill corriendo en hover y en tap. Tabla de talles entera en Condensed mayúscula y **sin el selector CM/IN**: todo en centímetros. Como el selector era lo único que decía "CM" en pantalla, las tres descripciones que no aclaraban la unidad ahora la dicen.
- **Archivo modificado:** `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** ⚠️ **detalle que se come a cualquiera:** la cara Condensed está en `@font-face` con `font-weight: bold`, y un `<a>` pesa 400 — declarar sólo `font-family` hace que el navegador caiga al sans-serif del sistema **sin avisar**. Hay que poner el peso también.

### Deploy: 13 commits pusheados
- **Problema encontrado:** producción corría `397e98a`, de 2 días atrás, sin las fotos ni los fixes de seguridad del camino de dinero. Eran ~7 sesiones sin commitear.
- **Solución adoptada:** todo commiteado en 13 commits temáticos (`6d93def` → `4ae7ec2`) y pusheado a `main`. Typecheck limpio.
- **Archivo modificado:** todo el repo.
- **Pendiente:** ⚠️ correr las migraciones **16 → 17 → 18** apenas el deploy quede READY. La 18 es urgente: los 45 PNG viejos ya no están en el repo y `productos.imagenes` todavía apunta a ellos, así que las miniaturas de las órdenes dan 404 hasta que corra.

## 2026-08-19

### ⚠️ NAVE quedó en modo producción sobre el código viejo — revertir a sandbox
- **Problema encontrado:** NAVE (ticket SI-168) confirmó el alta del webhook productivo y que envían el header `X-API-KEY`. Naza cargó las env vars productivas en Vercel (incluido `NAVE_ENVIRONMENT=production`) y redeployó, **pero el redeploy tomó `main` = `397e98a` (código viejo, sin los fixes de seguridad de la sesión anterior, que siguen sin commitear).** Verificado: `GET /api/webhooks/nave` → `"environment":"production"` y el último deploy es `397e98a`. Resultado: código vulnerable en modo producción, con el `/shop` alcanzable.
- **Solución adoptada:** se recomendó **revertir `NAVE_ENVIRONMENT` a `sandbox`** hasta el go-live real, dejando el pasaje a producción como último paso (después de fotos + E2E + deploy de los fixes + migraciones). Las credenciales productivas y la `X-API-KEY` quedan guardadas para ese momento.
- **Archivo modificado:** ninguno (verificación + registro). Los fixes de seguridad siguen sin commitear.
- **Pendiente:** Naza revierte la env var. Go-live sin cambios de secuencia respecto de lo registrado el 2026-08-18.

## 2026-08-18

### Revisión de seguridad pre-producción de NAVE (workflow multiagente) + fixes del camino de dinero
- **Problema encontrado:** al arrancar el paso a producción de NAVE (llegaron las credenciales productivas, ticket SI-168), un workflow de revisión de 4 dimensiones (NAVE, checkout-datos, OCA-postpago, seguridad; 4 revisores + verificación adversarial, 62 hallazgos, los 8 verificados dieron reales) encontró que el circuito de compra **no estaba listo para cobrar plata real**. Bloqueantes críticos: (1) `crear-pago` confiaba en `total_ars` del browser → se podía pagar $1 una orden de $240.000; (2) el webhook NAVE no validaba origen ni cruzaba pago↔orden → replay de un `payment_id` ajeno aprobado contra órdenes caras; (3) RLS `USING(true)` en ordenes/clientes/direcciones → marcar una orden `pagado` sin pagar y leer el padrón de clientes (PII); (4) los endpoints OCA (`crear-envio`, `anular`, `etiqueta`, `tracking`) estaban públicos sin auth; (5) credencial **productiva** de OCA (usuario+clave) commiteada y pusheada a GitHub en `.claude/settings.local.json`.
- **Decisión:** NO flipear las env vars todavía. Se cerró primero la filtración y los bloqueantes del camino de dinero (Tier 0 + A/B/C/D). El switch a producción y el resto de hallazgos quedan para sesiones siguientes, con E2E previo.
- **Solución adoptada (sin commitear, pendiente de E2E de Naza):**
  - **Tier 0 (filtración):** `.claude/settings.local.json` sacado del tracking (`git rm --cached`) + agregado al `.gitignore`; credenciales de OCA/NAVE scrubeadas del working file y de `docs/internal/**` + `docs/NAVE_CHECKOUT_API_DOCS.md` (placeholders). La **rotación de la clave OCA en ePak la hace Naza**.
  - **A — monto autoritativo:** `crear-pago` ignora `total_ars`/`cart_items` del body y recalcula el total server-side desde `items_orden` → `productos.precio_centavos` + `costo_envio_centavos`. Rechaza 409 si la orden no está en `envio_calculado`/`pago_pendiente` o si un item no tiene precio resoluble (esto incluye las piezas 1/1 con el bug de talle, que ahora fallan visible en vez de cobrarse mal). Sacó `public_key` (POS ID) de la respuesta y genericizó el error. Valida el origen de la `success_url`.
  - **C — creación de orden server-side + RLS:** nueva route `POST /api/checkout/crear-orden` (service_role) que hace el upsert de cliente/dirección y crea la orden e items con **precios del catálogo**; `checkout-logic.js` reescrito para llamarla en vez de insertar con la anon key. Migración `17_rls_lockdown_checkout.sql` que dropea las políticas `USING(true)` de INSERT/UPDATE/SELECT y deja sólo lectura autenticada por `auth.email()`.
  - **B — webhook NAVE:** valida `X-API-KEY` (`NAVE_WEBHOOK_API_KEY`, enforce-when-set, `timingSafeEqual` sobre sha256 en `src/lib/security.ts`); cruce pago↔orden (rechaza si la orden tiene otro `nave_payment_id` o si el `payment_id` ya está en otra orden); guarda para no degradar a `cancelado` una orden ya avanzada; reconciliación de monto log-only. Migración `16_nave_payment_id_unico.sql` (índice único parcial sobre `nave_payment_id`).
  - **D — auth OCA backoffice:** `src/lib/admin-auth.ts` con `requireAdmin` (header `x-admin-token` vs `ADMIN_API_TOKEN`, fail-closed) aplicado a `crear-envio`/`anular`/`etiqueta`/`tracking`/`centros-costo`; `crear-envio` además exige orden paga. `cotizar` y `sucursales` quedan públicas (las usa el storefront).
  - **PATCH ordenes:** guarda de estado (`.in('estado', ['pendiente','envio_calculado','pago_pendiente'])`) para que apretar "Atrás" desde el pago no degrade una orden ya `pagado` y habilite un segundo cobro.
- **Archivo modificado:** `src/app/api/nave/crear-pago/route.ts`, `src/app/api/webhooks/nave/route.ts`, `src/app/api/checkout/crear-orden/route.ts` (nuevo), `src/app/api/ordenes/[id]/route.ts`, `src/app/api/oca/{crear-envio,anular,etiqueta,tracking,centros-costo}/route.ts`, `src/lib/security.ts` (nuevo), `src/lib/admin-auth.ts` (nuevo), `public/js/checkout-logic.js`, `backend/sql/16_*.sql` + `17_*.sql` (nuevos), `.gitignore`, `.claude/settings.local.json`, `docs/internal/**`, `docs/NAVE_CHECKOUT_API_DOCS.md`. Typecheck + `next build` limpios.
- **Pendiente:** **E2E de Naza antes de pushear** (Supabase MCP dio timeout toda la sesión, no se pudo probar contra la base). Correr las migraciones 16 y 17 **después** de deployar el código (17 rompe el checkout viejo si se corre antes). Setear `NAVE_WEBHOOK_API_KEY` + `ADMIN_API_TOKEN` en Vercel. Verificar que cada categoría de producto resuelva su SKU en Supabase (si hay mismatch start.js↔DB, `crear-orden` da 409). Rotar la clave OCA. Resto de hallazgos (Tier 1 E–J + el switch a producción) en sesiones siguientes.

---

## 2026-08-13

### Página ARCHIVO reescrita: landing con fashion film, menú drawer y colección SS26
- **Problema encontrado:** la `/archivo` del 2026-07-10 (índice de tiras contact-sheet + detalle con scroll vertical→horizontal) nunca tuvo fotos reales y no era lo que Naza quería. Trajo un MP4 de 55s de referencia, cuatro SVG de spec y la indicación de replicar la experiencia de rafsimons.com.
- **Solución adoptada:** se reemplazó entera, con tres pantallas. **Landing:** sin header ni marquee, el fashion film arranca cubriendo el viewport, se queda 2.5s y decrece radialmente hasta su caja de 40.51% del ancho con ratio 1.868 (cinema flat), revelando un grid disperso de 5 fotos blurreadas; el wordmark va centrado a 69.06vw. Las posiciones se midieron de `archivo_grid.svg` (canvas 1920×868.7) y se verificaron al decimal contra el DOM. **Menú:** drawer que sube con reveal enmascarado por línea y stagger; el hover *apaga* el ítem apuntado a gris, que es lo que hace la referencia (verificado frame a frame). **Colección SS26** en `/archivo/colecciones/ss26`: hero full-viewport, barra sticky `SS26 · LOOKS · DETALLES · FILM`, grilla de 3 columnas (2 en mobile) y film de cierre. Se conservaron los nombres de las funciones de ruteo y el contrato de historial (`{state:'archive', archiveSlug}`) para no tocar la navegación existente.
- **Archivo modificado:** `public/js/start.js`, `public/js/archive-data.js`, `src/app/page.tsx`, `src/app/globals.css`, `next.config.ts`.
- **Pendiente:** commitear (no hay nada commiteado). Falta el material de Fini: hoy el film es un placeholder generado con ffmpeg y las fotos son placeholders numerados. La página SOBRE no existe.

### Ingeniería inversa del scroll de la referencia
- **Problema encontrado:** rafsimons.com tiene un ritmo de scroll particular que Naza quería replicar, sin saber cómo estaba hecho.
- **Solución adoptada:** un subagente lo desarmó en vivo. Es **Locomotive Scroll v4** con `lerp: 0.05` y `multiplier: 0.5`, ambos la mitad del default: 60px de recorrido por click de rueda en Windows (24px en Mac, por `mouseMultiplier` 0.4) y una cola de ~1.5s. Se replicaron esos números exactos y se verificó que la curva coincide con la medida en el sitio real (frame 5: 22.6%, frame 10: 40.1%, frame 20: 64.2%). **Diferencia deliberada de implementación:** Locomotive transforma el contenido y rompe el scroll nativo — se pierde Ctrl+F, `position:sticky`, el teclado, y la propia página de Raf se degrada a scroll nativo en celular por un bug de su config (pasan la clave `mobile` cuando la librería lee `smartphone`). Acá el lerp maneja el `scrollTop` del contenedor, así el ritmo es el mismo sin romper nada. En touch se desactiva solo y queda la inercia nativa.
- **Archivo modificado:** `public/js/start.js`.
- **Pendiente:** ninguno.

### Ajustes de la segunda vuelta y bugs encontrados en el camino
- **Problema encontrado:** al revisar, Naza pidió sacar la marquee, alargar el hold del film, sumar el hover que mueve los contenedores y recalibrar seis cuerpos tipográficos. En el proceso aparecieron tres bugs.
- **Solución adoptada:** (1) La escala del film la escribía el JS como **estilo inline**, que le gana a cualquier regla CSS — el `:hover` nunca habría podido tocarla. Se cambió para que el JS **suelte** la variable en vez de escribirle "1". (2) El poster del film usaba path relativo y en `/archivo/colecciones/ss26` resolvía contra `/archivo/colecciones/` dando 404; todos los paths del Archivo pasan ahora por el helper `absUrl` que ya existía. (3) Abrir el menú desde adentro de la colección y elegir SHOP cargaba el destino pero dejaba el overlay de la colección encima tapándolo (`position:fixed`, `z-index:8000`); `archiveMenuNavigate` ahora lo cierra antes de navegar. Además se sumó un **parallax de mouse al 2.4%** que estaba en la referencia y Naza no había mencionado, medido comparando frames con el cursor en posiciones distintas: se mueven las imágenes y el film, no el wordmark.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`, `src/app/page.tsx`.
- **Pendiente:** ninguno. Las animaciones no pudieron verse correr (el preview headless no compone frames): se validaron por medición del DOM, reglas CSS y números.

### NAVE: producción estaba corriendo en sandbox
- **Problema encontrado:** Naza pidió revisar el estado del paso a producción. `GET https://güidocapuzzi.com/api/webhooks/nave` devolvía `"environment":"sandbox"`: el sitio en producción estaba operando con credenciales de sandbox. Barriendo el vault entero, **no hay ningún registro de haber pedido ni recibido credenciales productivas** — lo único documentado son las de sandbox y tres intercambios técnicos con soporte (la `notification_url` mal configurada, `payment_request_id` ≠ `payment_id`, y el error de `status.name`). O sea: el alta de producción no estaba pendiente de aviso, estaba pendiente de hacerse.
- **Solución adoptada:** se redactó el mail de alta productiva para Rances (soporte de NAVE), hilo nuevo con asunto "Integración Nave | Producción | Capmat Studios", con 8 pedidos concretos: credenciales productivas, confirmación de endpoints y `audience`, alta de la URL del webhook de producción (en punycode, por la diéresis del dominio), tratamiento de la `success_url`, validación del origen de las notificaciones, requisitos comerciales, operativa de acreditación y comisiones, y cómo hacer una primera transacción real controlada. Naza lo mandó y **ya recibió la respuesta punto a punto más las credenciales de producción.**
- **Archivo modificado:** ninguno (auditoría + redacción).
- **Pendiente:** aplicar el cambio — 4 env vars en Vercel con scope Production (`NAVE_ENVIRONMENT`, `NAVE_CLIENT_ID`, `NAVE_CLIENT_SECRET`, `NAVE_POS_ID`), redeploy, y verificar que el webhook devuelva `"environment":"production"`. Como deuda técnica no bloqueante: el webhook actualiza la orden que viene identificada en la notificación pero no cruza que el pago verificado corresponda efectivamente a esa orden.

### Correcciones al registro verificadas contra las fuentes
- **Problema encontrado:** el Plan Activo daba por pendientes dos cosas que ya estaban hechas, y arrastraba una alerta vencida.
- **Solución adoptada:** la **migración 15 ya estaba corrida** — se verificó por MCP de Supabase que los 14 productos tienen los nombres nuevos, que existen `JEAN ENCERADO` y `BERMUDA CAMO "WOODLAND"` y que la Baby Tee Navy ya no está. Hay stock cargado (≈518 unidades en 72 variantes, las 4 piezas 1/1 en 1 c/u), pero son los valores viejos: el conteo real de producción (587 u) sigue sin desglosarse por colorway × talle. Y la **producción fotográfica ya se hizo el 11/8**, así que la alerta del presupuesto venciendo el 14/8 quedó sin efecto. También se detectó que `NAVE_CALLBACK_URL`, documentada en API Keys y credenciales, no la lee ningún archivo del código.
- **Archivo modificado:** vault `Ejecución/Plan Activo.md`.
- **Pendiente:** el desglose de stock por colorway × talle sigue abierto.

## 2026-08-10

### El CDN de Supabase era un punto único de falla del checkout
- **Problema encontrado:** `supabase-config.js:25` hacía `const { createClient } = supabase`, donde `supabase` era la global que inyectaba el `<script>` de `cdn.jsdelivr.net`. Si ese script no cargaba —CDN caído o lento, red corporativa que lo bloquea, un adblocker, el `ERR_CACHE_WRITE_FAILURE` que ya se había visto una vez en desarrollo— saltaba un `ReferenceError` sin capturar, `window.supabaseClient` nunca se creaba y el checkout entero moría en silencio: sin órdenes, sin cotización de envío, sin pago y sin un solo mensaje para el cliente. Con las pruebas E2E arrancando, era el peor lugar posible para tener una dependencia de terceros.
- **Solución adoptada:** tres capas. (1) La inicialización quedó detrás de un guard: si la librería no está, expone `window.supabaseUnavailable` y loguea la causa probable en vez de tirar. (2) `procesarCheckoutStep1()` aborta en un PASO 0 con mensaje al usuario, y `avisarCheckoutSinConexion()` lo muestra ya al entrar al checkout para no hacerle completar todo el formulario al pedo — reutilizando el `#checkout-error-msg` que ya existía, sin tocar CSS. (3) `scripts/vendor-supabase.mjs` copia el build UMD del paquete npm a `public/vendor/` y `predev`/`prebuild` lo corren solos, así la librería se sirve desde nuestro propio dominio. El UMD del paquete expone la misma global que el del CDN (`var supabase = ...`), así que el reemplazo fue drop-in: cambió sólo el `src` del `<script>`. Pesa 160KB en disco, 42KB transferidos. De paso la versión la fija `package.json` — el tag pedía `@2` sin pinear, o sea que jsdelivr podía servirle cualquier 2.x nuevo a producción sin revisión.
- **Archivo modificado:** `public/js/supabase-config.js`, `public/js/checkout-logic.js`, `public/js/start.js`, `src/app/page.tsx`, `scripts/vendor-supabase.mjs` (nuevo), `package.json`. Commit `208e47c`.
- **Pendiente:** ninguno de este fix. Queda `qrcodejs` de cdnjs como último CDN de terceros, aunque hoy no está en uso (NAVE redirige en vez de embeber el QR).

### Guards en los handlers de auth y contacto
- **Problema encontrado:** los mismos usos sin protección de `window.supabaseClient` estaban en login, crear cuenta, recuperar contraseña, nueva contraseña, contacto y logout. Al revisarlos resultó que no eran todos "mudos": los cuatro de auth ya tenían `try/catch` y terminaban mostrando "ERROR DE CONEXIÓN", pero el mensaje miente (no falló la red contra Supabase, nunca llegó la librería) y aparecía recién después de correr toda la barra de carga. Los que sí fallaban mudos eran el **logout**, sin `try/catch`, donde el `TypeError` cortaba el handler entero y el botón no hacía literalmente nada ni la limpieza local; y el **formulario de contacto**, cuyo `catch` reseteaba el botón sin mostrar nada.
- **Solución adoptada:** guard único `supabaseListoParaAuth(container)` aplicado a los 5 formularios, que corta antes de la barra de carga y da un mensaje preciso ("no pudimos cargar el sistema, recargá la página o desactivá el bloqueador"). El logout ahora hace la limpieza local aunque no haya cliente, y `_getAccessToken()` devuelve `null` en vez de tirar.
- **Archivo modificado:** `public/js/start.js`. Commit `208e47c`.
- **Pendiente:** ninguno.

### Catálogo: renombre de intervenciones, 2 piezas nuevas y baja de la Baby Tee Navy
- **Problema encontrado:** los dos jeans 1/1 se llamaban "JEAN INTERVENIDO ..."; había que sacar esa palabra, sumar dos piezas nuevas (Jean Encerado y Bermuda Camo "Woodland") y quitar la Baby Tee Navy, que no entró en producción.
- **Solución adoptada:** en `start.js`, suela roja → `JEAN PINTOR "WILDCAT"` y encerado → `JEAN PINTOR "FAJA"`; alta de `jean-encerado` (parafina + cera de abejas, con bloque CUIDADO propio) y `bermuda-camo-woodland` ($130.000). Se sacó `INTERVENCIONES` de `RESTRICTED_CATEGORIES`, así que las 4 PDPs quedaron publicadas. Los renames tocaron `title` y `name` en el front, pero **Supabase busca el producto por `nombre` exacto**, así que el lookup de stock queda roto hasta correr la migración.
- **Archivo modificado:** `public/js/start.js`, `backend/sql/15_catalogo_intervenciones_ago2026.sql` (nuevo).
- **Pendiente:** ejecutar la migración 15. El checkout busca `variante_id` por `colorway` + `talle` y las 4 intervenciones comparten `1/1` — pasar el lookup a SKU antes de testear una compra.

### Tabla de talles: de pop-up centrado a drawer derecho con fondo blurreado
- **Problema encontrado:** el size chart aparecía centrado con un reveal de cortina; Naza pidió replicar el de Helmut Lang, que sale de la derecha como el carrito y blurrea el fondo.
- **Solución adoptada:** se midió la PDP de HL en vivo. El backdrop no es un scrim oscuro: es `rgba(245,245,245,.1)` + `backdrop-filter: blur(6px)`, con el panel de 400px pegado a la derecha a 100vh y scroll propio. Se replicó con ancho 450px y la curva de `#cart-drawer`. El overlay se mueve al `<body>` porque el contenedor de la PDP tiene `transform` y eso rompe el `position:fixed` interno.
- **Archivo modificado:** `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** ninguno.

### PDP 2026: galería en carrusel horizontal sticky + columna de info a la izquierda
- **Problema encontrado:** había que replicar `frontend_nuevo/pdp_nuevo_1-3.svg` + los 4 mobile, y no estaba claro si la galería era un stack vertical con miniaturas (lo que había) o un carrusel.
- **Solución adoptada:** se parseó el XML de los SVG normalizando de mm a px. Los paths de las flechas (`path26`/`path26-5`) confirmaron el carrusel. Galería full-bleed 52.27% **sticky** bajo el header con flechas ‹ ›, contador N/M, teclado y swipe; columna de info de 482px alineada a la izquierda; related de 5 cards a 3 full-bleed. Verificado por medición del DOM contra la spec: gap galería→info 13px, chip 42×15, cajas de talle 23 con paso 52, botón 482×39, insets de flecha 38 (desktop) y 21 (mobile).
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** el talle de las piezas 1/1 sigue hardcodeado en `'S'`. La bermuda camo usa la tabla de talles de las bermudas de denim.

### PDP: ajustes de tipografía y ritmo vertical
- **Problema encontrado:** los títulos traían `<br>` del layout viejo y rompían en lugares raros; la descripción quedaba pegada al botón AÑADIR; había 6 tamaños distintos conviviendo.
- **Solución adoptada:** se sacaron los `<br>` de los 21 títulos y la palabra "FIT" (solo del campo `title`, para no romper el lookup por `nombre`). El ritmo vertical de la columna pasó a manejarse con el `gap` del flex en vez de márgenes sueltos: botón→descripción pasó de 0 a 56px. Descripción y CUIDADO a Helvetica Neue Condensed. Se quitó el colorway de las cards de related.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** ninguno.

### Tipografía secundaria: Helvetica genérica → Helvetica Neue Roman/Bold, todo en WOFF2
- **Problema encontrado:** la secundaria seguía siendo la Helvetica genérica de Monotype en `.ttf` de ~300KB, desalineada con la 77 Bold Condensed de los títulos.
- **Solución adoptada:** conversión con `fontTools` a WOFF2 de las tres caras. 989KB → 411KB (-58%). Se conservó el nombre de familia CSS `'Helvetica'` para no reescribir ~100 declaraciones — lo que cambió es el archivo detrás.
- **Archivo modificado:** `src/app/globals.css`, `public/assets/fonts/*.woff2` (3 nuevos), `docs/BRAND_GUIDELINES.md`.
- **Pendiente:** ⚠️ **licencia de web embedding con Monotype** — los `.otf` vienen de una descarga suelta y ahora se sirven desde el dominio. Bloqueante para el lanzamiento.

### Escala tipográfica híbrida (Helmut Lang × ERD) en Cuenta, Contacto y Legales
- **Problema encontrado:** Naza pidió homogeneizar tamaños tomando parámetros de Helmut Lang sin perder el carácter ERD. Cuenta y Contacto tenían 6 tamaños distintos (44.8 · 16 · 13.5 · 13.3 · 12 · 11).
- **Solución adoptada:** se midió `helmutlang.com/login`: **76 de 76 elementos de texto están en Helvetica Neue LT Std Bold 13.5px / lh 17px** — un solo tamaño, con la jerarquía hecha por mayúsculas, peso y espacio. Se bajó GÜIDO a 3 escalones vía variables en `:root` (`--fs-page: 28px`, `--fs-section: 17px`, `--fs-body: 13.5px`) y se tomaron las métricas de formulario de HL (input y botón ambos 35px de alto, antes 38 y 51). Se conservó de ERD el título de página grande y el subrayado punteado de los inputs.
- **Archivo modificado:** `src/app/globals.css`.
- **Pendiente:** el punto 4 del híbrido (placeholder dentro del input en vez del label arriba) quedó sin aplicar — es el único con riesgo estético real.

### Inventario de producción cargado
- **Problema encontrado:** llegó el conteo final de producción (587 unidades) y había que registrarlo y cargarlo en Supabase.
- **Solución adoptada:** se cargó en Inventario con el mapeo de cada modelo al producto del catálogo: 94 unidades de línea bottom + 493 de línea punto, más las 4 piezas 1/1.
- **Archivo modificado:** vault `Operaciones/Inventario.md`.
- **Pendiente:** **no se puede cargar en Supabase todavía** — `variantes_producto` guarda stock por colorway × talle y el conteo vino agregado por modelo. Falta el desglose. Además el MCP de Supabase respondió sin permisos toda la sesión; el conector nuevo requiere reiniciar Claude Code.

## 2026-08-07

### Commit del footer + tipografía Helvetica de la sesión anterior
- **Problema encontrado:** El footer 2026 y el cambio de marca a Helvetica (sesión 2026-08-06) habían quedado implementados y verificados pero sin commitear.
- **Solución adoptada:** Dos commits: `aa03c6d` (fuentes Helvetica + footer `.site-footer`/`.sf-*` + header/marquee) y `3df7d1a` (docs + los 13 SVG de `frontend_nuevo/` versionados como spec de diseño).
- **Archivo modificado:** Ninguno nuevo — sólo commit del trabajo previo.
- **Pendiente:** Ninguno.

### Shop: grid nuevo con card por producto y selector de colorway
- **Problema encontrado:** El grid mostraba 20 cards (una por colorway) sin selector visual; había que llevarlo a 12 cards (una por producto) con los colores elegibles desde el grid mismo, según `shop_nuevo_desktop.svg` y `shop_nuevo_mobile.svg`.
- **Solución adoptada:** `groupByProduct()` agrupa el catálogo plano de `start.js` por nombre para pintar 12 cards; `buildProductCard()` agrega una fila de swatches cuando el producto tiene más de un colorway. El catálogo y el carrito no se tocaron — el agrupado es sólo de presentación. Iteración con Naza sobre el comportamiento del swatch: primera versión aplicaba el colorway con sólo pasar el mouse; versión final separa **hover = preview** (se descarta al salir del card) de **click = elección fijada** (persiste al sacar el mouse), con estado `pinned` explícito por card.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`, `src/app/page.tsx`.
- **Pendiente:** Commitear. Colores de swatch de denim (Índigo, Azul Lavado, Negro Encerado) son tentativos, ajustar con fotos reales.

### Header del Shop: sin línea divisoria ni contador, FILTROS reubicado
- **Problema encontrado:** El SVG nuevo elimina la línea divisoria y el "N Productos" que ocupaban una fila propia; FILTROS pasa a compartir fila con el título de la sección.
- **Solución adoptada:** Se sacó la fila de controles completa. `#shop` bajó su `padding-top` de 230px a `header + 71px` para que el título suba a la posición del SVG (y=151 en desktop, y=141 en mobile). El botón FILTROS pasó por dos ajustes de Naza tras verlo: en desktop volvió a la geometría vieja (padding 8px 20px, borde 2px) conservando sólo la tipografía Helvetica nueva; en mobile se escaló ×0.65 desde el tamaño del SVG (71×41 → 46×27), manteniéndolo centrado y flotante sobre la grilla.
- **Bug encontrado y resuelto:** `#shop` tiene un `transform` (de la transición entre páginas) que convierte cualquier `position:fixed` interno en relativo a la sección en vez del viewport — el botón FILTROS en mobile aparecía 1450px fuera de pantalla. Se resolvió moviendo el mismo botón (no clonándolo, para no perder el listener del click) al `<body>` en mobile y de vuelta a `.shop-title-row` en desktop, sincronizado con `matchMedia`.
- **Archivo modificado:** `src/app/page.tsx`, `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** Ninguno.

### Nombres largos de producto en mobile
- **Problema encontrado:** Títulos de 3-4 palabras (`JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR`) ocupaban 3 renglones en las cards angostas del mobile, desalineando la fila de swatches entre cards vecinas.
- **Solución adoptada:** Diccionario `SHORT_NAMES` con versiones podadas (ej. `JEAN SELVEDGE JAPONES REGULAR`, sin "DE DENIM" ni "FIT") que reemplaza al nombre completo sólo bajo 768px, vía dos `<span>` (`.pn-full`/`.pn-short`) con `display` condicional por media query.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** 5 de 12 productos siguen en 3 renglones (MUSCULOSA DOBLE SIMBOLO, las 2 BERMUDA, los 2 JEAN INTERVENIDO) — falta decidir con Naza si se podan un escalón más o se convive con la altura desigual entre cards.

## 2026-08-06

### Cambio de tipografía de marca: Univers → Helvetica (FUNDAMENTAL)
- **Problema encontrado:** Univers 67 Condensed Bold se degradaba en cuerpos chicos (≤14px): el hinting pobre del TTF cerraba las contraformas y el texto dejaba de leerse como la misma tipografía (visible comparando el copyright del footer contra los links). Helmut Lang no tiene el problema porque usa Helvetica Neue.
- **Solución adoptada:** Cambio definitivo de la tipografía de marca a **Helvetica**, aprobado por Naza tras probarla en vivo (vía `@font-face src: local()` — dato técnico: Chrome solo matchea el PostScript name `HelveticaNeueLTStd-BdCn`). Migración: `'Univers 67 Condensed'` → `'Helvetica Neue Condensed'` (65 usos) y `'Univers'` → `'Helvetica'` (110 usos); 3 caras copiadas a `public/assets/fonts/` (77 Bold Cn .otf 29KB, Regular 400 y Bold 700 .ttf ~300KB c/u); marquee y nav del header pasados a la condensada con `text-transform: uppercase`; logos SVG de marca regenerados por Naza en Helvetica (`logo-guido-registrado.svg` con ® reemplaza al SVG inline del footer en los 3 lugares). Hallazgo lateral: Univers Condensed es duplexada (57 y 67 miden idéntico, la regular usa 30% menos tinta).
- **Archivo modificado:** `src/app/globals.css`, `src/app/page.tsx`, `public/js/start.js`, `public/assets/fonts/` (3 nuevos), `public/assets/brand/`, `docs/BRAND_GUIDELINES.md` + vault `Marca/Brand Guidelines.md` y `Marca/Identidad Visual.md`.
- **Pendiente:** Commit. WOFF2 para las dos caras regular/bold (~300KB c/u hoy). Verificar licencia web de Monotype antes del lanzamiento. Univers queda en el repo como histórico.

### Footer 2026 implementado (primera fase del rediseño estético)
- **Objetivo:** Implementar el footer nuevo desde los SVG de Inkscape de `frontend_nuevo/` (`footer_nuevo_1/2/mobile.svg`) — primera fase del plan de rediseño (`docs/internal/PLAN_REDISENO_ESTETICO.md`). Única herencia del footer viejo: la animación de reveal del logo por clip-path.
- **Solución adoptada:** Markup nuevo unificado (`.site-footer` + `.sf-*`) en los 3 footers (home, shop, PDP inyectado por `start.js`): copyright arriba-izquierda, 3 columnas de nav flush a la derecha (1385), newsletter desplegable (form nombre/apellido/email/consentimiento con validación, sin proveedor conectado aún), logo gigante al pie. Mobile simplificado por decisión de Naza: solo acordeones SOPORTE/LEGALES/SOCIALES + copyright (392.5px exactos de spec). Hover de links recuperado: highlight negro que invade de izquierda a derecha con el texto invirtiendo a blanco. Ajustes post-review de Naza: links a 13.5px (= newsletter), gap entre columnas 100, paso entre links 23. Se neutralizaron 3 `!important` del CSS viejo y una regla `#account-* .shop-footer` que rompía el flex.
- **Verificación:** medición JS en preview contra la spec del SVG — desktop: copyright y=96, nav flush 1385, newsletter 210, logo 420; mobile: acordeones 207/244/281, alto 392.5 exacto. Build limpio. El reveal del logo quedó verificado solo a nivel CSS (el preview headless no compone frames) — falta verlo en browser real.
- **Archivo modificado:** `src/app/globals.css`, `src/app/page.tsx`, `public/js/start.js` (nuevo `initFooterInteractions()`, idempotente por `data-sf-init`).
- **Pendiente:** URL de Twitter (placeholder con `data-pending-url`), proveedor de email del newsletter.

### Sesión 2026-08-05 (misma conversación): spec de viewports + plan maestro + 3 commits
- **Objetivo:** Preparar el rediseño estético: dimensiones exactas para que Naza replique los viewports en Inkscape, análisis de referencias, y commit del trabajo acumulado.
- **Solución adoptada:** (1) `docs/internal/SPEC_VIEWPORTS_REDISENO.md` — medición en vivo del sitio: canvas de trabajo **1425×900** desktop (la scrollbar clásica come 15px de los 1440) y **390×844** mobile; grid del Shop, PDP, guía de talles y footer con todos los px. (2) Medición en vivo de la PDP de Helmut Lang (su layout también da 1425): galería 713×891 = 50% exacto del layout, ratio **4:5**, columna de info 345px en x=740, swatches 36×15 con estructura borde+fill. En mobile HL: galería full-bleed, texto en contenedor — regla "la imagen nunca se contiene, el texto siempre". (3) `docs/internal/PLAN_REDISENO_ESTETICO.md` — plan maestro de 6 fases con decisiones cerradas: card por producto con swatches hover borde-codificados (borde rojo = estampa roja), galería PDP horizontal con flechas y contador, ratio 4:5 para todo (con recordatorio explícito de probar el ratio de Naza si no convence), colorways como capa frontend sin migración de DB, URLs `/shop/{producto}/{colorway}` con 301s. (4) Review de los 13 SVG de `frontend_nuevo/`: canvas exactos, 4 inconsistencias detectadas y resueltas con Naza. (5) 3 commits: `58ef12a` (página Archivo + inversión header), `550a8db` (tooling Claude), `07d56d1` (docs) — artefactos de test OCA al `.gitignore` por marca "NO COMMITEAR" en su header.
- **Hallazgo crítico del advisor:** bug preexistente en `public/js/checkout-logic.js:297` — el lookup de `variante_id` filtra solo por colorway+talle sin producto, puede descontar stock del producto equivocado ("NEGRO" existe en 5 productos). Fix por SKU es la Fase 0 del plan, prerequisito de la consolidación.
- **Archivo modificado:** `docs/internal/` (2 nuevos), `.gitignore`, y los 3 commits mencionados.
- **Pendiente:** Replicar SVG del Shop y PDP (próxima sesión). Archivo/Raf Simons diferido — la referencia se re-verifica con Naza cuando llegue el momento.

## 2026-07-20

### Presupuesto de producción fotográfica registrado + plan semanal de lanzamiento
- **Objetivo:** Activar la recta final del lanzamiento: registrar el presupuesto de la productora, planificar las intervenciones de prendas y definir el packaging.
- **Solución adoptada:** Se creó `Marca/Producción Fotográfica.md` en el vault con el presupuesto completo: honorarios $400.000 (8 h × $50.000/h), locación ~$350.000, luces/equipo ~$100.000, modelos por fuera a $80.000/h c/u (5-6 h). Total fijo ~$850.000; validez 30 días desde el 15/7 (vence ~14/8). Entregables: fotos detalle por prenda, fotos de modelo por cambio, video estático por prenda, fashion film 1-2 min, video denim ≤1 min; entrega digital en máx. 20 días post-rodaje. Plan semanal 21–27/7 en Plan Activo: compras (pintura, strass, cera, gasa/barrilete) → test en retazo → intervención SUELA ROJA (salpicaduras rojas sutiles, ya no se pinta de rodilla para abajo) → pintado negro total del segundo jean → heat-set + strass → encerado + prototipo de packaging.
- **Investigación de materiales:** pintura para denim en Argentina → Eterna Pintura para Tela / acrílico + Medium Eterna (local, volumen), Angelus + 2-Soft 1:1 (premium, importada vía ML). Encerado wax denim → cera de abeja + parafina 50/50 a baño maría aplicada en caliente + fundido con pistola de calor (opciones pro de importación: Otter Wax, Barbour Thornproof). Test previo en retazo pintado obligatorio. Packaging: la tela de la referencia es gasa de algodón de trama abierta (cheesecloth/"gasa para queso") + papel barrilete blanco.
- **Archivo modificado:** Solo vault + este archivo (sesión operativa, sin código).
- **Pendiente:** Naza define: cantidad de modelos, fecha de rodaje, contenido de etiquetas del packaging (propuesta: manifiesto + ficha de prenda + care card). Compras del lunes 21.

## 2026-07-10

### Página Archivo (`/archivo`) — réplica de la sección Archive de ERD
- **Objetivo:** Crear el último eslabón de la web: una página de archivo/contenido de marca copiando la sección Archive de Enfants Riches Déprimés (la referencia original del sitio).
- **Solución adoptada:** Consulté a Fable como advisor (mecánica de scroll, arquitectura SPA, estructura de datos) antes de codear. Índice (`/archivo`): fondo `#1A1A1A`, una tira horizontal por temporada (contact-sheet), dos colecciones (Primavera/Verano 2026, Lookbook 2026). Detalle (`/archivo?archive=<slug>`): overlay full-viewport con scroll vertical→horizontal (sticky+spacer+`translateX`, ambos ejes — el horizontal de trackpad se traduce a scroll vertical), título abajo-izq + CERRAR abajo-der + "SCROLL →" con fade. Modelado como un solo "state" que no usa body-class (se detecta por visibilidad del contenedor en `getActiveSection`, para no tocar las ~10 remove-lists). Datos en `public/js/archive-data.js` (`window.ARCHIVE_DATA`), rewrite `/archivo` en `next.config.ts`. Link "Archivo" en el header al lado de Shop.
- **Archivo modificado:** `next.config.ts`, `public/js/archive-data.js` (nuevo), `public/js/start.js`, `src/app/page.tsx`, `src/app/globals.css`.
- **Pendiente:** Fotos reales (hoy placeholders 4:5 numerados on-brand). Revisión visual de Naza + commit/push (nada shippeado todavía).

### Réplica exacta de ERD (medida en su sitio) + carrusel infinito continuo
- **Problema encontrado:** Primera versión de las tiras muy alta (200px) y con gaps; el carrusel se cortaba (hueco negro cuando una copia no cubría el viewport).
- **Solución adoptada:** Medí los valores reales de ERD con chrome-devtools MCP (navegando a su sitio a 1600px): tile 102×128 (`aspect-ratio: 4/5`, `object-fit: cover`), gap 0 (contact-sheet), título 32px condensed, `padding-top` 288px, gap temporadas 64px, título→tira 16px. Verificado computed-vs-computed, coincide en las 9 métricas. Carrusel: JS duplica dinámicamente las copias necesarias (`ceil(viewport/copia)+1`) y el keyframe traslada exactamente una copia (`translateX(calc(-100% / var(--archivo-copies)))`) → flujo continuo sin corte.
- **Archivo modificado:** `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** Ninguno; afinar mobile del detalle en dispositivo real.

### Rename Shop `ARCHIVO → INTERVENCIONES`
- **Objetivo:** Evitar la colisión de nombre entre la categoría del Shop (piezas 1/1) y la nueva página Archivo.
- **Solución adoptada:** Rename completo en todo el código: data de productos, `RESTRICTED_CATEGORIES`, `catMap` `'1/1'`, filtros de color, links del dropdown y del menú mobile, check `isArchive`. Los dos jeans 1/1 siguen restringidos igual.
- **Archivo modificado:** `public/js/start.js`, `src/app/page.tsx`.
- **Pendiente:** Ninguno.

### Inversión de colores del header en home/archivo + fix del logo
- **Objetivo:** En home y archivo (fondo oscuro), al activar el header que se invierta a esquema claro (header/dropdown `#FAFAFA` con tipografía `#1A1A1A`) y la marquee de anuncios a `#1A1A1A` — bisagra opuesta a la actual. El resto de las páginas (fondo blanco) sin cambios.
- **Solución adoptada:** Clase `body.header-invert` toggleada por JS en el MutationObserver del header = header activo Y página oscura (home o archivo visible). CSS con `!important` para ganarle a las reglas existentes. Fix adicional: el logo del centro (`#header-logo`) sólo se mostraba al hover de Shop → ahora cualquier link del header lo muestra en home phase 0, y la regla `brightness(0)` lo invierte a negro. Verificado en shop que NO cambia (`header-invert: false`).
- **Archivo modificado:** `src/app/globals.css`, `public/js/start.js`.
- **Pendiente:** Ninguno.

### Ajustes estéticos: marquee + header en bold
- **Solución adoptada:** Marquee de anuncios (`.announcement-text`) de Univers 67 Condensed a Univers Regular Bold (`'Univers'` weight 700). Textos del header (Shop, Archivo, Buscar, Cuenta, Carrito) a bold, sin tocar el dropdown. Ambos aprobados por Naza tras verlos.
- **Archivo modificado:** `src/app/globals.css`.
- **Pendiente:** Ninguno.

## 2026-07-08

### PDP integrada al código real (con Fable como advisor)
- **Problema encontrado:** Trasladar los 3 features aprobados en `pdp-preview.html` (botón fill negro, miniaturas ancladas al fondo, size chart estilo Martine Rose) al código de producción (`public/js/start.js` + `src/app/globals.css`) sin romper flujos existentes (barra roja de login/contacto, carrusel mobile de fotos).
- **Solución adoptada:** Consulta previa a Fable como advisor (le pasé el standalone + código real) — devolvió 14 riesgos concretos (G1–G14), incorporados antes de codear. Integración en 3 etapas, cada una verificada en Chrome real antes de avanzar: (1) botón `.add-to-cart-btn` reescrito completo (base + mobile) con fill negro en hover que queda tras el click, separado del sistema de barra roja compartido con `.login-actions button` (verificado intacto). (2) Miniaturas: rail sticky anclado al fondo del viewport en desktop; en mobile, por decisión de Naza, se mantiene el carrusel horizontal existente y las miniaturas van en fila debajo (no el stack vertical del standalone). Scroll-to + scroll-spy + listeners singleton para evitar leaks entre navegaciones de PDP. (3) Size chart: nuevo `SIZE_CHARTS` mapea 9 calces (svg de `public/assets/size-charts/`) por prefijo de slug; overlay inyectado por producto dentro del template de la PDP; caso ARCHIVO (piezas 1/1) con la fila del talle fijada sin hover dinámico, por decisión de Naza.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** Revisión visual de Naza en el navegador (solo se verificó con Chrome DevTools MCP). Descripciones y medidas de `SIZE_CHARTS` son placeholders — reemplazar por producto. Talle fijo de ARCHIVO hardcodeado en 'S', ajustar a las piezas reales.

## 2026-07-08 (continuación)

### Catálogo de jeans: poda + rename a italiano + descripciones
- **Problema encontrado:** Quedaban 4 jeans en el catálogo (incluyendo un selvedge suelto negro que no se lanza) y el jean negro estaba mal etiquetado como "japonés" cuando en realidad es denim italiano de otro proveedor.
- **Solución adoptada:** Eliminado `jean-selvedge-suelto-negro` del array de productos (verificado que no estaba referenciado en stock ni related products). Renombrado `jean-selvedge-regular-negro` de "japonés" a "italiano" en `name`/`title`/`description`. Escritas descripciones nuevas para los 3 jeans restantes en la voz de marca: japonés = Nihon Menpu, tejido en Kojima/Okayama (13 oz); italiano = Candiani, provincia de Milán (11 oz). Oz de bermudas (americano) confirmada en 11.5 para uso futuro. Título de la PDP ahora coincide textualmente con el de la card del Shop (antes divergían). Título del size chart pasa a una sola línea (se le saca el `<br>` a nivel de todos los productos, no solo jeans).
- **Archivo modificado:** `public/js/start.js`.
- **Pendiente:** Descripciones de remeras/musculosas/bermudas (mismo tratamiento). Medidas reales del size chart siguen siendo placeholders, esperan a la modista.

### Bloque CUIDADO del denim, separado de la descripción
- **Problema encontrado:** El texto de cuidado del denim (lavado a mano, secado en sombra, etc.) vivía mezclado dentro de la descripción del producto, sin jerarquía visual propia.
- **Solución adoptada:** Nuevo campo `product.care` + bloque `.pdp-care` en el template de la PDP, renderizado debajo del botón AÑADIR, con subtítulo "CUIDADO" en Univers 67 Condensed. Iterado con Naza hasta: texto 15px desktop, subtítulo 23px desktop, separación botón→subtítulo 55px.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** Ninguno para los 3 jeans; replicar cuando se escriban las demás descripciones.

### Restricción de Bermudas/Musculosas/Archivo en el Shop (opción B)
- **Objetivo:** Sacar Bermudas, Musculosas y Archivo de venta temporalmente (se lanzan más adelante) sin ocultarlas del todo del Shop.
- **Solución adoptada:** Opción B elegida por Naza — las cards siguen navegables en el grid del Shop (teaser), pero el acceso a su PDP está bloqueado en las 4 vías posibles: click de card, related products, URL directa (`/shop/<slug>`), y `popstate`. Un único helper `isRestricted(product)` centraliza la lógica sobre una constante `RESTRICTED_CATEGORIES`. Visual: foto atenuada a 0.25 (iterado desde 0.5) y el precio de esas cards muestra "PRÓXIMAMENTE" en el mismo highlight negro del precio normal (se descartó un badge centrado sobre la foto — pedido explícito de Naza tras verlo mal ubicado).
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`.
- **Pendiente:** Cuando se lance cada categoría, sacarla de `RESTRICTED_CATEGORIES` y retocar su descripción.

### Highlight negro en el precio del Shop
- **Objetivo:** Reemplazar el precio en texto plano por un badge con fondo negro `#1A1A1A` y font `#FAFAFA`, al ras del texto.
- **Solución adoptada:** `.product-price` pasa a `display:inline-block` con background sólido; iterado el padding (de `4px 10px` a `2px 6px` + `line-height:1`) hasta que la caja quedara ceñida al texto, según referencia visual que mandó Naza.
- **Archivo modificado:** `src/app/globals.css`.

### CTAs del home conectados + footer social real
- **Problema encontrado:** Los botones de las secciones CAMPAÑA ("VER TODO"/"ARCHIVO") y SELVEDGE ("COMPRAR AHORA"/"VER LOOKBOOK") del home eran `href="#"` sin ningún handler. Los links de Instagram/TikTok del footer apuntaban a los dominios genéricos, sin usuario.
- **Solución adoptada:** Nuevo atributo `data-shop-cat` en los botones que sí tienen destino (VER TODO, COMPRAR AHORA, VER JEANS) — reutiliza `enableShopState`+`setShopCategory`, el mismo patrón que el dropdown de categorías del header. Los que apuntan a una página de fotos de campaña que todavía no existe (ARCHIVO del home, VER LOOKBOOK) quedaron marcados `data-pending="campana"` con un listener no-op, para no saltar al top mientras no exista el destino. Footer: Instagram → `instagram.com/gu.idocapuzzi/`, TikTok → `tiktok.com/@gu.idocapuzzi`.
- **Archivo modificado:** `src/app/page.tsx`, `public/js/start.js`.
- **Pendiente:** Crear la página de fotos de campaña y conectar ARCHIVO/LOOKBOOK.

### Deploy a producción
- **Solución adoptada:** Commit `e4ec2da` en `main`, pusheado y deployado por Vercel. Incluye los 9 SVGs de `public/assets/size-charts/` que estaban sin trackear en git (necesarios: sin ellos el size chart daría 404 en producción). Quedaron fuera del commit los archivos de tooling de sesión (`.claude/`), docs, scripts de test OCA y HTMLs standalone de preview, ajenos a este ship.
- **Archivo modificado:** `public/js/start.js`, `src/app/globals.css`, `src/app/page.tsx`, `public/assets/size-charts/*.svg`.
- **Pendiente:** El teaser/blackout de la home (`NEXT_PUBLIC_SHOW_TEASER`) se mantiene activo — no tocar sin indicación explícita de Naza.

## 2026-07-07

### PDP replicada de Martine Rose en standalone (`pdp-preview.html`)
- **Objetivo:** Replicar 3 features de la PDP de Martine Rose adaptados a la identidad GÜIDO, sobre un standalone que extrae la PDP real de la web (grid 60/40, foto a la izquierda) y modifica solo lo necesario.
- **Solución adoptada:** (1) Botón AÑADIR AL CARRITO con fill blanco inicial → hover fill negro izq→der (texto blanco); queda negro tras el click. (2) Miniaturas ancladas al fondo del viewport (mecánica MR: wrapper sticky alto viewport + hijo `bottom:0` + `margin-top`=alto 1ª imagen): no se ven en el primer viewport, suben desde abajo tras pasar las primeras fotos y quedan ancladas hasta el final; se mantiene el scroll vertical de imágenes; clic = scroll-to; scroll-spy marca la activa (sin rojo). (3) Miniaturas 120px cuadradas; hover: la hovereada se achica, las otras en gris.
- **Archivo modificado:** `pdp-preview.html` (raíz, referencia no committeable).
- **Pendiente:** Trasladar 1 a 1 al código real (`start.js`/`page.tsx`/`globals.css`).

### Size chart estilo Martine Rose + diagramas de calce
- **Objetivo:** Rediseñar la guía de talles al estilo MR, con diagrama por producto.
- **Solución adoptada:** Label "Tabla de Talles" (Univers Regular Bold) + cerrar; título = nombre de la prenda en Univers Condensed mayúscula (conectado por JS al `h1`); descripción Univers Regular mayúsculas `#1A1A1A` (texto base traducido de MR, contacto `info@guidocapuzzi.com`); toggle CM|IN funcional (0.65rem, centrado sobre la tabla); tabla con grilla, talles en filas, primera fila y columna en Univers Condensed; cross-highlight fila×columna gris claro al hover; reveal de "cortina" (`clip-path`) como firma GÜIDO. El SVG del diagrama va debajo de la tabla, al doble (264px), centrado, con scroll vertical del panel.
- **Archivo modificado:** `pdp-preview.html`; 9 SVGs de calce trazados por Naza movidos a `public/assets/size-charts/` (boxy, oversize, bbyt, termal, musculosa, regular, suelto, levis, bermudas). Traen los marcadores A–E incorporados. Jean = A.Largo/B.Cintura/C.Cadera/D.Tiro/E.Botamanga.
- **Pendiente:** Descripción + tabla propias por producto/tipo de prenda al integrar.

### Decisiones de catálogo (para próxima sesión)
- **Problema encontrado:** Definir qué productos y secciones entran al lanzamiento.
- **Solución adoptada:** (1) Restringir bermudas + musculosas + archivo (salen meses después; idea: opacidad de fotos a la mitad + texto en cada card, restringiendo acceso a esas PDP). (2) Eliminar el jean selvedge suelto negro: quedan solo suelto + regular del indigo japonés y regular del negro italiano.
- **Pendiente:** Implementar ambas al trasladar el PDP al código real.

## 2026-06-09

### Webhook de novedades OCA — validación e2e + fixes
- **Problema encontrado:** Cross-check del código contra el doc oficial (`docs/external/Webhook OCA.pdf`) reveló que OCA manda `idEstado` como string (`"7"`) o número según el evento, y el objeto `sucursal` usa `descripcion/calle/numero/localidad/provincia` (no `nombre/domicilio/codigo_postal`). Las comparaciones estrictas (`[7,10,11].includes(idEstado)`, `switch(idEstado)`) daban false con strings → los emails de cambio de estado nunca se enviaban.
- **Solución adoptada:** Coerción `Number(idEstado)` en el receptor y en `sendShippingStatusEmail`. Mapeo de los campos reales de sucursal en email y cronograma. Tipos + JSDoc alineados al doc.
- **Archivo modificado:** `src/app/api/webhooks/oca/route.ts`, `src/lib/email.ts`, `public/js/start.js` (commit `b66e1d0`).
- **Pendiente:** Validación final con soporte OCA sobre el envío real.

### Bug timezone en el cronograma
- **Problema encontrado:** OCA manda `fecha` en hora local Argentina (UTC-3) sin timezone. Se guardaba en `TIMESTAMPTZ` interpretándose como UTC → el display en el browser se corría -3h, cruzando la medianoche (un evento de 00:00 se veía como 21:00 del día anterior).
- **Solución adoptada:** Helper `normalizarFechaOCA()` que anexa `-03:00` antes de persistir. Argentina no observa DST → offset fijo.
- **Archivo modificado:** `src/app/api/webhooks/oca/route.ts` (commit `1bbcfb5`).

### Bug checkout pegado debajo de /cuenta + número de orden unificado
- **Problema encontrado:** (1) Al añadir al carrito estando logueado en `/cuenta`, el checkout se renderizaba debajo del panel en vez de reemplazarlo (`enableCheckoutState` no escondía `#account-dashboard`). (2) El mismo pedido se mostraba como `#A30EC511` (fragmento de UUID) en la confirmación y `#00061` (`numero_orden`) en el panel y emails.
- **Solución adoptada:** Agregar `#account-dashboard` a `sectionsToHide`. Unificar todo en `numero_orden`: la confirmación lo lee de `sessionStorage` y lo confirma vía API (se sumó `numero_orden` al select de `/api/ordenes/[id]`).
- **Archivo modificado:** `public/js/start.js`, `src/app/api/ordenes/[id]/route.ts` (commit `360b973`).

### Envío duplicado en ePak — diagnóstico
- **Problema encontrado:** La orden 61 creó DOS drafts en ePak (`IdOrdenRetiro` 138739522 y 138739520). Causa: el guard de idempotencia en el webhook NAVE es check-then-act no atómico, y NAVE entrega la notificación más de una vez.
- **Solución adoptada:** Diagnóstico confirmado (no fixeado aún). Naza se quedó con un draft y eliminó el otro. Fix propuesto: claim atómico (replicar patrón de email/stock del commit `219d4b7`).
- **Pendiente:** Implementar claim atómico + logging de auditoría NAVE en `webhook_logs`.

### Self-test del webhook (sin soporte)
- **Solución adoptada:** Script `oca-fire-step.mjs` que dispara un evento con hora real AR. Se corrió la secuencia idEstado 4→8→10 contra el webhook de producción con datos reales de la orden 61. Cronograma avanzó paso a paso con fechas correctas, y llegó el email de entrega. Validación de nuestro lado: completa.
- **Pendiente:** Validación del lado de OCA con soporte (en TEST no disparan solo; en producción con paquete real es automático).

---

## 2026-05-27 — Claude Code automations setup completo

### Setup de automations

- **Problema encontrado:** El setup de Claude Code carecía de protecciones automáticas y herramientas de workflow para el proyecto.
- **Solución adoptada:** Implementación completa de 6 automations: hooks PreToolUse/PostToolUse, skills /crear-migracion y /test-endpoint, subagent guido-security, plugin security-guidance (Anthropic oficial), MCP context7.
- **Archivos modificados:** `.claude/settings.local.json`, `.claude/settings.json` (nuevo), `.mcp.json`, `.claude/hooks/block-env.js` (nuevo), `.claude/hooks/check-ts.js` (nuevo), `.claude/commands/crear-migracion.md` (nuevo), `.claude/commands/test-endpoint.md` (nuevo), `.claude/agents/guido-security.md` (nuevo), `.claude/claude-security-guidance.md` (nuevo), `.claude/security-patterns.yaml` (nuevo).
- **Pendiente:** Test e2e A.3 (OCA+NAVE producción).

---

## 2026-05-25 — Cronograma de Envío vertical (Sub-fase A + B)

### Diseño del componente (standalone HTML)

**Contexto:** El timeline horizontal de 4 dots implementado en la sesión anterior era funcional pero visualmente plano. Naza diseñó en Inkscape (`cronograma.svg`) un cronograma vertical de 4 pasos con tipografía, pills de estado, spinner animado y barra de progreso.

**Sub-fase A — Iteración visual aislada:**
- Creado `cronograma-preview.html` en la raíz del repo (standalone, no committeable) replicando el SVG de referencia
- 5 estados visualizables via selector: EN CAMINO (domicilio), EN SUCURSAL, ENTREGADO, INCIDENTE/ALERTA, CANCELADO
- Dot verde con checkmark para HECHO, spinner dashed marrón `#442517` rotando con inner dot verde para ACTIVO, dot semiopaco con número para PENDIENTE, dot rojo con ⚠ para ALERTA
- Barra de progreso verde `#2A5C3F` con transición `800ms ease`, roja en estados de alerta/cancelado
- Pills HECHO/ACTIVO/PENDIENTE/ALERTA en Univers Regular Bold (no Condensed)
- Badge de estado global (EN TRANSITO / EN SUCURSAL / ENTREGADO / NO ENTREGADO / CANCELADO) también en Univers Regular Bold

**Decisiones de diseño confirmadas en sesión:**
- Cronograma solo visible al **expandir** la card de pedido. Card colapsada muestra mini barra de progreso compacta
- **Entrega estimada calculada internamente**: `pagado_at + N días hábiles` (CABA/GBA domicilio=3, sucursal=2; resto domicilio=5, sucursal=4)
- Estado de error: pill **ALERTA** rojo + texto `MOTIVO: <descripción>` bajo el paso afectado + barra roja

**Nuevo color de marca:** `--color-green: #2A5C3F` (verde bosque) — primera y única excepción a la paleta de 4 colores del proyecto. Documentado en `:root` con comentario explicativo.

### Integración al panel `/cuenta` (Sub-fase B)

**Archivos modificados:**
- `src/app/globals.css` — agregado `--color-green: #2A5C3F`, bloque `.cronograma-*` completo (reemplaza `.timeline-*` eliminado), `@keyframes cronograma-spin`
- `public/js/start.js` — nuevas funciones: `_sumarDiasHabiles()`, `_calcularEntregaEstimada()`, `_formatFechaCorta()`, `_formatTimestampCronograma()`, `_eventoParaPaso()`, `_buildCronograma()`, `renderCronograma()`, `renderProgressBar()`. Reemplaza `renderTimeline()` y `_getTimelineStep()` eliminados.
- `src/app/api/cliente/ordenes/route.ts` — cap de `eventos_envio_oca` subido de 5 a 20 por orden

**Lógica de mapeo (12 estados OCA → 4 pasos del cronograma):**
- idEstado 1-6 → paso 2 activo/hecho
- idEstado 7 → paso 3 activo "Disponible en sucursal" (solo envío sucursal)
- idEstado 8-9 → paso 3 activo "En camino" (domicilio)
- idEstado 10 → paso 4 done "Entregado" / "Retirado"
- idEstado 11-12 → paso actual → estado `alert` + pill ALERTA rojo + MOTIVO

**Verificación:** Build `npm run build` limpio. Validación visual del cronograma realizada contra el SVG de referencia via Chrome DevTools Preview. Los 5 estados se ven correctamente en desktop y mobile 375px. Sin órdenes en cuenta de prueba — verificación end-to-end diferida al e2e de OCA.

**Pendiente:** Test e2e del cronograma en panel real, diferido al checkeo total OCA (compra ficticia + webhook + validación soporte).

## 2026-05-22 (tarde)

### Panel `/cuenta` — implementación completa (3 secciones funcionales)

**Contexto:** El panel `/cuenta` tenía infraestructura armada (auth Supabase + layout dos columnas + nav switching) pero el contenido funcional estaba incompleto. "Mis Pedidos" era empty state hardcodeado, "Mis Datos" solo mostraba campos en read-only, no había sección de Preferencias ni gestión de direcciones.

**Implementación end-to-end de las 3 secciones:**

**Mis Pedidos (B.1 + B.2 del plan):**
- Endpoint `GET /api/cliente/ordenes` — autenticado (Bearer token + email match en `clientes`)
- Join completo: `items_orden` + `variantes_producto` + `productos` (para imágenes) + `direcciones_envio` + últimos 5 `eventos_envio_oca`
- UI: cards con número de orden, fecha, badge de estado, items con thumbnail, **timeline visual de 4 dots** (Creado → Pagado → En camino → Entregado), total
- Detalle expandible inline (no modal): dirección, N° seguimiento OCA, lista de eventos del webhook
- Polling cada 60s con pausa via `visibilitychange` cuando la pestaña no es visible

**Mis Datos + Direcciones:**
- Bloque "DATOS PERSONALES": nombre, apellido, email (con check `✓` de verificado), teléfono
- Modal EDITAR con sweep rojo en el botón GUARDAR, `PATCH /api/cliente/datos`
- Bloque "DIRECCIONES DE ENVÍO" separado por hairline
- Mini-cards con dot principal (●) o secundario (○), click en dot vacío → set como principal
- Modal AGREGAR/EDITAR con form completo (calle, número, piso, depto, ciudad, provincia, CP, checkbox principal)
- `GET/POST/PATCH/DELETE /api/cliente/direcciones` + `[id]` para CRUD completo

**Preferencias:**
- Toggle newsletter (track `#E5E5E5` → `#AD1C1C` cuando ON)
- Botón CAMBIAR CONTRASEÑA → `supabaseClient.auth.resetPasswordForEmail()` con email del usuario
- ELIMINAR CUENTA en gris al fondo, doble confirmación textual ("escribí ELIMINAR para confirmar")

**Auth pattern adoptado:** Bearer token. Frontend extrae `access_token` de `supabaseClient.auth.getSession()`, server lo verifica con `supabase.auth.getUser(token)` y matchea por email. Consistente con el resto del proyecto (no usa `@supabase/ssr` que no está instalado).

**Decisión de timeline diferida:** El timeline funcional está implementado pero Naza no está convencido del resultado visual (simples dots conectados). Próxima sesión: buscar referencias en Pinterest + codear standalone HTML aislado primero, integrar después.

**Cambio de approach declarado:** A partir de la próxima sesión se abandona desktop-first. Todo lo nuevo (refinamiento timeline, futuras features) se hace desktop + mobile en paralelo.

**Verificación visual:** Build pasa limpio mostrando 4 routes nuevas. Preview server confirmó renderizado correcto: sidebar 3 nav items, empty states, mock card con timeline (3 dots rellenos + 1 vacío + lineas conectoras), modales con transiciones smooth, toggle rojo. Inspeccionado: badge en Univers 67 Condensed 9.92px tracking 1.19px y dots 8×8px `#1A1A1A`.

**Bug pre-existente fixeado:** `_cuentaNavInitialized` nunca se reseteaba en logout. Ahora el handler de logout llama `stopPedidosPolling()` y resetea el flag, permitiendo re-bind correcto si el usuario vuelve a loguearse.

**Pendiente:** Iterar timeline visual, mobile responsiveness, endpoint `DELETE /api/cliente/cuenta` (backend de eliminar cuenta), test e2e con cuenta real con órdenes.

**Archivos modificados:**
- `src/app/api/cliente/ordenes/route.ts` (nuevo)
- `src/app/api/cliente/datos/route.ts` (nuevo)
- `src/app/api/cliente/direcciones/route.ts` (nuevo)
- `src/app/api/cliente/direcciones/[id]/route.ts` (nuevo)
- `src/app/page.tsx` — restructura `account-dashboard` con 3 secciones + 3 modales
- `src/app/globals.css` — bloque grande de estilos (pedido card, timeline, datos, direcciones, preferencias, toggle, modales, responsive @900px)
- `public/js/start.js` — ~400 líneas: load/render/polling/modales/handlers

---

## 2026-05-22

### OCA — Respuesta de soporte: integración validada + XML compartido

**Email de auditoría enviado a OCA** con descripción técnica del flujo completo:
cotización → sucursales → auto-creación vía webhook NAVE → `ConfirmarRetiro=false` → confirmación manual en ePak → etiqueta → despacho → webhook de novedades.

**Respuesta de OCA:**
- ✅ Integración validada ("en principio, estaría todo correcto")
- ✅ `ConfirmarRetiro=false` aceptado — no es necesario cambiar
- ℹ️ Observación de "creación vía ePak" era meramente informativa, no un error
- ⏳ Listos para test e2e — esperan número de envío + idOrdenRetiro + timestamp
- ⏳ Solicitaron XML de `IngresoORMultiplesRetiros` para revisión

**Variables de entorno verificadas:**
- `OCA_NUMERO_CUENTA` = `197239/000` ✅ (valor correcto en Vercel)

**Próximos pasos:**
1. Responder a OCA con XML de creación
2. A.3: generar compra de prueba (sandbox NAVE) → compartir `nroEnvio` + `idOrdenRetiro` a OCA → validar webhook de novedades end-to-end

---

## 2026-05-18

### OCA webhook — re-suscripción con cuenta real + validación secret

**Contexto:** OCA soporte informó que la suscripción anterior (sesión 2026-05-10) fue hecha con el número de cuenta de test (`111757/001`) en lugar del número real. La suscripción no estaba activa.

**Re-suscripción ejecutada:**
- POST a `http://www6.oca.com.ar/apinovedadesclientes/apinovedades/suscribir`
- Body enviado:
  ```json
  {
    "NroCuenta": "197239/000",
    "UrlApi": "https://güidocapuzzi.com/api/webhooks/oca",
    "Origen": "GUIDO CAPUZZI",
    "Headers": [{ "Clave": "X-OCA-Secret", "Valor": "<secret>" }]
  }
  ```
- Respuesta OCA: `{}` HTTP 200 OK
- URL enviada en Punycode (`xn--gidocapuzzi-thb.com`) por limitación de terminal
- Secret nuevo generado y actualizado en Vercel + redeployado

**Fix — validación X-OCA-Secret:**
- Commit `dc5bc4d`: validación implementada en `src/app/api/webhooks/oca/route.ts`
- Secret inválido o ausente → responde 200 pero no procesa el evento

**Estado:** Pendiente confirmación de OCA de que la suscripción con cuenta real quedó activa.

---

## 2026-05-10 (continuación)

### Meta — Ejecución: Pixel + código + MCP + OCA suscripción

**D.0 — Pixel + Ad Account creados (Naza):**
- Ad Account GÜIDO ADS: ID `1293014999694073`
- Pixel GÜIDO Pixel: ID `862180773603752`
- Portfolio nuevo: `gu.idocapuzzi` (ID: `1721079012391547`)
- Dominio `güidocapuzzi.com` ya verificado

**D.1 — Actualización Pixel ID en código:**
- `src/app/layout.tsx:12`: actualizado a `const PIXEL_ID = "862180773603752"`
- Deploy automático a Vercel completado

**D.2 — Verificación Pixel post-deploy:**
- Network tab: 200 OK a `facebook.com/tr` con Pixel ID correcto ✅
- Events Manager: PageView event visible en tiempo real ✅
- Tracking activo y funcionando en producción

**Meta MCP — Reconectado:**
- Naza reconectó usando Facebook personal account (`na.zz.a@hotmail.com`)
- Ads features aún en rollout (no bloqueante, operable manualmente)

**A.2.d — OCA webhook suscripción completada:**
- POST exitoso a `http://www6.oca.com.ar/apinovedadesclientes/apinovedades/suscribir`
- Keys en PascalCase (reintento tras primer fallo con lowercase)
- Respuesta: 200 OK
- Secret en Vercel env var `OCA_WEBHOOK_SECRET` ✅
- Endpoint activo en `https://güidocapuzzi.com/api/webhooks/oca`

---

## 2026-05-10

### Meta Business Suite — Reset completo + planificación OCA/cuenta

**Meta — Portfolio anterior perdido, nuevo creado:**
- Email `ncgc@guidocapuzzi.com` quedó en bucle de confirmaciones (sin cuenta Facebook asociada)
- Nuevo portfolio desde cuenta personal de Facebook: **gu.idocapuzzi** (ID: `1721079012391547`)
- Perdidos: Pixel `1882249755738633`, Ad Account `1303341605016642`, 3 Saved Audiences
- Dominio re-verificado ✅. Pendiente: crear nuevo Pixel + Ad Account, actualizar código

**OCA — Confirmación webhook:** soporte confirmó procedimiento de suscripción (POST único, HTTPS requerido). Código ya implementado, falta suscripción.

**Plan actualizado:** Meta (Pixel + MCP) → OCA suscripción → Panel /cuenta con tracking en vivo

---

## 2026-05-06

### Implementación Bloque A — Webhook de novedades de OCA (MVP)

Implementación completa de la infraestructura de tracking en vivo de envíos.

**A.1 — Fix `origen="API"` en cabecera XML de OCA**
- Commit `025140e`: agregado atributo `origen="API"` en `src/lib/oca/xml-generator.ts:21`
- Requerimiento de OCA para conformidad de integración
- Se dispone para responder a su mail de validación

**A.2.a — Endpoint receptor de webhook (`POST /api/webhooks/oca`)**
- Commit `a6e5642`: nuevo archivo `src/app/api/webhooks/oca/route.ts`
- Responde 200 OK inmediatamente, procesa async con `after()`
- Validación de header `X-OCA-Secret` contra env var `OCA_WEBHOOK_SECRET`
- Match de orden por `nro_envio_oca` (identificador confiable según soporte)
- Mapeo de códigos OCA (1-12) a estados internos (en_preparacion, disponible_retiro_sucursal, en_camino, entregado, no_entregado, en_devolucion)
- Integración con tabla `eventos_envio_oca` para historial

**A.2.b — Migración SQL**
- Commit `a6e5642`: nuevo archivo `backend/sql/14_oca_webhook_novedades.sql`
- Tabla `eventos_envio_oca`: registro completo de eventos con idempotencia vía UNIQUE `(nro_envio_oca, id_estado, fecha)`
- Columna `ordenes.estado_envio` para tracking en vivo del cliente
- Índices optimizados para búsquedas por orden, fecha y estado

**A.2.c+1 — Notificaciones de envío por email**
- Commit `a6e5642`: función `sendShippingStatusEmail()` en `src/lib/email.ts`
- 4 templates dinámicos según estado OCA:
  - Estado 7 (disponible retiro sucursal): dirección de sucursal
  - Estado 10 (entregado): confirmación de entrega
  - Estado 11 (no entregado): motivo + contacto
  - Estados en camino: notificación de progreso
- Reutilización de sistema visual de marca (Univers fonts, paleta #AD1C1C, etc.)

**Stack técnico:**
- Node.js 24 LTS con TypeScript, Vercel Fluid Compute
- Supabase PostgreSQL para persistencia
- Resend para emails transaccionales
- `next/server` `after()` para async safety

**Pendiente:**
- [ ] A.2.d: Suscripción manual al webhook en OCA (POST a endpoint de suscripción, post-deploy)
- [ ] A.3: Test e2e en producción (compra real, webhook en vivo, emails al cliente)

**Métrica:** Bloque A — 3 de 4 items completados. Status: MVP implementado, pending testing y suscripción.

---

## 2026-04-30

### Validación de OCA + Webhook de novedades + plan tripartito

Sesión corta de planificación. OCA respondió pidiendo update.

**Feedback OCA:** falta `origen="API"` en cabecera del XML de creación de envíos. Verificado en `src/lib/oca/xml-generator.ts:21` — fix de una línea pendiente.

**Webhook de novedades OCA:**
- PDF documentación recibido y movido a `docs/external/Webhook OCA.pdf`.
- Endpoint suscripción: `POST http://www6.oca.com.ar/apinovedadesclientes/apinovedades/suscribir`.
- POST entrante por cada cambio de estado (1-12) con sucursal y receptor.
- Doc completa en vault: `Tech/Webhook OCA.md`.

**Plan creado:** `hace-varios-dias-que-stateful-moonbeam`. 4 bloques:
- A: cierre OCA (fix `origen="API"` + endpoint receptor + tabla `eventos_envio_oca` + suscripción).
- B: panel `/cuenta` con tracking en vivo + emails de cambio de estado.
- C: bot Telegram como sistema operativo (alimentado por A).
- D: Meta MCP — conectar Custom Connector y mapear capacidades.

**Meta MCP:** salió MCP oficial de Meta, Naza agregó Custom Connector. MCP > CLI para esta etapa — integración directa con el agente.

**Archivos:** PDF movido a `docs/external/`. No hubo cambios de código en esta sesión.

---

## 2026-04-20 (sesión 2 — continuación)

### Notas OCA actualizadas con aclaraciones de soporte

Soporte OCA respondió email de consultas. Aclaraciones incorporadas a vault:
- `IdFranjaHoraria` → irrelevante para drop-off
- Dimensiones → OCA afora en planta; diferencias generan ajuste de facturación
- `ConfirmarRetiro=false` → cliente no puede rastrear hasta confirmación manual en ePak
- `nro_envio_oca` → identificador principal de tracking, confiable y estable

### Stock restaurado y órdenes OCA limpiadas

- Stock ítem de control restaurado a 50 via Supabase SQL
- Órdenes test OCA 213901843/213901978/213902075 → ya inactivas (IdResult=120). Sin acción.

### Fix accordion mobile — matchMedia reemplaza innerWidth

**Problema:** Accordion checkout mobile no aparecía en DevTools simulation.
**Causa:** `window.innerWidth` no refleja el viewport simulado de DevTools.
**Solución:** `window.matchMedia('(max-width: 768px)').matches` — consulta el mismo engine CSS.
**Verificación:** Accordion confirmado en www.güidocapuzzi.com ✅
**Archivo:** `public/js/start.js` — `enableCheckoutState()`
**Commit:** `65c678b`

### Clarificación de dominios

- `guidocapuzzi.com` (sin diéresis) = Google Workspace + Resend (emails). IP: 2.57.91.91. No es Vercel.
- `güidocapuzzi.com` (con diéresis) = Vercel, proyecto gc.com. IP: 216.198.79.1.

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
