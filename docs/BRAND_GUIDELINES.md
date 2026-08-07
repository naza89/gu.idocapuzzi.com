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

- **Helvetica Neue LT Std 77 Bold Condensed** (`HelveticaNeueLTStd-BdCn.otf`, familia CSS `'Helvetica Neue Condensed'`) — Títulos, headings, CTAs, header, marquee, textos condensados
- **Helvetica** (`Helvetica.ttf` 400 + `Helvetica-Bold.ttf` 700, familia CSS `'Helvetica'`) — Body text, descripciones, formularios

Archivos en: `public/assets/fonts/`

Pendiente técnico: convertir `Helvetica.ttf`/`Helvetica-Bold.ttf` a WOFF2 (hoy ~300KB c/u) y verificar licencia web de Monotype antes del lanzamiento.

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
