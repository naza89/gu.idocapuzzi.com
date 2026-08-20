# Fotos de producción — convención de nombres (Shop / PDP)

> Producción del 11/8/2026. Este archivo es la tabla de traducción entre las fotos
> del shoot y los 21 productos del catálogo de `public/js/start.js`.
> Fase 1: Shop + PDP. Fase 2 (después): home y `/archivo`.

## Cómo funciona

1. Naza deja los originales en `public/assets/images/fotoproducto/`.
2. Cada archivo se renombra con el **prefijo del producto** + `_` + número correlativo:
   `REMERA_LOGO_ROJO_1.jpg`, `REMERA_LOGO_ROJO_2.jpg`, …
3. El número **es el orden en la PDP**, y los dos primeros tienen rol fijo:
   - `_1` → **portada**: la que se ve en la grilla del Shop y en los "related" de la PDP
   - `_2` → **hover**: la que asoma al pasar el mouse por la card del Shop
   - `_3` en adelante → siguen el carrusel de la PDP, en ese orden
4. Claude convierte a WebP (~1800px de lado largo), los deja en
   `public/assets/images/products/` y actualiza el array `products` de `start.js`.

**Mínimo 2 fotos por producto.** Con una sola, la card del Shop queda sin hover.

### Alternativa sin tipear nombres largos

En `fotoproducto/` hay una subcarpeta por producto con el nombre del prefijo.
Se puede arrastrar cada foto a su carpeta y renombrarla adentro sólo con el número
(`1.jpg`, `2.jpg`, `3.jpg`). Claude arma los nombres finales a partir de la carpeta.
Los dos métodos se pueden mezclar.

## Reglas de encuadre

Los recortes son `cover` **centrado**, así que lo que quede fuera se pierde:

| Dónde | Recorte |
|-------|---------|
| Card del Shop | **4:5 vertical** |
| Galería de la PDP (desktop) | **4:5 vertical** — desde 2026-08-19 |
| Galería de la PDP (mobile) | 390:624 ≈ 5:8, más vertical todavía |

> **Cambio del 2026-08-19.** La galería de la PDP era `height: calc(100vh - header)`
> sobre un ancho del 52.27%, o sea una caja **casi cuadrada** (0.92 en 1440×900,
> 1.00 en 1920×1080). Una vertical 2:3 perdía entre 27% y 34% del alto: a las fotos
> de cuerpo entero se les iban la cabeza y los pies, y no había posición de recorte
> que las salvara (el modelo ocupa ~74% del cuadro y sólo entraba el 66%).
> Naza aprobó pasarla a **4:5**. Primer intento: topear el ancho con
> `min(52.27%, (100vh − header) × 0.8)` para que la caja entrara en el viewport.
> **Salió mal:** ese tope ata el ancho a la *altura* de la ventana, y en una
> ventana de 724px de alto la galería colapsaba al **33.1%** del ancho en vez del
> 52.27%, con 548px de vacío a la derecha. Se revirtió.
>
> **Solución final:** el ancho vuelve al 52.27% de la spec y la galería **deja de
> ser sticky**. A 4:5 la caja mide 65.34% del ancho de alto, o sea más que el
> viewport en cualquier pantalla real; un sticky más alto que el viewport se clava
> arriba y su pie no se ve nunca, que es justo lo que queríamos evitar. Ahora la
> galería scrollea con la página: al abrir la PDP se ve el 60-65% superior de la
> foto y el resto entra al scrollear. **Es el compromiso aceptado:** con 4:5 y
> 52.27% de ancho no hay pantalla real donde la foto entera entre sin scrollear
> (haría falta una ventana de 1100px+ de alto).

→ Una vertical **2:3 (4000×6000) pierde 16.7% del alto**, 8.3% arriba y 8.3% abajo.
Es el formato ideal: entregá verticales con la prenda centrada y aire arriba y abajo.

→ Una **apaisada 3:2 (6000×4000) pierde 46.7% del ancho**, 23.3% de cada lado. Se
puede usar, pero el aire lateral que suele ser lo que hace la foto desaparece.
Conviene reservarlas para las posiciones `_3` en adelante, nunca para portada.

## Reglas de archivo

- **No tocar los originales**: no achicar, no recortar, no convertir. La optimización la hace el build.
- **Nombres sin acentos, sin ü, sin espacios ni barras** — todo ASCII en mayúsculas con `_`.
  (Las fotos viejas usan `remera-güido-*.png`; las nuevas no repiten esa trampa.)
