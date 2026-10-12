/**
 * EL PAGO POR TRANSFERENCIA.
 *
 * Tres contratos que el compilador no puede ver:
 *   1. El porcentaje de descuento vive en tres lugares (servidor, start.js,
 *      checkout-payment.js). Si divergen, la web le promete al cliente un monto
 *      y el servidor le cobra otro.
 *   2. El monto lo decide el servidor: el body del checkout sólo trae el id de
 *      la orden.
 *   3. Confirmar una transferencia marca una orden como PAGADA: esa ruta tiene
 *      que exigir el token de backoffice antes de tocar nada.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DESCUENTO_TRANSFERENCIA_PCT,
    ESTADO_ESPERANDO_TRANSFERENCIA,
    METODO_PAGO_TRANSFERENCIA,
    calcularDescuentoTransferencia,
    datosTransferencia,
} from '../src/lib/pagos.ts';
import {
    armarMensajeTransferenciaPendiente,
    type DatosCompra,
} from '../src/lib/telegram/mensaje-compra.ts';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8');

const START_JS = 'public/js/start.js';
const CHECKOUT_PAGO_JS = 'public/js/checkout-payment.js';
const RUTA_CHECKOUT = 'src/app/api/checkout/transferencia/route.ts';
const RUTA_BACKOFFICE = 'src/app/api/ordenes/[id]/transferencia/route.ts';
const RUTA_ORDEN = 'src/app/api/ordenes/[id]/route.ts';
const CRON = 'src/app/api/cron/conciliar-pagos/route.ts';

describe('calcularDescuentoTransferencia', () => {
    test('15% de un jean de $290.000 son $43.500', () => {
        assert.equal(calcularDescuentoTransferencia(29_000_000), 4_350_000);
    });

    test('redondea a pesos enteros', () => {
        // $33.333 × 15% = $4.999,95 → $5.000
        assert.equal(calcularDescuentoTransferencia(3_333_300), 500_000);
        assert.equal(calcularDescuentoTransferencia(3_333_300) % 100, 0);
    });

    test('cero o inválido no descuenta', () => {
        assert.equal(calcularDescuentoTransferencia(0), 0);
        assert.equal(calcularDescuentoTransferencia(-100), 0);
        assert.equal(calcularDescuentoTransferencia(Number.NaN), 0);
    });
});

describe('datosTransferencia — fail-closed', () => {
    const VARS = ['TRANSFERENCIA_ALIAS', 'TRANSFERENCIA_CBU', 'TRANSFERENCIA_TITULAR', 'TRANSFERENCIA_EMAIL_COMPROBANTE'];
    const conEnv = (env: Record<string, string>, fn: () => void) => {
        const antes = Object.fromEntries(VARS.map(v => [v, process.env[v]]));
        for (const v of VARS) delete process.env[v];
        Object.assign(process.env, env);
        try { fn(); } finally {
            for (const v of VARS) {
                if (antes[v] === undefined) delete process.env[v];
                else process.env[v] = antes[v];
            }
        }
    };

    test('sin titular no se ofrece', () => {
        conEnv({ TRANSFERENCIA_ALIAS: 'guido.capuzzi' }, () => assert.equal(datosTransferencia(), null));
    });

    test('sin alias ni CBU no se ofrece', () => {
        conEnv({ TRANSFERENCIA_TITULAR: 'CAPMAT STUDIOS S.R.L.' }, () => assert.equal(datosTransferencia(), null));
    });

    test('con titular y alias se ofrece, y el comprobante va a ventas@ por defecto', () => {
        conEnv({ TRANSFERENCIA_TITULAR: 'CAPMAT STUDIOS S.R.L.', TRANSFERENCIA_ALIAS: 'guido.capuzzi' }, () => {
            const d = datosTransferencia();
            assert.ok(d);
            assert.equal(d.alias, 'guido.capuzzi');
            assert.equal(d.cbu, null);
            assert.equal(d.emailComprobante, 'ventas@guidocapuzzi.com');
        });
    });
});

describe('front y servidor usan el mismo porcentaje y los mismos literales', () => {
    for (const archivo of [START_JS, CHECKOUT_PAGO_JS]) {
        test(`${archivo} declara DESCUENTO_TRANSFERENCIA_PCT = ${DESCUENTO_TRANSFERENCIA_PCT}`, () => {
            assert.match(
                leer(archivo),
                new RegExp(`const DESCUENTO_TRANSFERENCIA_PCT = ${DESCUENTO_TRANSFERENCIA_PCT};`),
                `${archivo} usa otro porcentaje que src/lib/pagos.ts: la web prometería un monto distinto al que se cobra`
            );
        });
    }

    test('start.js usa los mismos literales de método y estado', () => {
        const front = leer(START_JS);
        assert.match(front, new RegExp(`const METODO_PAGO_TRANSFERENCIA = '${METODO_PAGO_TRANSFERENCIA}';`));
        assert.match(front, new RegExp(`const ESTADO_ESPERANDO_TRANSFERENCIA = '${ESTADO_ESPERANDO_TRANSFERENCIA}';`));
    });

    test('checkout-payment.js usa el mismo literal de método', () => {
        assert.match(leer(CHECKOUT_PAGO_JS), new RegExp(`const METODO_TRANSFERENCIA = '${METODO_PAGO_TRANSFERENCIA}';`));
    });
});

describe('el monto lo decide el servidor', () => {
    const ruta = leer(RUTA_CHECKOUT);

    test('el descuento sale de calcularDescuentoTransferencia', () => {
        assert.match(ruta, /calcularDescuentoTransferencia\(subtotalCentavos\)/);
    });

    test('el subtotal sale del catálogo, no del body', () => {
        assert.match(ruta, /productos:producto_id \( precio_centavos \)/);
        assert.doesNotMatch(ruta, /body\.(total|subtotal|descuento|monto)/);
    });

    test('el cambio de estado es atómico sobre el estado de origen', () => {
        assert.match(ruta, /\.in\('estado', ESTADOS_ORIGEN\)/);
    });

    test('una orden con intención de NAVE abierta (pago_pendiente) no puede pasar a transferencia', () => {
        assert.match(ruta, /const ESTADOS_ORIGEN = \['envio_calculado'\];/);
    });
});

describe('confirmar una transferencia exige token de backoffice', () => {
    const ruta = leer(RUTA_BACKOFFICE);

    test('requireAdmin corre antes de cualquier acceso a la base', () => {
        const guard = ruta.indexOf('requireAdmin(request)');
        const base = ruta.indexOf('createAdminClient()');
        assert.ok(guard > 0, 'la ruta no llama a requireAdmin');
        assert.ok(guard < base, 'requireAdmin tiene que correr antes de tocar la base');
    });

    test('sólo confirma órdenes que esperan transferencia', () => {
        assert.match(ruta, /\.eq\('estado', ESTADO_ESPERANDO_TRANSFERENCIA\)/);
    });
});

describe('las transferencias quedan fuera de la conciliación con NAVE', () => {
    test('el cron sólo barre pago_pendiente con intención de NAVE', () => {
        const cron = leer(CRON);
        assert.match(cron, /\.eq\('estado', 'pago_pendiente'\)/);
        assert.match(cron, /\.not\('nave_payment_request_id', 'is', null\)/);
    });

    test('el GET de la orden expone el método de pago a la confirmación', () => {
        assert.match(leer(RUTA_ORDEN), /metodo_pago,/);
    });
});

describe('aviso de transferencia pendiente', () => {
    const datos: DatosCompra = {
        numeroOrden: 80,
        totalCentavos: 25_500_000,
        subtotalCentavos: 29_000_000,
        costoEnvioCentavos: 0,
        descuentoCentavos: 4_350_000,
        codigoDescuento: 'TRANSFERENCIA',
        entrega: 'Retiro coordinado',
        esRetiro: true,
        detalleEntrega: [],
        cliente: { nombre: 'Ana <Pérez>', email: 'ana@example.com', telefono: null },
        items: [{
            nombre: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR',
            color: 'Índigo',
            talle: 'M',
            cantidad: 1,
            precioUnitarioCentavos: 29_000_000,
            sku: 'JEA-IND-REG-M',
            stockRestante: 0,
            oneOfOne: false,
        }],
        montoCobradoArs: null,
        pagadoAt: null,
    };
    const msg = armarMensajeTransferenciaPendiente(datos, 48);

    test('dice cuánto hay que recibir y cómo confirmarla', () => {
        assert.match(msg, /TRANSFERENCIA PENDIENTE #80/);
        assert.match(msg, /A transferir \$255\.000/);
        assert.match(msg, /confirmá la transferencia de la #80/);
    });

    test('avisa si el stock actual no alcanza', () => {
        assert.match(msg, /hay 0<\/b> — no alcanza/);
    });

    test('escapa los datos del cliente', () => {
        assert.match(msg, /Ana &lt;Pérez&gt;/);
    });
});
