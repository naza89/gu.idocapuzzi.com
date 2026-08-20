/**
 * procesar-fotos.mjs — convierte las fotos del shoot a WebP para el catálogo.
 *
 * Lee public/assets/images/fotoproducto/<PREFIJO>/<PREFIJO>_<n>.jpg y escribe
 * public/assets/images/products/<slug>-<n>.webp (1800px de lado largo, q82).
 *
 * Uso:
 *   node scripts/procesar-fotos.mjs             # todas las carpetas con fotos
 *   node scripts/procesar-fotos.mjs BABYTEE_NEGRO TERMAL_BLANCO
 *
 * La convención de nombres y el mapeo prefijo→producto están documentados en
 * docs/internal/FOTOS_PRODUCTO_NOMBRES.md. Los originales no se commitean.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const IN = 'public/assets/images/fotoproducto';
const OUT = 'public/assets/images/products';
const LADO_LARGO = 1800;
const CALIDAD = 82;

/** Prefijo de carpeta → slug del producto en public/js/start.js */
const PRODUCTOS = {
    REMERA_LOGO_NEGRO: 'remera-guido-negro',
    REMERA_LOGO_ROJO: 'remera-guido-rojo',
    REMERA_LOGO_BLANCO: 'remera-guido-blanco',
    REMERA_AFLIGIDA_NEGRO: 'remera-afligida-negro',
    REMERA_AFLIGIDA_NAVY: 'remera-afligida-navy',
    REMERA_AFLIGIDA_BLANCO: 'remera-afligida-blanco',
    BABYTEE_NEGRO: 'baby-tee-negro',
    BABYTEE_BLANCO: 'baby-tee-blanco',
    TERMAL_NEGRO: 'termal-negro',
    TERMAL_BLANCO: 'termal-blanco',
    MUSCULOSA_NEGRO: 'musculosa-negra',
    MUSCULOSA_BLANCO: 'musculosa-blanca',
    JEAN_INDIGO_SUELTO: 'jean-selvedge-suelto-indigo',
    JEAN_INDIGO_REGULAR: 'jean-selvedge-regular-indigo',
    JEAN_NEGRO_REGULAR: 'jean-selvedge-regular-negro',
    BERMUDA_DK_NEGRO: 'bermuda-double-knee-negro',
    BERMUDA_PATCHWORK: 'bermuda-patchwork-indigo',
    INTERV_WILDCAT: 'jean-pintor-wildcat',
    INTERV_FAJA: 'jean-pintor-faja',
    INTERV_ENCERADO: 'jean-encerado',
    INTERV_CAMO: 'bermuda-camo-woodland',
};

const pedidos = process.argv.slice(2);
const carpetas = (pedidos.length ? pedidos : Object.keys(PRODUCTOS)).filter(p => {
    if (!PRODUCTOS[p]) { console.error(`✖ prefijo desconocido: ${p}`); process.exitCode = 1; return false; }
    return fs.existsSync(path.join(IN, p));
});

const avisos = [];
const resultado = {};

for (const carpeta of carpetas) {
    const slug = PRODUCTOS[carpeta];
    const dir = path.join(IN, carpeta);
    const todos = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile());

    // Sólo los que respetan PREFIJO_<n>.<ext>. El resto se reporta y se saltea:
    // renombrar por adivinanza es peor que dejarlo afuera.
    const rx = new RegExp(`^${carpeta}_(\\d+)\\.(jpe?g|png|tiff?|webp)$`, 'i');
    const validos = [];
    for (const f of todos) {
        const m = f.match(rx);
        if (m) validos.push({ f, n: Number(m[1]) });
        else avisos.push(`${carpeta}/${f} — nombre fuera de convención, NO se procesó`);
    }
    if (!validos.length) continue;
    validos.sort((a, b) => a.n - b.n);

    const salidas = [];
    for (const { f, n } of validos) {
        const src = path.join(dir, f);
        const dst = path.join(OUT, `${slug}-${n}.webp`);
        const meta = await sharp(src).metadata();
        await sharp(src)
            .rotate() // respeta el EXIF de orientación
            .resize({ width: LADO_LARGO, height: LADO_LARGO, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: CALIDAD })
            .toFile(dst);
        const kb = (fs.statSync(dst).size / 1024).toFixed(0);
        const apaisada = meta.width > meta.height;
        if (apaisada && n <= 2) {
            avisos.push(`${carpeta}_${n} es APAISADA y está en posición ${n} (portada/hover del Shop): pierde 46.7% del ancho`);
        }
        console.log(`  ${f.padEnd(30)} → ${path.basename(dst).padEnd(30)} ${meta.width}x${meta.height}${apaisada ? ' (apaisada)' : ''}  ${kb}KB`);
        salidas.push(`assets/images/products/${slug}-${n}.webp`);
    }
    resultado[slug] = salidas;
    console.log(`✔ ${carpeta} → ${slug}  (${salidas.length} fotos)\n`);
}

console.log('\n─── images[] para public/js/start.js ───\n');
for (const [slug, imgs] of Object.entries(resultado)) {
    console.log(`${slug}:\n  images: [${imgs.map(i => `'${i}'`).join(', ')}]\n`);
}
if (avisos.length) {
    console.log('─── avisos ───');
    for (const a of avisos) console.log(`  ⚠ ${a}`);
}