- **Una foto que sirve a dos productos** (un look con jean + remera): nombrala por el
  protagonista y avisá cuál es el otro producto. El código puede apuntar al mismo
  archivo desde varios productos sin duplicarlo.
- Los originales **no se commitean** (pesan). La carpeta `fotoproducto/` va al `.gitignore`;
  al repo entran sólo los WebP generados.

---

## Los 21 prefijos

### REMERAS

| Prefijo | Producto | Colorway | SKU |
|---------|----------|----------|-----|
| `REMERA_LOGO_NEGRO_` | REMERA GÜIDO OVERSIZED | NEGRO LOGO BLANCO | `REM-LOGO-NBL` |
| `REMERA_LOGO_ROJO_` | REMERA GÜIDO OVERSIZED | NEGRO LOGO ROJO | `REM-LOGO-NRO` |
| `REMERA_LOGO_BLANCO_` | REMERA GÜIDO OVERSIZED | BLANCO LOGO NEGRO | `REM-LOGO-BNE` |
| `REMERA_AFLIGIDA_NEGRO_` | REMERA AFLIGIDA BAGGED TEE | NEGRO | `REM-AFL-NEG` |
| `REMERA_AFLIGIDA_NAVY_` | REMERA AFLIGIDA BAGGED TEE | NAVY | `REM-AFL-NAV` |
| `REMERA_AFLIGIDA_BLANCO_` | REMERA AFLIGIDA BAGGED TEE | BLANCO | `REM-AFL-BLA` |
| `BABYTEE_NEGRO_` | REMERA BABY TEE REGISTRADA | NEGRO | `REM-BBY-NEG` |
| `BABYTEE_BLANCO_` | REMERA BABY TEE REGISTRADA | BLANCO | `REM-BBY-BLA` |
| `TERMAL_NEGRO_` | REMERA MANGA LARGA TERMAL | NEGRO | `REM-TRM-NEG` |
| `TERMAL_BLANCO_` | REMERA MANGA LARGA TERMAL | BLANCO | `REM-TRM-BLA` |

> La Baby Tee **navy** se eliminó del catálogo (migración 15) — no hay que nombrar fotos para ella.
> Hoy las dos Baby Tee tienen **una sola foto** cada una: son las que más ganan con material nuevo.

### TOPS / MUSCULOSAS

| Prefijo | Producto | Colorway | SKU |
|---------|----------|----------|-----|
| `MUSCULOSA_NEGRO_` | MUSCULOSA DOBLE SIMBOLO OVERSIZED | NEGRO | `MUS-DSB-NEG` |
| `MUSCULOSA_BLANCO_` | MUSCULOSA DOBLE SIMBOLO OVERSIZED | BLANCO | `MUS-DSB-BLA` |

> Categoría **restringida** hoy (`RESTRICTED_CATEGORIES`): se ve en el Shop con la foto
> atenuada y "PRÓXIMAMENTE", la PDP está bloqueada. Las fotos se cargan igual.

### PANTALONES / JEANS

| Prefijo | Producto | Colorway | SKU |
|---------|----------|----------|-----|
| `JEAN_INDIGO_SUELTO_` | JEAN DENIM SELVEDGE JAPONÉS FIT SUELTO | ÍNDIGO | `JEA-IND-SUE` |
| `JEAN_INDIGO_REGULAR_` | JEAN DENIM SELVEDGE JAPONÉS FIT REGULAR | ÍNDIGO | `JEA-IND-REG` |
| `JEAN_NEGRO_REGULAR_` | JEAN DENIM SELVEDGE ITALIANO FIT REGULAR | NEGRO | `JEA-NEG-REG` |

> Los dos índigo son **el mismo denim en dos calces**. Si una foto no permite
> distinguir suelto de regular, mejor que vaya al que corresponda por ficha de rodaje
> y no "a ojo" — son dos productos separados de $240.000 cada uno.
> Hoy comparten la foto de doblado (`jean-indigo-fold.png`) como tercera imagen.

### BERMUDAS / SHORTS

| Prefijo | Producto | Colorway | SKU |
|---------|----------|----------|-----|
| `BERMUDA_DK_NEGRO_` | BERMUDA SELVEDGE DOUBLE KNEE | NEGRO | `BER-DK-NEG` |
| `BERMUDA_PATCHWORK_` | BERMUDA SELVEDGE PATCHWORK | ÍNDIGO/NEGRO | `BER-PAT-MIX` |

