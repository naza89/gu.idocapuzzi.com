/**
 * Extractor del catálogo que ve el CLIENTE.
 *
 * El catálogo del storefront vive como literal JS adentro de
 * `public/js/start.js` (dentro del IIFE, no exportado). Este módulo lo saca de
 * ahí sin ejecutar el archivo entero: recorta el bloque `const products = [...]`
 * por balance de corchetes y lo evalúa aislado en un `vm.Script`, con un
 * contexto vacío. El literal son objetos planos — no hay llamadas ni acceso al
 * DOM adentro — así que el sandbox alcanza y no hace falta un parser de JS.
 *
 * Lo usan `verificar-catalogo.mjs` y, más adelante, el ingest del asistente:
 * es el mismo loader. Por eso vive separado y no embebido en el verificador.
 *
 * ⚠️ Si algún día `start.js` deja de tener `const products = [`, esto falla
 * ruidosamente (throw), nunca en silencio.
 */

import { readFile } from 'node:fs/promises';
import { createContext, Script } from 'node:vm';

/** Talles que la PDP ofrece cuando el producto no declara los suyos. */
export const TALLES_DEFAULT = ['XS', 'S', 'M', 'L'];

/**
 * Talles que la PDP ofrece **realmente** para un producto — espejo de `getSizes`
 * en start.js. Un producto declara `sizes: [...]` cuando no tiene los cuatro
 * (las piezas 1/1, que existen sólo en M).
 *
 * @param {Record<string, unknown>} producto
 * @returns {string[]}
 */
export function tallesDeProducto(producto) {
    const declarados = producto?.sizes;
    const sizes = Array.isArray(declarados) && declarados.length ? declarados : TALLES_DEFAULT;
    return TALLES_DEFAULT.filter((t) => sizes.includes(t));
}

/** Categorías que el Shop muestra como teaser: no se pueden comprar. */
export const CATEGORIAS_RESTRINGIDAS = ['TOPS / MUSCULOSAS', 'BERMUDAS / SHORTS'];

/**
 * Recorta desde `desde` hasta el `]` que cierra el `[` de apertura, contando
 * balance y salteando lo que esté adentro de strings o comentarios.
 */
function recortarArreglo(fuente, desde) {
    let nivel = 0;
    let comilla = null;
    let enComentarioLinea = false;
    let enComentarioBloque = false;

    for (let i = desde; i < fuente.length; i++) {
        const c = fuente[i];
        const siguiente = fuente[i + 1];

        if (enComentarioLinea) {
            if (c === '\n') enComentarioLinea = false;
            continue;
        }
        if (enComentarioBloque) {
            if (c === '*' && siguiente === '/') { enComentarioBloque = false; i++; }
            continue;
        }
        if (comilla) {
            if (c === '\\') { i++; continue; }
            if (c === comilla) comilla = null;
            continue;
        }
        if (c === '/' && siguiente === '/') { enComentarioLinea = true; i++; continue; }
        if (c === '/' && siguiente === '*') { enComentarioBloque = true; i++; continue; }
        if (c === '"' || c === "'" || c === '`') { comilla = c; continue; }
        if (c === '[') nivel++;
        else if (c === ']') {
            nivel--;
            if (nivel === 0) return fuente.slice(desde, i + 1);
        }
    }
    throw new Error('No se encontró el cierre del arreglo del catálogo en start.js');
}

/**
 * Lee `public/js/start.js` y devuelve el arreglo `products` tal cual lo ve el
 * navegador.
 *
 * @param {string} rutaStartJs
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function leerCatalogoDelFront(rutaStartJs) {
    const fuente = await readFile(rutaStartJs, 'utf8');
    const marca = 'const products = [';
    const idx = fuente.indexOf(marca);
    if (idx === -1) {
        throw new Error(`No se encontró "const products = [" en ${rutaStartJs}`);
    }

    const literal = recortarArreglo(fuente, idx + marca.length - 1);
    const script = new Script(`(${literal})`);
    const productos = script.runInContext(createContext(Object.create(null)), { timeout: 5000 });

    if (!Array.isArray(productos) || productos.length === 0) {
        throw new Error('El catálogo extraído de start.js está vacío o no es un arreglo');
    }
    return productos;
}

/**
 * Convierte el precio-string del front (`'$240.000'`) a centavos, para poder
 * compararlo contra `productos.precio_centavos`.
 *
 * El separador de miles argentino es el punto; no hay decimales en el catálogo.
 * Devuelve `null` si el formato no es el esperado — eso ya es un hallazgo.
 *
 * @param {unknown} precio
 * @returns {number | null}
 */
export function precioStringACentavos(precio) {
    if (typeof precio !== 'string') return null;
    const limpio = precio.replace(/[^\d.,]/g, '');
    if (limpio === '') return null;

    // Si hay coma, es el decimal: '240.000,50' → 240000.50
    let entero = limpio;
    let decimales = '00';
    if (limpio.includes(',')) {
        const [ent, dec = ''] = limpio.split(',');
        entero = ent;
        decimales = (dec + '00').slice(0, 2);
    }
    entero = entero.replace(/\./g, '');
    if (!/^\d+$/.test(entero)) return null;

    return Number(entero) * 100 + Number(decimales);
}

/**
 * SKU de variante tal como lo arma el carrito en start.js:
 * `${product.sku}-${size}` (ver start.js, arriba de `sku:` en addToCart).
 *
 * @param {string} skuProducto
 * @param {string} talle
 */
export function skuDeVariante(skuProducto, talle) {
    return `${skuProducto}-${talle}`;
}
