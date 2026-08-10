# GÜIDO CAPUZZI — Brand Guidelines

## Paleta cromática

| Color | Hex | Uso |
|-------|-----|-----|
| Blanco hueso | `#FAFAFA` | Fondo principal, textos sobre oscuro |
| Rojo Güido | `#AD1C1C` | Acento principal, CTAs, campaña |
| Marrón selvedge | `#442517` | Sección denim, detalles cálidos |
| Negro profundo | `#1A1A1A` | Fondo header/footer, textos principales |

## Tipografía

> **Cambio de marca (2026-08-06):** la tipografía pasó de Univers a **Helvetica**.
> Motivo: Univers Condensed Bold, por debajo de ~14px, cerraba las contraformas y
> dejaba de leerse como la misma tipografía (hinting pobre del TTF). Helvetica Neue
> LT Std 77 Bold Condensed es la posición equivalente (67 ↔ 77) y resuelve limpio
> en todos los cuerpos. Los `.ttf` de Univers quedan en `public/assets/fonts/` como
> archivo histórico — no usar en UI nueva.

- **Helvetica Neue LT Std 77 Bold Condensed** (`HelveticaNeueLTStd-BdCn.woff2`, familia CSS `'Helvetica Neue Condensed'`) — Títulos, headings, CTAs, header, marquee, descripciones de PDP
- **Helvetica Neue Roman / Bold** (`HelveticaNeue-Roman.woff2` 400 + `HelveticaNeue-Bold.woff2` 700, familia CSS `'Helvetica'`) — Body text, formularios, tablas

Archivos en: `public/assets/fonts/`

> **2026-08-07:** la secundaria pasó de la Helvetica genérica de Monotype a
> **Helvetica Neue Roman/Bold**, que es la posición equivalente de la misma familia
> que la 77 Bold Condensed. Las tres caras se sirven en **WOFF2**: 615→201KB (Roman),
> 595→195KB (Bold), 28→15KB (Condensed). El nombre de familia en CSS sigue siendo
> `'Helvetica'` para no reescribir ~100 declaraciones; lo que cambió es el archivo.
> Los `.ttf`/`.otf` viejos quedan en la carpeta como archivo histórico, sin servirse.

⚠️ **Pendiente bloqueante para el lanzamiento:** verificar la **licencia de web embedding**
de Helvetica Neue con Monotype. Los `.otf` vienen de una descarga suelta; convertirlos a
WOFF2 y servirlos desde el dominio es exactamente el uso que requiere licencia.

## Assets de marca

Regenerados en Helvetica (2026-08-06):

- `public/assets/brand/logo-guido-negro.svg` — Logo negro (para fondos claros)
- `public/assets/brand/logo-guido-blanco.svg` — Logo blanco (para fondos oscuros, header)
- `public/assets/brand/logo-guido-registrado.svg` — Logo con ® (footer)
- `public/assets/brand/logo-teaser.svg` — Teaser

## Tono de voz

- Directo, minimalista, sin exceso de adjetivos
- Sin emojis en la UI
- En español argentino
- La marca se escribe siempre **GÜIDO CAPUZZI** (con mayúsculas y diéresis)

## Reglas para agentes de IA

- **No modificar CSS ni estilos** sin aprobación explícita de Naza
- Respetar la paleta de colores estrictamente — no inventar tonos
- Las fuentes ya están cargadas vía `@font-face` en `globals.css`
- Las imágenes de producto siguen el patrón: `[tipo]-[modelo]-[color]-[vista].png`
  - Vistas: `front`, `back`, `fold`
- Todo cambio estético debe ser revisado visualmente antes de commitear
