# SPEC DE VIEWPORTS — Rediseño estético

> Medido en vivo sobre `localhost:3000` (dev server), Chromium, `devicePixelRatio = 1`.
> Todos los valores en **CSS px**. Fecha de medición: 2026-07-28.
> Uso: guía para replicar los viewports en Inkscape y devolver `.svg` como spec de diseño.

---

## 0. Canvas canónicos

| | Ancho ventana | **Ancho de layout (canvas Inkscape)** | Alto |
|-|-|-|-|
| **Desktop** | 1440 | **1425** | 900 |
| **Mobile** | 390 | **390** | 844 |

**Por qué 1425 y no 1440:** en desktop Chrome reserva **15px** para la scrollbar clásica. El layout real se calcula sobre `document.documentElement.clientWidth = 1425`. En mobile la scrollbar es overlay → 0px, el layout es 390 exacto.

**Dibujá el canvas a 1425 de ancho, no a 1440.** Si dibujás a 1440 todo lo que midas va a estar corrido ~15px.

**Alternativa con números redondos (opcional):** si preferís que las cards den enteros, usá canvas **1420**. Ahí la card del Shop da **420px exactos** y la imagen **560px exactos**. La diferencia contra la realidad es 5px y el CSS es fluido, así que no cambia nada. Es mi recomendación si te molesta trabajar con decimales.

### Variables globales del sistema

| Variable | Desktop | Mobile (≤768px) |
|-|-|-|
| `--padding-sides` | **40px** | **20px** |
| `--header-height` | **80px** | **60px** |
| Breakpoint principal | — | **768px** |

Otros breakpoints que existen en `globals.css` y conviene no romper: 1200, 1024, 900, 768, 600.

### Paleta (no inventar tonos)

`#FAFAFA` blanco hueso · `#AD1C1C` rojo GÜIDO · `#442517` marrón selvedge · `#1A1A1A` negro

### Tipografía

- **Univers 67 Condensed Bold** → títulos, nav-titles, nombres de producto, precios PDP, CTAs
- **Univers Regular** → body, descripciones, links de footer, tablas

---

## 1. SHOP — Grid

### Fórmula (el grid es fluido, la card es un valor *derivado*)

```
ancho_card = (ancho_layout − 2 × padding_sides − (n_cols − 1) × gap) / n_cols
```

### Desktop (canvas 1425 × 900)

| Elemento | Valor |
|-|-|
| `.shop-grid` ancho | **1425** (full bleed) |
| Padding lateral | **40** izq / **40** der |
| Ancho útil del grid | **1345** |
| Columnas | **3** |
| Gap entre columnas/filas | **40** |
| **Ancho de card** | **421.67** *(1265 / 3)* — usá **420** si trabajás en canvas 1420 |
| **Alto de imagen de card** | **562.2** — aspect-ratio bloqueado en **3/4** |
| Gap imagen → info | **15** |
| Bloque `.product-info` | 421.67 × **67.4**, centrado, gap interno **5** |
| **Alto total de card** | **644.6** |
| Margin-bottom del grid | **100** |

Tipografía de la card (desktop):

| | Fuente | Tamaño | Letter-spacing |
|-|-|-|-|
| `.product-name` | Univers 67 Cond. Bold, UPPERCASE | **16.8px** (1.05rem) | 0.336 |
| `.product-color` | Univers, UPPERCASE, opacity .8 | **14.4px** (0.9rem) | — |
| `.product-price` | Univers, UPPERCASE | **14.4px** | — |

`.product-price` tiene fondo negro `#1A1A1A` con texto `#FAFAFA`, padding **2px 6px**, line-height 1 → caja de **18.4** de alto.

### Mobile (canvas 390 × 844)

