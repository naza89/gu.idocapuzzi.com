#!/usr/bin/env node
/**
 * generar-feed-meta — arma el feed de productos que consume el catálogo de Meta
 * (Commerce Manager), a partir del catálogo que ve el cliente.
 *
 * ── Por qué existe ────────────────────────────────────────────────────────────
 * El formato de anuncio que queremos (Collection Ad con escaparate) no se carga
 * a mano: Meta arma la grilla leyendo un CATÁLOGO, y el catálogo se alimenta de
 * un feed. Este script es ese feed.
 *
 * El catálogo de GÜIDO vive como literal JS dentro de `public/js/start.js`
 * — no en Supabase, que hoy tiene 1 producto contra los 23 del front. Por eso
 * la fuente de verdad acá es `leerCatalogoDelFront`, el mismo loader que usa
 * `verificar-catalogo`.
 *
 * ── Por qué se genera en build y no en una API route ──────────────────────────
 * Una route de Next tendría que leer `public/js/start.js` del filesystem, que en
 * una función serverless de Vercel puede no estar. Y el catálogo sólo cambia
 * cuando cambia `start.js`, o sea en el deploy. Generar un CSV estático en
 * `prebuild` es más simple, lo sirve el CDN y no hay nada que pueda fallar en
 * runtime. Meta le hace fetch programado a la URL.
 *
 * ── Qué NO entra al feed ──────────────────────────────────────────────────────
 * Las CATEGORIAS_RESTRINGIDAS: el Shop las muestra como teaser pero no se pueden
 * comprar. Pautar una prenda sin botón de compra es tirar el presupuesto, así
 * que quedan afuera del catálogo aunque estén en la web.
 *
 * Los `soldOut` sí entran, marcados `out of stock`: Meta los usa para reportar y
 * para re-activarlos solos si vuelven, pero no los muestra en los anuncios.
 *
 * ── Uso ───────────────────────────────────────────────────────────────────────
 *   node scripts/generar-feed-meta.mjs
 *   node scripts/generar-feed-meta.mjs --json
 *
 * Sale en `public/feed-meta.csv` → https://<dominio>/feed-meta.csv
 *
 * El dominio sale de `NEXT_PUBLIC_SITE_URL`; por defecto usa el punycode de
 * güidocapuzzi.com, que es el que hay que verificar en Meta Business Manager.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    CATEGORIAS_RESTRINGIDAS,
    leerCatalogoDelFront,
    precioStringACentavos,
} from './catalogo-front.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START_JS = path.join(RAIZ, 'public', 'js', 'start.js');
const SALIDA = path.join(RAIZ, 'public', 'feed-meta.csv');

/**
 * Dominio de la tienda en punycode. `güidocapuzzi.com` es un IDN: el unicode
 * anda en el browser, pero para Meta (verificación de dominio, fetch del feed,
 * matcheo de links) conviene el ASCII, que es el mismo dominio sin ambigüedad.
 */
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xn--gidocapuzzi-thb.com')
    .replace(/\/+$/, '');

const MARCA = 'GÜIDO CAPUZZI';
const JSON_MODE = process.argv.includes('--json');
const log = (...args) => { if (!JSON_MODE) console.log(...args); };

/** Columnas del feed, en el orden en que Meta las espera leer. */
const COLUMNAS = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'additional_image_link',
    'brand',
    'product_type',
    'custom_label_0',
];

/** Escapa un campo para CSV: comillas dobles duplicadas, y entrecomillado si hace falta. */
function campoCSV(valor) {
    const texto = String(valor ?? '');
    return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** `assets/images/...` → URL absoluta. Meta rechaza las relativas. */
function urlAbsoluta(ruta) {
    return `${BASE}/${String(ruta).replace(/^\/+/, '')}`;
}

/**
 * Título del item. Varios productos comparten `name` y sólo los distingue el
 * color (las tres REMERA GÜIDO OVERSIZED, por ejemplo). En el feed son items
 * separados, así que el color va en el título o quedan indistinguibles en la
 * grilla del anuncio.
 */
function tituloDe(producto) {
    const base = producto.title || producto.name || '';
    const variante = producto.colorway || producto.color || '';
    if (!variante) return base;
    // Si el nombre ya lo dice, no lo repetimos.
    if (base.toUpperCase().includes(String(variante).toUpperCase())) return base;
    return `${base} — ${variante}`;
}

const productos = await leerCatalogoDelFront(START_JS);
log(`Catálogo del front: ${productos.length} productos leídos de public/js/start.js\n`);

const filas = [];
const excluidos = [];
const avisos = [];

for (const producto of productos) {
    const { slug, category } = producto;

    if (CATEGORIAS_RESTRINGIDAS.includes(category)) {
        excluidos.push({ slug, motivo: `categoría no comprable (${category})` });
        continue;
    }

    const centavos = precioStringACentavos(producto.price);
    if (centavos === null) {
        excluidos.push({ slug, motivo: `precio ilegible (${producto.price})` });
        continue;
    }

    const imagenes = Array.isArray(producto.images) ? producto.images : [];
    if (imagenes.length === 0) {
        excluidos.push({ slug, motivo: 'sin imágenes' });
        continue;
    }

    const descripcion = producto.description || tituloDe(producto);
    if (!producto.description) {
        avisos.push(`${slug}: sin description, se usa el título`);
    }

    filas.push({
        id: slug,
        title: tituloDe(producto),
        description: descripcion,
        availability: producto.soldOut ? 'out of stock' : 'in stock',
        condition: 'new',
        // Meta espera el monto con punto decimal y la moneda ISO.
        price: `${(centavos / 100).toFixed(2)} ARS`,
        link: `${BASE}/shop/${slug}`,
        image_link: urlAbsoluta(imagenes[0]),
        // Meta admite hasta 20 imágenes adicionales, separadas por coma.
        additional_image_link: imagenes.slice(1, 21).map(urlAbsoluta).join(','),
        brand: MARCA,
        product_type: category || '',
        // custom_label_0 permite armar conjuntos de productos en Meta sin tocar
        // el feed: una campaña sólo de JEANS, otra sólo de REMERAS.
        custom_label_0: category || '',
    });
}

const csv = [
    COLUMNAS.join(','),
    ...filas.map((fila) => COLUMNAS.map((col) => campoCSV(fila[col])).join(',')),
].join('\n') + '\n';

await writeFile(SALIDA, csv, 'utf8');

const enStock = filas.filter((f) => f.availability === 'in stock').length;

if (JSON_MODE) {
    console.log(JSON.stringify({
        salida: path.relative(RAIZ, SALIDA),
        base: BASE,
        total: filas.length,
        en_stock: enStock,
        sin_stock: filas.length - enStock,
        excluidos,
        avisos,
    }, null, 2));
} else {
    log(`Feed escrito en ${path.relative(RAIZ, SALIDA)}`);
    log(`  URL para Meta: ${BASE}/feed-meta.csv\n`);
    log(`  ${filas.length} items — ${enStock} in stock, ${filas.length - enStock} out of stock`);

    if (excluidos.length) {
        log(`\n  ${excluidos.length} excluidos del catálogo:`);
        for (const e of excluidos) log(`    · ${e.slug} — ${e.motivo}`);
    }
    if (avisos.length) {
        log(`\n  Avisos:`);
        for (const a of avisos) log(`    · ${a}`);
    }
}
