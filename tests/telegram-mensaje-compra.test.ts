/**
 * EL AVISO DE COMPRA A TELEGRAM.
 *
 * Dos cosas que no pueden fallar en silencio:
 *   1. Datos del cliente con `<` o `&` rompen el HTML de Telegram y la API
 *      rechaza el mensaje ENTERO: la compra entra y nadie se entera.
 *   2. Una variante que queda en 0 tiene que gritarlo, porque la vidriera no
 *      lee el stock de Supabase (decide con `soldOut` en start.js).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    armarMensajeCompra,
    escaparHTML,
    formatearARS,
    type DatosCompra,
} from '../src/lib/telegram/mensaje-compra.ts';

function compra(overrides: Partial<DatosCompra> = {}): DatosCompra {
    return {
        numeroOrden: 72,
        totalCentavos: 9_850_000,
        subtotalCentavos: 9_000_000,
        costoEnvioCentavos: 850_000,
        descuentoCentavos: 0,
        codigoDescuento: null,
        entrega: 'OCA — Envío a domicilio',
        esRetiro: false,
        detalleEntrega: ['Av. Siempreviva 742', 'CABA, Buenos Aires', 'CP 1414'],
        cliente: { nombre: 'Ana Pérez', email: 'ana@example.com', telefono: '11 5555 5555' },
        items: [{
            nombre: 'REMERA GÜIDO OVERSIZED',
            color: 'Negro',
            talle: 'M',
            cantidad: 2,
            precioUnitarioCentavos: 4_500_000,
            sku: 'REM-LOGO-NRO-M',
            stockRestante: 2,
            oneOfOne: false,
        }],
        montoCobradoArs: 98500,
        pagadoAt: '2026-10-05T18:30:00Z',
        ...overrides,
    };
}

describe('mensaje de compra para Telegram', () => {
    test('trae número de orden, total, items, cliente y entrega', () => {
        const m = armarMensajeCompra(compra());
        assert.match(m, /NUEVA COMPRA #72/);
        assert.match(m, /\$98\.500/);
        assert.match(m, /2× <b>REMERA GÜIDO OVERSIZED<\/b> — Negro · talle M — \$90\.000/);
        assert.match(m, /<code>REM-LOGO-NRO-M<\/code> · quedan 2/);
        assert.match(m, /ana@example\.com/);
        assert.match(m, /11 5555 5555/);
        assert.match(m, /Av\. Siempreviva 742/);
        assert.match(m, /Envío \$8\.500/);
    });

    test('la hora va en horario argentino', () => {
        const m = armarMensajeCompra(compra());
        assert.match(m, /Pagada 05\/10.*15:30/);
    });

    test('escapa el HTML de los datos del cliente', () => {
        const m = armarMensajeCompra(compra({
            cliente: { nombre: '<b>Juan</b> & Cía', email: null, telefono: null },
            detalleEntrega: ['Calle <script> 1'],
        }));
        assert.ok(m.includes('&lt;b&gt;Juan&lt;/b&gt; &amp; Cía'));
        assert.ok(m.includes('Calle &lt;script&gt; 1'));
        assert.ok(!m.includes('<script>'));
    });

    test('las únicas etiquetas HTML son las que Telegram acepta', () => {
        const m = armarMensajeCompra(compra({ cliente: { nombre: 'a<x>b', email: null, telefono: null } }));
        const etiquetas = [...m.matchAll(/<\/?([a-z]+)[^>]*>/g)].map(x => x[1]);
        for (const t of etiquetas) assert.ok(['b', 'i', 'code'].includes(t), `etiqueta no soportada: <${t}>`);
    });

    test('una variante en 0 avisa que hay que marcarla vendida en la web', () => {
        const m = armarMensajeCompra(compra({
            items: [{ ...compra().items[0], stockRestante: 0 }],
        }));
        assert.match(m, /SIN STOCK/);
        assert.match(m, /soldOut/);
    });

    test('retiro coordinado: envío sin cargo y la instrucción de coordinar', () => {
        const m = armarMensajeCompra(compra({
            costoEnvioCentavos: 0, esRetiro: true, entrega: 'Retiro coordinado — sin cargo', detalleEntrega: [],
        }));
        assert.match(m, /Envío sin cargo/);
        assert.match(m, /coordinar lugar y horario/);
    });

    test('descuento con código', () => {
        const m = armarMensajeCompra(compra({ descuentoCentavos: 500_000, codigoDescuento: 'AMIGOS' }));
        assert.match(m, /Descuento −\$5\.000 \(AMIGOS\)/);
    });

    test('sin stock legible no inventa una línea de stock', () => {
        const m = armarMensajeCompra(compra({
            items: [{ ...compra().items[0], stockRestante: null, sku: null }],
        }));
        assert.ok(!/quedan/.test(m));
        assert.ok(!/SIN STOCK/.test(m));
    });

    test('helpers', () => {
        assert.equal(escaparHTML('a & <b>'), 'a &amp; &lt;b&gt;');
        assert.equal(formatearARS(12_345_600), '$123.456');
    });
});