> También **restringida** hoy, igual que musculosas.

### INTERVENCIONES (piezas 1/1)

| Prefijo | Producto | Colorway | SKU |
|---------|----------|----------|-----|
| `INTERV_WILDCAT_` | JEAN PINTOR "WILDCAT" | 1/1 | `JEA-1/1-SUR` |
| `INTERV_FAJA_` | JEAN PINTOR "FAJA" | 1/1 | `JEA-1/1-ENC` |
| `INTERV_ENCERADO_` | JEAN ENCERADO | 1/1 | `JEA-1/1-WAX` |
| `INTERV_CAMO_` | BERMUDA CAMO "WOODLAND" | 1/1 | `BER-1/1-CAM` |

> Son únicas: conviene darles **más fotos que al resto** (detalle de la intervención,
> la badana de cuero negra, el bajo deshilachado en el caso de la camo).

---

## Fase 2 — buckets que NO son de producto

Se pueden ir separando ahora aunque se carguen después:

| Prefijo | Destino |
|---------|---------|
| `HOME_` | Bloques del home (secciones CAMPAÑA, SELVEDGE, etc.) |
| `ARCHIVO_GRID_1` … `_5` | Grid disperso de la landing `/archivo` — son **exactamente 5 slots** (`g1`–`g5` en `archive-data.js`) |
| `ARCHIVO_LOOK_` | Columna LOOKS de la colección SS26 |
| `ARCHIVO_DETALLE_` | Columna DETALLES de la colección SS26 |

El fashion film de Fini va aparte, en `public/assets/video/`.

---

## Progreso de la carga

**Los 21 productos están cargados** (2026-08-20). 96 fotos en total.

| Producto | Fotos |
|---|---|
| `REMERA_LOGO_NEGRO` / `_ROJO` | 4 c/u |
| `REMERA_LOGO_BLANCO` | 6 |
| `REMERA_AFLIGIDA_NEGRO` / `_NAVY` / `_BLANCO` | 5 c/u |
| `BABYTEE_NEGRO` / `_BLANCO` | 5 c/u |
| `TERMAL_NEGRO` | 5 · `TERMAL_BLANCO` 6 |
| `MUSCULOSA_NEGRO` / `_BLANCO` | 2 c/u |
| `JEAN_INDIGO_SUELTO` 5 · `JEAN_INDIGO_REGULAR` 6 · `JEAN_NEGRO_REGULAR` 5 | |
| `BERMUDA_DK_NEGRO` 7 · `BERMUDA_PATCHWORK` 4 | |
| `INTERV_WILDCAT` 5 · `INTERV_FAJA` 2 · `INTERV_ENCERADO` 5 · `INTERV_CAMO` 3 | |

Pendiente sólo el material de Fini para `_HOME` y `_ARCHIVO`.

**Conversión:** `node scripts/procesar-fotos.mjs [PREFIJO ...]` — sin argumentos
procesa todas las carpetas que tengan fotos. Salida a 1800px de lado largo,
WebP calidad 82 (los archivos quedan entre 50 y 310KB). El script saltea y
reporta cualquier archivo que no respete `PREFIJO_<n>.<ext>`, y avisa si una
foto apaisada cayó en posición 1 o 2. Al final imprime el `images: [...]` listo
para pegar en `public/js/start.js`.

## Los PNG viejos: por qué siguen ahí

Quedan **45 PNG huérfanos** en `products/`: ningún producto del front los
referencia ya. **No se borran todavía**, y el motivo no es prolijidad sino que
`productos.imagenes` de Supabase todavía apunta a ellos, y esa columna la leen
las miniaturas de las órdenes (confirmación post-pago y "Mis Pedidos").

Secuencia correcta, para no romper nada en el medio:

1. Commitear los WebP nuevos + `start.js`, **dejando los PNG viejos en su lugar**.
2. Deployar.
3. Correr `backend/sql/18_fotos_produccion_webp.sql` (apunta la base a los WebP).
4. Recién ahí borrar los 45 PNG, en un commit aparte.

Si se borran antes del paso 3, las miniaturas de las órdenes dan 404.

> **Bug preexistente que arregla la migración 18:** la Baby Tee apuntaba en la base
> a `remera-babytee-blanca-front.png` y `-back.png`, que **no existen en disco** (el
> archivo real se llamaba `remera-bbytee-blanca-front.png`, y el `-back` nunca
> existió). O sea que la miniatura de una orden de Baby Tee viene dando 404 desde
> antes de esta sesión.

