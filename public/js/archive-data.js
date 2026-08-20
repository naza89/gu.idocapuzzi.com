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
        src: 'assets/video/ss26-film.mp4',
        poster: 'assets/video/ss26-film.jpg',
        // Caja final tras el decrecimiento radial (medida del SVG: 777.7×416.2 px
        // sobre 1920×868.7 → 40.5% del ancho, ratio 1.85:1 = cinema flat).
        width: 40.51,
        ratio: 1.868
    },
    // x/y/w/h en % del viewport. `src` vacío → placeholder numerado.
    grid: [
        { id: 'g1', x: 78.12, y: 25.43, w: 11.14, h: 37.54, src: 'assets/images/archive/ss26/looks/01.webp', alt: '' },
        { id: 'g2', x: 89.27, y: 75.42, w: 7.64, h: 24.58, src: 'assets/images/archive/ss26/looks/02.webp', alt: '' },
        { id: 'g3', x: 3.66, y: 73.96, w: 11.14, h: 26.04, src: 'assets/images/archive/ss26/looks/03.webp', alt: '' },
        { id: 'g4', x: 8.58, y: 7.28, w: 11.14, h: 37.54, src: 'assets/images/archive/ss26/looks/04.webp', alt: '' },
        { id: 'g5', x: 71.96, y: 0, w: 11.14, h: 7.67, src: 'assets/images/archive/ss26/looks/05.webp', alt: '' }
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
            poster: 'assets/images/graficas/grafica-17.webp',
            alt: 'GÜIDO CAPUZZI — Primavera/Verano 2026'
        },
        looks: [
            { src: 'assets/images/archive/ss26/looks/01.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/02.webp', alt: '', w: 934, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/03.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/04.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/05.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/06.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/07.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/08.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/09.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/10.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/11.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/12.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/13.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/14.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/15.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/16.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/17.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/18.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/19.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/20.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/21.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/22.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/23.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/24.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/25.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/26.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/27.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/28.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/29.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/30.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/31.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/32.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/33.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/34.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/35.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/36.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/37.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/38.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/39.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/40.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/41.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/42.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/43.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/44.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/45.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/46.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/47.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/48.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/49.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/50.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/51.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/52.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/53.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/54.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/55.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/56.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/57.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/58.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/59.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/60.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/61.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/62.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/63.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/64.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/65.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/66.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/67.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/68.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/69.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/70.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/71.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/72.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/73.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/74.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/75.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/76.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/77.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/78.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/79.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/80.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/81.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/82.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/83.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/84.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/85.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/86.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/87.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/88.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/89.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/90.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/91.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/92.webp', alt: '', w: 933, h: 1400 },
            { src: 'assets/images/archive/ss26/looks/93.webp', alt: '', w: 934, h: 1400 }
        ],
        // Los detalles van en tiles más apaisadas (macro de avíos, costuras, etiquetas).
        detalles: [
            { src: 'assets/images/archive/ss26/detalles/01.webp', alt: '', w: 1400, h: 933 },
            { src: 'assets/images/archive/ss26/detalles/02.webp', alt: '', w: 1400, h: 933 }
        ],
        film: {
            src: 'assets/video/ss26-film.mp4',
            poster: 'assets/video/ss26-film.jpg'
        }
    }
];
