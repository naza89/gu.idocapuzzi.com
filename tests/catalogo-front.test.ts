/**
 * El extractor del catálogo (`scripts/catalogo-front.mjs`) es el loader del que
 * después va a colgar el ingest del asistente. Si se rompe en silencio,
 * `verificar-catalogo` pasa a verificar nada — el peor modo de falla posible
 * para un chequeo de CI.
 *
 * Estos tests corren SIN base de datos: sólo front, así que también corren en
 * el pipeline sin ninguna credencial.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CATEGORIAS_RESTRINGIDAS,
    TALLES_DEFAULT,
    leerCatalogoDelFront,
    precioStringACentavos,
    skuDeVariante,
    tallesDeProducto,
} from '../scripts/catalogo-front.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const START_JS = path.join(RAIZ, 'public', 'js', 'start.js');

describe('precioStringACentavos', () => {
    test('convierte el formato del catálogo', () => {
        assert.equal(precioStringACentavos('$50.000'), 5_000_000);
        assert.equal(precioStringACentavos('$240.000'), 24_000_000);
        assert.equal(precioStringACentavos('$45.000'), 4_500_000);
    });

    test('tolera espacios y la ausencia del signo', () => {
        assert.equal(precioStringACentavos(' $ 65.000 '), 6_500_000);
        assert.equal(precioStringACentavos('65000'), 6_500_000);
    });

    test('la coma es el decimal argentino', () => {
        assert.equal(precioStringACentavos('$1.234,56'), 123_456);
        assert.equal(precioStringACentavos('$1.234,5'), 123_450);
    });

    test('devuelve null en vez de adivinar cuando no se entiende', () => {
        for (const malo of ['', 'CONSULTAR', '$', null, undefined, 42]) {
            assert.equal(precioStringACentavos(malo as never), null, `"${malo}" debería dar null`);
        }
    });
});

describe('skuDeVariante', () => {
    test('replica exactamente lo que arma el carrito en start.js', () => {
        assert.equal(skuDeVariante('REM-LOGO-NBL', 'XS'), 'REM-LOGO-NBL-XS');
        assert.equal(skuDeVariante('JEA-1/1-SUR', 'M'), 'JEA-1/1-SUR-M');
    });
});

describe('leerCatalogoDelFront', () => {
    test('extrae el catálogo real de start.js', async () => {
        const productos = await leerCatalogoDelFront(START_JS);
        assert.ok(Array.isArray(productos));
        assert.ok(productos.length >= 20, `sólo se extrajeron ${productos.length} productos — el recorte se rompió`);
    });

    test('cada producto trae los campos que el checkout necesita', async () => {
        const productos = await leerCatalogoDelFront(START_JS);
        for (const p of productos) {
            assert.ok(p.slug, `un producto quedó sin slug: ${JSON.stringify(p).slice(0, 120)}`);
            assert.ok(p.sku, `${p.slug} no tiene sku — el carrito mandaría sku:null`);
            assert.ok(p.category, `${p.slug} no tiene categoría`);
            assert.notEqual(precioStringACentavos(p.price), null, `${p.slug} tiene un precio ilegible: ${p.price}`);
        }
    });

    test('los slug y los SKU son únicos', async () => {
        const productos = await leerCatalogoDelFront(START_JS);
        const slugs = productos.map((p) => p.slug);
        const skus = productos.map((p) => p.sku);
        assert.equal(new Set(slugs).size, slugs.length, 'hay slugs repetidos en el catálogo');
        assert.equal(new Set(skus).size, skus.length, 'hay SKU repetidos en el catálogo');
    });

    test('las categorías restringidas siguen existiendo en el catálogo', async () => {
        // Si alguien renombra una categoría y no actualiza CATEGORIAS_RESTRINGIDAS,
        // el teaser deja de aplicarse (o se aplica a nada) sin que nadie se entere.
        const productos = await leerCatalogoDelFront(START_JS);
        const categorias = new Set(productos.map((p) => p.category));
        for (const restringida of CATEGORIAS_RESTRINGIDAS) {
            assert.ok(
                categorias.has(restringida),
                `CATEGORIAS_RESTRINGIDAS nombra "${restringida}", que ya no existe en el catálogo`
            );
        }
    });

    test('TALLES_DEFAULT sigue siendo el mismo en start.js y en el verificador', async () => {
        // Si `TALLES_DEFAULT` cambia en start.js y no acá, el verificador
        // chequearía los talles equivocados y el diff dejaría de valer.
        const { readFile } = await import('node:fs/promises');
        const fuente = await readFile(START_JS, 'utf8');
        const m = fuente.match(/const TALLES_DEFAULT = \[([^\]]+)\]/);
        assert.ok(m, 'no se encontró TALLES_DEFAULT en start.js');
        const enStartJs = m![1].split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean);
        assert.deepEqual(enStartJs, TALLES_DEFAULT, 'TALLES_DEFAULT difiere entre start.js y catalogo-front.mjs');
    });
});

describe('tallesDeProducto', () => {
    test('sin `sizes` declarado, el producto ofrece los cuatro talles', () => {
        assert.deepEqual(tallesDeProducto({}), TALLES_DEFAULT);
        assert.deepEqual(tallesDeProducto({ sizes: [] }), TALLES_DEFAULT, 'un array vacío cae al default');
    });

    test('con `sizes` declarado, ofrece sólo esos', () => {
        assert.deepEqual(tallesDeProducto({ sizes: ['M'] }), ['M']);
        assert.deepEqual(tallesDeProducto({ sizes: ['S', 'M'] }), ['S', 'M']);
    });

    test('respeta el orden canónico XS → S → M → L, no el declarado', () => {
        // Si no, la fila de botones bailaría entre productos.
        assert.deepEqual(tallesDeProducto({ sizes: ['L', 'XS', 'M'] }), ['XS', 'M', 'L']);
    });

    test('ignora talles que no existen en el sistema', () => {
        assert.deepEqual(tallesDeProducto({ sizes: ['M', 'XXL'] }), ['M']);
    });

    test('las 4 piezas 1/1 del catálogo real declaran sólo M', async () => {
        // Regresión del bloqueante del 2026-08-20: existen en la base sólo en M,
        // y la PDP ofrecía S por defecto → crear-orden devolvía 409.
        const productos = await leerCatalogoDelFront(START_JS);
        const unicas = productos.filter((p) => p.category === 'INTERVENCIONES');
        assert.equal(unicas.length, 4, `se esperaban 4 INTERVENCIONES, hay ${unicas.length}`);
        for (const p of unicas) {
            assert.deepEqual(
                tallesDeProducto(p),
                ['M'],
                `${p.slug} volvió a ofrecer talles que no existen en variantes_producto`
            );
        }
    });

    test('ningún producto declara `sizes` vacío o con talles fuera del sistema', async () => {
        const productos = await leerCatalogoDelFront(START_JS);
        for (const p of productos) {
            if (p.sizes === undefined) continue;
            assert.ok(Array.isArray(p.sizes) && p.sizes.length > 0, `${p.slug}: \`sizes\` está declarado pero vacío`);
            for (const t of p.sizes as string[]) {
                assert.ok(TALLES_DEFAULT.includes(t), `${p.slug}: declara el talle "${t}", que no existe`);
            }
        }
    });
});

describe('la PDP no puede ofrecer un talle inexistente', () => {
    test('los botones de talle se generan desde getSizes, no hardcodeados', async () => {
        const { readFile } = await import('node:fs/promises');
        const fuente = await readFile(START_JS, 'utf8');

        // El bug del 2026-08-20 fue exactamente este markup literal.
        assert.ok(
            !/<button class="size-btn active">S<\/button>/.test(fuente),
            'volvió el botón de talle S hardcodeado como activo en la PDP'
        );
        assert.match(fuente, /getSizes\(product\)/, 'la PDP dejó de leer los talles del producto');
        assert.match(fuente, /getDefaultSize\(product\)/, 'la PDP dejó de calcular el talle activo desde el producto');
    });

    test('el talle activo se le pasa a la tabla de talles, sin literal', async () => {
        const { readFile } = await import('node:fs/promises');
        const fuente = await readFile(START_JS, 'utf8');
        assert.ok(
            !/buildSizeGuide\(product, sizeChart, isArchive, 'S'\)/.test(fuente),
            "buildSizeGuide volvió a recibir 'S' hardcodeado como talle fijado"
        );
        assert.match(fuente, /buildSizeGuide\(product, sizeChart, isArchive, sizeActivo\)/);
    });

    test('un talle no disponible no se puede seleccionar ni con un click sintético', async () => {
        const { readFile } = await import('node:fs/promises');
        const fuente = await readFile(START_JS, 'utf8');
        assert.match(
            fuente,
            /if \(btn\.classList\.contains\('size-btn--na'\)\) return;/,
            'se perdió el guard del handler de talle: pointer-events solo no alcanza'
        );
    });
});