| Elemento | Valor |
|-|-|
| `.shop-grid` ancho | **390** |
| Padding lateral | **20** / **20** |
| Ancho útil | **350** |
| Columnas | **2** |
| Gap | **16** |
| **Ancho de card** | **167** *(exacto)* |
| **Alto de imagen** | **222.7** (3/4) |
| Gap imagen → info | **8** |
| `.product-info` | 167 × **48.4**, gap interno **3** |
| **Alto total de card** | **279.1** |
| Margin-bottom del grid | **60** |

Tipografía mobile: name **12px**, color **10.4px**, price **10.4px**.

### Header del Shop (encima del grid)

| | Desktop | Mobile |
|-|-|-|
| `.shop-header` | 1425 × **158.2**, padding 0 40 | 390 × **134.4**, padding 0 20 |
| Título (`h1`) | **64px** Univers 67 Cond., ls 1.28, line-height 51.2 | **46.8px** (`clamp(2rem, 12vw, 3rem)`), lh 37.4 |

### Dato duro para el rediseño del grid

Hoy el grid muestra **20 cards** que son en realidad **12 productos** con colorways repetidos:

| Producto | Colorways hoy |
|-|-|
| REMERA GÜIDO OVERSIZED | 3 |
| REMERA AFLIGIDA BAGGED TEE | 3 |
| REMERA BABY TEE REGISTRADA | 3 |
| MUSCULOSA DOBLE SIMBOLO OVERSIZED | 2 |
| REMERA MANGA LARGA TERMAL | 2 |
| 7 productos de denim | 1 c/u |

Consolidando colorways: **20 → 12 items**. En 3 columnas eso pasa de **7 filas** (última incompleta, 2 huecos) a **4 filas exactas**. Dibujá el grid con **12 items**, no con 20.

---

## 2. PDP — estado actual (el que vas a reemplazar)

### Desktop (canvas 1425 × 900)

`.pdp-container` es un **grid de 2 columnas: 60% / 40%**.

| Elemento | Valor |
|-|-|
| Contenedor | 1425 de ancho, `min-height: calc(100vh − 80px)` = **820** |
| **Columna izquierda** (`.pdp-visual`) | **855** *(60%)* |
| ├─ Stack de fotos (`.pdp-main-wrap`) | **721** |
| └─ Rail de miniaturas (`.pdp-thumbs-rail`) | **134** — sticky, `top: 80`, alto **820** |
| Miniatura (`.pdp-thumb`) | **120 × 120**, gap **12**, padding-left del rail **14** |
| **Columna derecha** | **570** *(40%)* |
| ├─ `.pdp-top-info` | 570 × **358.4**, padding 0 **40** → contenido **490** |
| └─ `.pdp-bottom-info` | 570 × **265**, padding 0 40 60, **sticky** `top: 100` |
| Imagen principal | **721** de ancho, alto según ratio nativo (medido 1074.7 → ~1:1.49) |
| Padding-top de `#product-page` | `header (80) + 60` = **140** |

Tipografía columna derecha (desktop):

| | Fuente | Tamaño |
|-|-|-|
| `h1` | Univers 67 Cond. | **56px**, ls 1.12 |
| `.pdp-colorway` | Univers 67 Cond. | **19.2px** |
| `.pdp-price` | Univers 67 Cond. | **17.6px** |
| `.pdp-description` | Univers | **15px**, margin-top 24 |
| `.size-guide-trigger` | Univers | **12.8px**, ls 0.512 |
| Botón agregar | Univers 67 Cond. | **19.2px**, caja **490 × 66**, padding 20 |
| `.pdp-selectors` | — | **490 × 87**, gap 20 |

⚠️ **Ojo al dibujar:** `.pdp-top-info` y `.pdp-bottom-info` usan `align-items: center` en flex column. Eso hace que `h1`, `.pdp-colorway` y `.pdp-price` **NO ocupen los 490px** — son *shrink-to-fit* (miden lo que mide su texto; el h1 midió 374.6 con este producto). Solo `.pdp-selectors` y el botón ocupan los 490 completos. Si en el rediseño querés cajas de ancho fijo, hay que sacar ese `align-items: center`.

