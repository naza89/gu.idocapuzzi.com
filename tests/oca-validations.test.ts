/**
 * Las validaciones de OCA son la última barrera antes de mandar un XML a un
 * proveedor externo. Si dejan pasar un CP mal formado o una dirección
 * incompleta, el error vuelve como un fallo opaco de la API de OCA — y para
 * entonces la orden ya está paga.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    validarCP,
    validarCotizacion,
    validarDireccion,
    validarCrearEnvio,
} from '../src/lib/oca/validations.ts';
import type { DireccionDestino } from '../src/lib/oca/types.ts';

/** Dirección válida mínima, para mutar en cada caso. */
const direccionOk = (): DireccionDestino => ({
    apellido: 'Capuzzi',
    nombre: 'Nazareno',
    calle: 'Av. Corrientes',
    nro: '1234',
    localidad: 'CABA',
    provincia: 'Buenos Aires',
    cp: '1425',
} as DireccionDestino);

describe('validarCP', () => {
    test('acepta los 4 dígitos del CP argentino', () => {
        assert.equal(validarCP('1425'), null);
        assert.equal(validarCP(1425), null, 'también tiene que aceptar el número');
        assert.equal(validarCP(' 1425 '), null, 'tolera espacios alrededor');
    });

    test('rechaza longitudes distintas de 4', () => {
        for (const malo of ['142', '14255', '']) {
            assert.notEqual(validarCP(malo), null, `"${malo}" debería ser inválido`);
        }
    });

    test('rechaza el CP alfanumérico (C1425DTO) — OCA quiere sólo los 4 dígitos', () => {
        const err = validarCP('C1425DTO');
        assert.notEqual(err, null);
        assert.equal(err?.campo, 'cpDestino');
    });
});

describe('validarCotizacion', () => {
    test('un paquete normal no genera errores', () => {
        assert.deepEqual(validarCotizacion(0.4, 0.00525), []);
    });

    test('peso 0 o negativo se rechaza', () => {
        assert.ok(validarCotizacion(0, 0.005).some((e) => e.campo === 'pesoKg'));
        assert.ok(validarCotizacion(-1, 0.005).some((e) => e.campo === 'pesoKg'));
    });

    test('el tope de 50 kg se aplica', () => {
        assert.deepEqual(validarCotizacion(50, 0.005), [], '50 kg justo es válido');
        assert.ok(validarCotizacion(50.1, 0.005).some((e) => e.campo === 'pesoKg'));
    });

    test('volumen 0 se rechaza', () => {
        assert.ok(validarCotizacion(0.4, 0).some((e) => e.campo === 'volumenM3'));
    });

    test('acumula todos los errores en vez de cortar en el primero', () => {
        assert.equal(validarCotizacion(0, 0).length, 2);
    });
});

describe('validarDireccion', () => {
    test('la dirección completa pasa', () => {
        assert.deepEqual(validarDireccion(direccionOk()), []);
    });

    test('reporta cada campo requerido que falte, por nombre', () => {
        for (const campo of ['apellido', 'nombre', 'calle', 'nro', 'localidad', 'provincia'] as const) {
            const dir = { ...direccionOk(), [campo]: '' };
            const errores = validarDireccion(dir);
            assert.ok(errores.some((e) => e.campo === campo), `no reportó ${campo} vacío`);
        }
    });

    test('un campo con sólo espacios cuenta como vacío', () => {
        const dir = { ...direccionOk(), calle: '   ' };
        assert.ok(validarDireccion(dir).some((e) => e.campo === 'calle'));
    });

    test('el CP mal formado se reporta además de estar presente', () => {
        const dir = { ...direccionOk(), cp: '999' };
        const errores = validarDireccion(dir);
        assert.ok(errores.some((e) => e.campo === 'cpDestino'), 'el CP inválido tiene que salir en la lista');
    });
});

describe('validarCrearEnvio', () => {
    test('los datos completos pasan', () => {
        assert.deepEqual(validarCrearEnvio({
            destinatario: direccionOk(),
            operativa: 64665,
            nroRemito: '00000001',
        }), []);
    });

    test('operativa 0 o ausente se rechaza — sin operativa OCA no sabe qué servicio facturar', () => {
        assert.ok(validarCrearEnvio({
            destinatario: direccionOk(), operativa: 0, nroRemito: '1',
        }).some((e) => e.campo === 'operativa'));
    });

    test('remito vacío se rechaza — es la clave con la que después se cruza la orden', () => {
        assert.ok(validarCrearEnvio({
            destinatario: direccionOk(), operativa: 64665, nroRemito: '  ',
        }).some((e) => e.campo === 'nroRemito'));
    });

    test('arrastra los errores de la dirección, no sólo los propios', () => {
        const errores = validarCrearEnvio({
            destinatario: { ...direccionOk(), localidad: '' },
            operativa: 64665,
            nroRemito: '1',
        });
        assert.ok(errores.some((e) => e.campo === 'localidad'));
    });
});
