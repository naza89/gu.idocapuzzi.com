/*
 * ARCHIVO — datos de la experiencia /archivo
 * ==========================================
 *
 * Reemplaza al índice de tiras contact-sheet (2026-07-10). La estructura nueva
 * replica la de rafsimons.com: una landing con el fashion film y un grid disperso
 * de fotos, un menú drawer, y una página por colección con LOOKS / DETALLES / FILM.
 *
 * CÓMO CARGAR EL MATERIAL REAL
 * ----------------------------
 * 1. Dejar los archivos en:
 *      public/assets/images/archive/<slug>/looks/01.webp, 02.webp, ...
 *      public/assets/images/archive/<slug>/detalles/01.webp, ...
 *      public/assets/video/<slug>-film.mp4  (+ .jpg del poster)
 * 2. Poner el `src` de cada imagen acá abajo. Sin `src`, se dibuja un placeholder
 *    numerado on-brand (ver `archivePlaceholderSrc` en start.js).
 * 3. `w`/`h` son las dimensiones naturales — evitan el salto de layout al cargar.
 *
 * El fashion film de hoy es un placeholder generado (negro con grano, 1.85:1).
 * Cuando llegue el material de Fini, reemplazar el archivo y listo.
 */

// ---------------------------------------------------------------------------
// LANDING (/archivo)
// ---------------------------------------------------------------------------
// Las posiciones del grid salen medidas de `archivo_grid.svg` (canvas 1920×868.7)
// y están expresadas en % del viewport, así escalan solas. Las que tocan un borde
// lo hacen a propósito: la foto se ve cortada por el viewport, como en la referencia.
window.ARCHIVE_LANDING = {
    film: {
        src: 'assets/video/archivo-film-placeholder.mp4',
        poster: 'assets/video/archivo-film-placeholder.jpg',
        // Caja final tras el decrecimiento radial (medida del SVG: 777.7×416.2 px
        // sobre 1920×868.7 → 40.5% del ancho, ratio 1.85:1 = cinema flat).
        width: 40.51,
        ratio: 1.868
    },
    // x/y/w/h en % del viewport. `src` vacío → placeholder numerado.
    grid: [
        { id: 'g1', x: 78.12, y: 25.43, w: 11.14, h: 37.54, src: '', alt: '' },
        { id: 'g2', x: 89.27, y: 75.42, w: 7.64, h: 24.58, src: '', alt: '' },
        { id: 'g3', x: 3.66, y: 73.96, w: 11.14, h: 26.04, src: '', alt: '' },
        { id: 'g4', x: 8.58, y: 7.28, w: 11.14, h: 37.54, src: '', alt: '' },
        { id: 'g5', x: 71.96, y: 0, w: 11.14, h: 7.67, src: '', alt: '' }
    ]
};

// ---------------------------------------------------------------------------
// COLECCIONES (/archivo/colecciones/<slug>)
// ---------------------------------------------------------------------------
window.ARCHIVE_DATA = [
    {
        slug: 'ss26',
        titulo: 'SS26',
        // Nombre largo para el <title> del documento.
        tituloLargo: 'PRIMAVERA/VERANO 2026',
        // Hero full-viewport. Puede ser video (src) o imagen fija (poster sin src).
        hero: {
            src: '',
            poster: '',
            alt: 'GÜIDO CAPUZZI — Primavera/Verano 2026'
        },
        looks: [
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 },
            { src: '', alt: '', w: 1200, h: 1500 }
        ],
        // Los detalles van en tiles más apaisadas (macro de avíos, costuras, etiquetas).
        detalles: [
            { src: '', alt: '', w: 1500, h: 1200 },
            { src: '', alt: '', w: 1500, h: 1200 },
            { src: '', alt: '', w: 1500, h: 1200 },
            { src: '', alt: '', w: 1500, h: 1200 },
            { src: '', alt: '', w: 1500, h: 1200 },
            { src: '', alt: '', w: 1500, h: 1200 }
        ],
        film: {
            src: 'assets/video/archivo-film-placeholder.mp4',
            poster: 'assets/video/archivo-film-placeholder.jpg'
        }
    }
];
