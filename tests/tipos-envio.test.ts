/**
 * EL CONTRATO DE `ordenes.tipo_envio`.
 *
 * La columna es TEXT libre — no hay CHECK en la tabla — así que los literales
 * son el único contrato entre el front y el servidor. Y el front
 * (`public/js/start.js`) es vanilla JS dentro de un IIFE: no puede importar de
 * `src/`, así que **el compilador no puede detectar una divergencia**. La
 * detecta esto.
 *
 * Si el front escribiera `'retiro'` y el servidor comparara contra
 * `'retiro_local'`, el guard del webhook no se activaría y OCA generaría una
 * etiqueta real para una compra que se entrega en mano.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    TIPO_ENVIO_DOMICILIO,
    TIPO_ENVIO_SUCURSAL,
    TIPO_ENVIO_RETIRO,
    etiquetaTipoEnvio,
    esRetiroEnMano,
} from '../src/lib/envios.ts';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8');

const START_JS = 'public/js/start.js';
const WEBHOOK_NAVE = 'src/app/api/webhooks/nave/route.ts';
const RUTA_ORDEN = 'src/app/api/ordenes/[id]/route.ts';

describe('front y servidor usan los mismos literales', () => {
    const front = leer(START_JS);

    test('start.js declara el mapa TIPOS_ENVIO', () => {
        assert.match(front, /const TIPOS_ENVIO = \{/);
    });

    test('los tres literales del servidor aparecen en start.js', () => {
        for (const literal of [TIPO_ENVIO_DOMICILIO, TIPO_ENVIO_SUCURSAL, TIPO_ENVIO_RETIRO]) {
            assert.match(
                front,
                new RegExp(`'${literal}'`),
                `start.js no usa el literal '${literal}' que declara src/lib/envios.ts`
            );
        }
    });

    test('start.js ya no arma el tipo con un ternario de dos ramas', () => {
        // El bug original: `value === 'domicilio' ? 'puerta_puerta' : 'sucursal'`.
        // Un tercer valor caía en la rama 'sucursal' y la orden mentía.
        assert.doesNotMatch(
            front,
            /=== 'domicilio' \? 'puerta_puerta' : 'sucursal'/,
            'volvió el ternario de dos ramas: un tercer tipo de envío se guardaría como sucursal'
        );
    });
});

describe('el retiro no puede despachar un envío real', () => {
    test('el webhook de NAVE saltea OCA cuando es retiro', () => {
        const codigo = leer(WEBHOOK_NAVE);
        assert.match(
            codigo,
            /TIPO_ENVIO_RETIRO/,
            'el webhook no contempla el retiro: OCA emitiría una etiqueta real'
        );
        // El guard tiene que estar ANTES de la llamada a crearEnvioOCA.
        const posGuard = codigo.indexOf('TIPO_ENVIO_RETIRO');
        const posOca = codigo.indexOf('crearEnvioOCA(externalPaymentId');
        assert.ok(posGuard !== -1 && posOca !== -1, 'faltan el guard o la llamada a OCA');
        assert.ok(
            posGuard < posOca,
            'el guard de retiro tiene que evaluarse antes de crear el envío en OCA'
        );
    });
});

describe('precio_envio: sólo el retiro vale cero', () => {
    const codigo = leer(RUTA_ORDEN);

    test('rechaza un retiro con costo', () => {
        assert.match(codigo, /TIPO_ENVIO_RETIRO && precioEnvioNum !== 0/);
    });

    test('rechaza un envío de OCA en cero', () => {
        // Sin esto, cualquiera manda precio_envio: 0 con tipo puerta_puerta y se
        // lleva el envío gratis mientras a OCA hay que pagarle igual.
        assert.match(codigo, /!== TIPO_ENVIO_RETIRO && precioEnvioNum === 0/);
    });
});

describe('etiquetaTipoEnvio', () => {
    test('cada tipo tiene su etiqueta', () => {
        assert.match(etiquetaTipoEnvio(TIPO_ENVIO_RETIRO), /Retiro coordinado/);
        assert.match(etiquetaTipoEnvio(TIPO_ENVIO_SUCURSAL), /sucursal/i);
        assert.match(etiquetaTipoEnvio(TIPO_ENVIO_DOMICILIO), /domicilio/i);
    });

    test('un tipo desconocido cae en domicilio, nunca en retiro', () => {
        // Preferimos equivocarnos hacia "hay que enviarlo" antes que hacia
        // "alguien lo pasa a buscar": el segundo error pierde la venta.
        assert.match(etiquetaTipoEnvio('cualquier_cosa'), /domicilio/i);
        assert.match(etiquetaTipoEnvio(null), /domicilio/i);
        assert.doesNotMatch(etiquetaTipoEnvio(undefined), /Retiro/);
    });
});

describe('esRetiroEnMano', () => {
    test('sólo el literal exacto cuenta como retiro', () => {
        assert.equal(esRetiroEnMano(TIPO_ENVIO_RETIRO), true);
        assert.equal(esRetiroEnMano('retiro'), false);
        assert.equal(esRetiroEnMano(TIPO_ENVIO_SUCURSAL), false);
        assert.equal(esRetiroEnMano(null), false);
        assert.equal(esRetiroEnMano(undefined), false);
    });
});
