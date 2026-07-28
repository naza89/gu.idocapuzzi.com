/**
 * ARCHIVE DATA — GÜIDO CAPUZZI
 * =============================================================================
 * Fuente de datos de la página Archivo (/archivo).
 *
 * Cada objeto = una "temporada"/colección = una tira de imágenes en el índice
 * y un display vertical→horizontal en el detalle (/archivo?archive=<slug>).
 *
 * CÓMO AGREGAR IMÁGENES REALES
 *   1. Dejá las fotos optimizadas (WebP/AVIF, ~1800px lado mayor) en:
 *        public/assets/images/archive/<slug>/01.webp, 02.webp, ...
 *   2. En la colección, reemplazá cada item por:
 *        { src: 'assets/images/archive/<slug>/01.webp', alt: '...', w: 1200, h: 1600 }
 *      (w/h = dimensiones reales, para reservar layout y evitar saltos)
 *   3. Borrá el flag `placeholder: true` de la colección.
 *
 * Mientras `placeholder: true`, el renderer genera tiles numerados on-brand
 * (no hay que tener las fotos para probar la mecánica).
 *
 * ESCALA A SUPABASE (futuro): este shape mapea 1:1 a
 *   archivo_colecciones (slug, titulo, titulo_sup, orden)
 *   archivo_imagenes    (coleccion_id, src, alt, w, h, orden)
 * =============================================================================
 */
window.ARCHIVE_DATA = [
    {
        slug: 'primavera-verano-2026',
        titulo: 'PRIMAVERA / VERANO',
        tituloSup: '2026',
        placeholder: true,
        // Placeholder: 9 tiles. Reemplazar por objetos {src, alt, w, h}.
        imagenes: [
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 01' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 02' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 03' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 04' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 05' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 06' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 07' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 08' },
            { w: 1200, h: 1600, alt: 'Primavera / Verano 2026 — 09' }
        ]
    },
    {
        slug: 'lookbook-2026',
        titulo: 'LOOKBOOK',
        tituloSup: '2026',
        placeholder: true,
        imagenes: [
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 01' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 02' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 03' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 04' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 05' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 06' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 07' },
            { w: 1200, h: 1600, alt: 'Lookbook 2026 — 08' }
        ]
    }
];