## Estado actual (antes de la carga)

45 archivos en `public/assets/images/products/`, casi todos 2 por producto
(`-front` / `-back`) más 2 de doblado de jean. Las fotos nuevas **reemplazan** a
estas; las viejas se borran una vez que cada producto tenga material nuevo.

Sobras a limpiar en el camino: `remera-bbytee-navy-front.png` (producto eliminado) y
`jean-negro-bootcut-font.png` (typo de "front" que hoy está referenciado así en
`start.js:144` — funciona, pero se corrige al reemplazarlo).

---

## Video y gráficas (2026-08-20)

### Selvedge — `selvedge-loop.mp4`

Fondo de la sección SELVEDGE DENIM del home. Concatenación de 6 tramos del master
`VIDEO DENIM.mov` (154MB, 1920×1080, 29.97fps, 75.4s), **sin audio**, en loop.

| # | Desde | Hasta | Dura |
|---|-------|-------|------|
| 1 | 00:03 | 00:10 | 7.0s |
| 2 | 00:15 | 00:18 | 3.0s |
| 3 | 00:21 | 00:28 | 7.0s |
| 4 | 00:33 | 00:36 | 3.0s |
| 5 | 00:38,5 | 00:41 | 2.5s |
| 6 | 00:41,5 | 00:45 | 3.5s |

Total 26.0s · 5.7MB · H.264 CRF 27 · `+faststart`. Póster: `selvedge-loop.jpg`.

> **Historial de los cortes.** La primera versión tenía dos tramos más: uno de
> 38–40 y otro de 38,5–45, que **se solapaban** y hacían que 38,5–40 se viera dos
> veces seguidas (salto atrás de 1,5s a los 22s del loop, verificado comparando
> frames: eran idénticos, diferencia 0.52 sobre 255). Naza además marcó dos tramos
> a sacar, referidos al loop de 28,5s: 20–22 (que era el corte de 38–40 entero, así
> que ese corte desapareció) y 24,5–25 (que caía dentro del último corte y lo
> partió en 38,5–41 y 41,5–45). Verificado que ya no quedan frames repetidos: los
> mismos dos puntos que antes eran idénticos ahora dan 46.66 de diferencia.

Regenerar: comando `ffmpeg -filter_complex` con `trim`/`concat`, en la bitácora
del 2026-08-20.

### Archivo — `ss26-film.mp4`

El master completo, 75.4s **con audio** (AAC 128k), 1920×1080 CRF 25, 23MB,
`+faststart`. Reemplazó al placeholder generado con ffmpeg, que se borró.
Referenciado desde `public/js/archive-data.js` (landing y bloque FILM de SS26).

> El peso es el punto a vigilar: son 23MB que viajan en el repo y arrancan solos
> al abrir `/archivo`. Si molesta, las salidas son subirlo a Vercel Blob o
> Supabase Storage, o bajar a 720p.

### Gráficas — bloque entre el video y el footer

`public/assets/images/graficas/grafica-8.webp` y `grafica-15.webp` (3000px de
lado largo, WebP q86, 1.2MB y 619KB). Se subieron de 2000 a 3000px porque ahora
van a ancho completo y en pantalla retina 2000px se quedaba corto. Los PNG originales (17-24MB) quedan en
`public/assets/images/gráficas/`, que está en el `.gitignore` — ojo que el nombre
de esa carpeta lleva acento y por eso **no** se sirve directamente.

Rotan cada 5s con crossfade de 900ms (`initGraficas` en `start.js`). Para sumar o
sacar gráficas alcanza con editar el array `GRAFICAS`.

**Ocupan el contenedor entero sin recorte.** El bloque adopta la relación de
aspecto de la gráfica activa: `ajustarAltoStage()` mide `naturalWidth/Height` y le
pone al stage `alto = ancho / relación`, con una transición de 900ms que corre
junto al crossfade. Así `object-fit: cover` llena exacto sin cortar nada. Antes el
stage tenía alto fijo (100vh) y con `contain` dejaba ~325px de vacío a cada lado.

No se pueden recortar para llenar un alto fijo: son composiciones cerradas — la
`grafica-15` es un díptico con el wordmark en el panel izquierdo, y en la
`grafica-8` el wordmark cruza casi todo el ancho. Subir la resolución tampoco
resuelve el encuadre: el problema es la forma, no los píxeles.