### Mobile (canvas 390 × 844)

El grid colapsa a **columna única** (aunque `grid-template-columns` siga diciendo 60%/40%, el `flex-direction: column` manda).

| Elemento | Valor |
|-|-|
| Contenedor | 390 de ancho |
| `.pdp-visual` | 390 × **665.3** |
| Imagen | **390** ancho × **581.3** alto (full bleed, sin padding) |
| Rail de miniaturas | **horizontal**, 390 × **84**, padding 12 20 0 |
| Miniatura | **72 × 72** |
| `.pdp-top-info` | 390 × **161**, padding **24 20 12** |
| `.pdp-bottom-info` | 390 × **365**, padding **20 20 40** |
| `h1` | **35px** |
| `.pdp-price` | **15px** |
| `.pdp-selectors` | **350 × 87** |
| Botón agregar | **350 × 52**, padding 0 16 |

---

## 2b. REFERENCIA — PDP de Helmut Lang, medida en vivo

> Medido sobre `helmutlang.com/wardrobe-jeans/Q02DM203_RLD.html`, ventana 1440×900.
> **Su layout mide 1425 igual que el nuestro** (mismo descuento de scrollbar) → las coordenadas se mapean 1:1 al canvas.

### Hecho clave: la PDP de HL es FULL-BLEED, no tiene contenedor

`.product-wrapper` = **1425 de ancho arrancando en x=0**. La galería toca el borde izquierdo. **No hay caja contenedora tipo 1350.** El bloque de info se posiciona por coordenadas propias, no por un container.

| Elemento | x | ancho | y | alto |
|-|-|-|-|-|
| Header | 0 | 1440 | 0 | **109** |
| **Galería (slide)** | **0** | **713** | 109 | **891** |
| Contador `1/8` | 15 | — | 124 | 17 (font 12px) |
| Flecha `‹` (32×32) | 5 | 32 | 538.6 | 32 |
| Flecha `›` (32×32) | 683 | 32 | 538.6 | 32 |
| **Columna de info** | **740** | **345** | — | — |
| ├ Nombre + precio (space-between) | 740 | 345 | 169 | 17 |
| ├ Label "Color: classic blue" | 740 | 345 | 220 | 17 |
| ├ Fila de swatches | 740 | 345 | 251.5 | 15 |
| ├ Label "Size:" + SIZE GUIDE | 740 | 345 | 300.5 | 17 |
| ├ Fila de talles (9 botones) | 740 | 345 | ~320 | 27 |
| ├ **ADD TO BAG** | 740 | **345** | 382 | **34** |
| └ Acordeones | 740 | 345 | 500+ | — |

**Proporciones derivadas:**
- Galería = **exactamente 50%** del ancho de layout (712.5 → renderiza 713).
- Ratio de la galería = **4:5 exacto** (imagen nativa 1800×2250, `object-fit: fill`).
- Separación galería → info = **27px** (713 → 740).
- **Espacio vacío a la derecha = 340px** (info termina en 1085, layout en 1425). La columna NO está centrada en la mitad derecha: está pegada a la galería con un margen derecho enorme. Es intencional y muy HL.
- Flechas: verticalmente **centradas** en la galería (centro 554.6 = centro exacto de 109→1000), inset 5px de cada borde.
- Contador: inset **15px** de la esquina superior izquierda de la imagen.

**Swatches de color (el detalle que confirma la idea del borde):** cada swatch mide **36.4 × 15** y contiene un elemento interno de **34.4 × 13** — es decir, **1px de borde alrededor de un fill**. Separación entre swatches: **15px** (paso de 51.5). O sea: HL ya separa borde de relleno, exactamente lo que hace falta para codificar el color de la estampa en el borde.

**Mecánica:** es un **Swiper** (`swiper-button-prev` / `swiper-button-next`), no un stack con scroll. La página no scrollea (`scrollHeight` = 900 = viewport); el alto de la galería (891) excede el fold y la imagen se recorta abajo.

