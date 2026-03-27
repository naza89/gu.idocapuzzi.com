# GÜIDO CAPUZZI — Brand Guidelines

## Paleta cromática

| Color | Hex | Uso |
|-------|-----|-----|
| Blanco hueso | `#FAFAFA` | Fondo principal, textos sobre oscuro |
| Rojo Güido | `#AD1C1C` | Acento principal, CTAs, campaña |
| Marrón selvedge | `#442517` | Sección denim, detalles cálidos |
| Negro profundo | `#1A1A1A` | Fondo header/footer, textos principales |

## Tipografía

- **Univers 67 Condensed Bold** (`UniversCnBold.ttf`) — Títulos, headings, CTAs, textos condensados
- **Univers Regular** (`UniversRegular.ttf`) — Body text, descripciones, formularios

Archivos en: `public/assets/fonts/`

## Assets de marca

- `public/assets/brand/logo-guido-negro.svg` — Logo negro (para fondos claros)
- `public/assets/brand/logo-guido-blanco.svg` — Logo blanco (para fondos oscuros, header)
- `public/assets/brand/logo-guido-footer.svg` — Logo footer
- `public/assets/brand/logo-guido-footer-negro.svg` — Logo footer variante negra

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
