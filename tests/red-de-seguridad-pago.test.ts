/**
 * LA RED DE SEGURIDAD DEL PAGO.
 *
 * El 2026-08-21, en el E2E, NAVE cobró la orden 63 y **nunca llamó al webhook**:
 * tenían dada de alta la URL del apex (`xn--gidocapuzzi-thb.com`), que
 * 307-redirecciona a `www`, y los emisores de webhooks no siguen redirects en
 * POST. La orden quedó en `pago_pendiente`, sin mail, sin envío y sin stock
 * descontado.
 *
 * Existía una red de seguridad en el GET de `/api/ordenes/[id]`, pero tenía una
 * dependencia circular: exigía `nave_payment_id`, que **lo setea el webhook**.
 * O sea que no podía cubrir el caso "el webhook nunca llegó", que es
 * exactamente para lo que se había escrito. Corrió 7 veces y las 7 fueron
 * no-ops.
 *
 * El fix: usar `nave_payment_request_id` (que sí tenemos desde `crear-pago`)
 * contra `GET /api/payment_requests/{id}`.
 *
 * Estos tests corren SIN red y SIN credenciales: cubren el parseo del estado
 * (la parte frágil, porque los docs de NAVE no traen un ejemplo del payload) y
 * la estructura del guard en la ruta.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerEstadoIntencion } from '../src/lib/nave/client.ts';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8');

const RUTA_ORDEN = 'src/app/api/ordenes/[id]/route.ts';

describe('extraerEstadoIntencion — parseo defensivo del estado', () => {
    test('lee status como string plano (la forma documentada)', () => {
        assert.equal(extraerEstadoIntencion({ status: 'SUCCESS_PROCESSED' }), 'SUCCESS_PROCESSED');
    });

    test('lee status.name, que es la forma que usa el endpoint de pagos', () => {
        assert.equal(extraerEstadoIntencion({ status: { name: 'PENDING' } }), 'PENDING');
    });

    test('lee state como tercera variante', () => {
        assert.equal(extraerEstadoIntencion({ state: 'EXPIRED' }), 'EXPIRED');
    });

    test('devuelve null si no puede determinar el estado', () => {
        // Devolver null y NO un string es lo que hace que el llamador falle
        // cerrado. Si esto devolviera '' o 'UNKNOWN', una comparación mal
        // escrita podría marcar una orden como pagada sin estarlo.
        assert.equal(extraerEstadoIntencion({}), null);
        assert.equal(extraerEstadoIntencion({ status: {} }), null);
        assert.equal(extraerEstadoIntencion({ status: { name: 123 } as never }), null);
        assert.equal(extraerEstadoIntencion({ status: 42 as never }), null);
    });

    test('null nunca puede confundirse con el estado de éxito', () => {
        assert.notEqual(extraerEstadoIntencion({}), 'SUCCESS_PROCESSED');
    });
});

describe('la red de seguridad puede correr sin el webhook', () => {
    const codigo = leer(RUTA_ORDEN);

    test('existe la rama que verifica por nave_payment_request_id', () => {
        // El bug original: la única rama de verificación exigía nave_payment_id,
        // que lo setea el webhook. Si esta rama desaparece, vuelve el agujero.
        assert.match(
            codigo,
            /nave_payment_request_id/,
            'la ruta ya no consulta nave_payment_request_id: la red vuelve a depender del webhook'
        );
        assert.match(
            codigo,
            /verifyPaymentRequestStatus/,
            'la ruta ya no llama a verifyPaymentRequestStatus'
        );
    });

    test('sólo reconcilia con SUCCESS_PROCESSED', () => {
        assert.match(
            codigo,
            /===\s*'SUCCESS_PROCESSED'/,
            'la comparación con SUCCESS_PROCESSED tiene que ser estricta'
        );
    });

    test('no marca pagada una orden con estado indeterminado', () => {
        // Fail-closed: el bloque tiene que contemplar explícitamente el null.
        assert.match(
            codigo,
            /estadoIntencion === null/,
            'falta el guard de estado indeterminado: la red podría marcar pagado a ciegas'
        );
    });

    test('la rama sin webhook no dispara el envío de OCA', () => {
        // Decisión de Naza (2026-08-21): reconciliar por esta vía no debe generar
        // un despacho real en ePak. El envío lo crea sólo el webhook.
        assert.doesNotMatch(
            codigo,
            /crearEnvioOCA/,
            'el GET de la orden no debe crear envíos OCA: genera un despacho real'
        );
    });
});