### HL en MOBILE (medido a 390×844)

Acá **sí aparece un contenedor**, pero solo para el texto — la galería sigue full-bleed.

| Elemento | x | ancho | y | alto |
|-|-|-|-|-|
| Header | 0 | 390 | 0 | **79** |
| **Galería** | **0** | **390** (full-bleed) | 114 | **487.5** |
| Flecha `‹` | 5 | 32 | 341.8 | 32 |
| Flecha `›` | 353 | 32 | 341.8 | 32 |
| **Bloque de info** | **10** | **370** | — | — |
| ├ Nombre + precio | 10 | 370 | 613 | 16 |
| ├ Fila de color + swatches | 10 | 370 | 654 | 47.5 |
| ├ Fila de talles | 10 | 370 | 714 | 76 |
| └ **ADD TO BAG** | 10 | **370** | 815 | **34** |

**Estructura mobile:**
- Galería **full-bleed 390 × 487.5**, mismo ratio **4:5** que desktop. Arranca en y=114 (debajo del header de 79).
- Flechas **32×32**, inset 5px de cada borde, **verticalmente centradas** en la galería (centro 357.8 = centro exacto de 114→601.5).
- Todo el texto y los controles viven en un contenedor de **370** con **márgenes de 10px**.
- Swatches mobile: **44.3 × 15** (más anchos que en desktop), interno 42.3 × 13, gap **10**.
- La página **sí scrollea** en mobile (`scrollHeight` 2611): la columna de info va apilada debajo de la galería, no al costado.

**Offsets verticales desde el borde inferior de la galería** (portables al header de 60px de GÜIDO):

| | Distancia bajo la galería |
|-|-|
| Nombre + precio | **+11.5** |
| Fila de color | **+52.5** |
| Fila de talles | **+112.5** |
| ADD TO BAG | **+213.5** |

⚠️ HL usa **10px** de margen lateral en mobile; GÜIDO usa **`--padding-sides: 20px`** (contenido 350) en Shop y footer. **Recomendación: mantener 20/350** por consistencia con el resto del sitio — la diferencia de 10px no se percibe, pero una PDP con márgenes distintos al resto sí.

### ⚠️ Implicancia de producción para GÜIDO

Las fotos actuales de GÜIDO son **2:3** (medido: 721 × 1074.7 = ratio 1.49). Las de HL son **4:5** (1.25). Con el mismo ancho de 713:

| Ratio | Alto de la galería | ¿Entra en el fold de 900 con header 80? |
|-|-|-|
| **4:5** (HL) | **891** | No — sobra 71px |
| **2:3** (fotos actuales de GÜIDO) | **1069** | No — sobra 249px |

Hay que decidir el ratio **antes** de la sesión de fotos.

---

## 3. GUÍA DE TALLES (overlay)

### Desktop (canvas 1425 × 900)

| Elemento | Valor |
|-|-|
| `.size-guide-overlay` | **1425 × 900** (full viewport), padding **24** |
| `.size-guide-panel` | **780 × 792**, padding **22 40 40** |
| Contenido útil del panel | **700** — medido en hijos: **685** |
| Animación de entrada | `clip-path: inset(...)` |
| `.size-guide-title` | **32px** Univers 67 Cond., ancho 685 |
| `.size-guide-close` | **18 × 24**, font 24px |
| `.size-guide-table` | **685 × 218**, `border-collapse: collapse` |
| Columnas de tabla | **5** → th de **95.9** c/u |
| `th` | **12.8px**, padding **12 6**, alto **41** |
| Filas de body | **4** |
| `.size-guide-diagram` | **264 × 294.4**, margin **34 auto 0** |

### Mobile (canvas 390 × 844)

| Elemento | Valor |
|-|-|
| Overlay | **390 × 844**, padding **24** |
| `.size-guide-panel` | **342 × 759.6**, padding **18 20 30** |
| Contenido útil | **302** |
| Título | **24px** |
| Tabla | **302 × 163** |
| `th` | **10px**, padding **8 3**, ancho **41.2**, alto **30** |
| Diagrama | **200 × 223.1** |

---

## 4. FOOTER

Hay **dos variantes** con la misma estructura y distinta paleta:

- `.home-footer` → fondo `#1A1A1A`, texto `#FAFAFA`
- `.shop-footer` → fondo `#FAFAFA`, texto `#442517`, `border-top: 1px solid rgba(68,37,23,.1)`

### Desktop (canvas 1425)

| Elemento | Valor |
|-|-|
| Raíz | **1425 × 630.7**, `min-height: 65vh` (= 585 en 900 de alto) |
| Padding | **80** top / **40** lados / **15** bottom *(medido; el CSS declara 40 y algo lo pisa)* |
| Ancho de contenido | **1345** |
| Gap entre bloques | **50** |
| `.footer-main-content` | 1345 × **157**, flex row `space-between`, gap 40 |
| `.footer-nav-columns` | **535.8** de ancho, gap **60**, **3 columnas** |
| Anchos de columna | **160.3** / **165.2** / **90.3** *(shrink-to-fit — los define el texto más largo)* |
| `.footer-nav-title` | **20px** Univers 67 Cond., ls 1, margin-bottom **12** |
| Links | **12px** Univers, ls 0.24, alto **17**, gap **8** |
| `.footer-copyright` | margin-top **64**, `p` a **11.2px** (0.7rem), lh 1.6 |
| `.footer-cuit` | **10.4px** (0.65rem), opacity .55 |
| `.footer-logo-container` | margin-top **32** |
| `.footer-logo` | **1345 × 163.8** (`width: 100%`) — reveal por `clip-path: inset(0 100% 0 0)` → `inset(0)` en 900ms |

### Mobile (canvas 390)

| Elemento | Valor |
|-|-|
| Raíz | **390 × 392.5**, padding **40 20 30** |
| Ancho de contenido | **350** |
| Gap entre bloques | **0** (pisado en mobile) |
| Columnas de nav | **apiladas**, cada una **350** de ancho, padding **16 0**, alto **65** |
| `.footer-nav-title` | **16px** |
| Links | **12px**, alto 17 |
| `.footer-copyright` | margin-top **24**, alto 35.8 |
| `.footer-logo` | **350 × 42.6**, margin-top del container **24** |

---

## 5. ARCHIVO (fase posterior — Raf Simons)

Canvas: **1425 × 900** desktop / **390 × 844** mobile.

Diferencia clave: al entrar, **el header desaparece** → el canvas útil es el viewport **completo**, sin el offset de 80/60px y sin `--padding-sides` obligatorio. Es la única página del sitio que se dibuja de borde a borde.

Elementos a definir en el SVG (medidas a decidir por vos):
- Ancho del logo grande centrado y su posición vertical
- Posición y tamaño del link INICIO / HOME debajo
- Bounding box de la zona de dispersión del grid, cantidad de piezas, rango de tamaños (mín/máx), y si pueden solaparse
- Radio de blur en reposo vs. en hover, y duración de la transición

---

## 6. Cómo entregar los SVG

1. **Un archivo por viewport y por pantalla** (ej. `shop-desktop.svg`, `shop-mobile.svg`, `pdp-desktop.svg`, …).
2. Canvas exactamente **1425 × H** o **390 × H**. El alto puede ser mayor que 900/844 si la pantalla scrollea — dejá marcada la línea del fold.
3. Dejá los elementos con **nombres de capa/id descriptivos** (`card`, `product-image`, `footer-nav-col-1`). Los leo del SVG y los mapeo a las clases CSS.
4. Si un valor tiene que ser *fijo* (no fluido), anotalo. Por defecto voy a asumir que todo lo horizontal es fluido y lo vertical es fijo.
