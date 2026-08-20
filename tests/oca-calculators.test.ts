/**
 * `calcularPaquete` es lo que define el peso y el volumen que se le declaran a
 * OCA, y de ahí sale el costo de envío que paga el cliente. Es función pura y
 * hay plata de por medio: primer candidato a test.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPaquete } from '../src/lib/oca/calculators.ts';

describe('calcularPaquete', () => {
    test('una prenda: peso = embalaje + prenda', () => {
        const { paquete, pesoTotal, cantidadPaquetes } = calcularPaquete([{ cantidad: 1 }]);
        // 0.1 de embalaje + 0.3 de la prenda
        assert.ok(Math.abs(pesoTotal - 0.4) < 1e-9, `pesoTotal fue ${pesoTotal}`);
        assert.equal(paquete.peso, pesoTotal);
        assert.equal(cantidadPaquetes, 1, 'GÜIDO manda un solo paquete por pedido');
    });

    test('el alto crece con la cantidad; ancho y largo no', () => {
        const una = calcularPaquete([{ cantidad: 1 }]);
        const tres = calcularPaquete([{ cantidad: 3 }]);

        assert.equal(una.paquete.alto, 3 * 1 + 5);
        assert.equal(tres.paquete.alto, 3 * 3 + 5);
        assert.equal(tres.paquete.ancho, una.paquete.ancho, 'el ancho es el de la caja, no depende de la cantidad');
        assert.equal(tres.paquete.largo, una.paquete.largo, 'el largo es el de la caja, no depende de la cantidad');
    });

    test('el peso por ítem de la base pisa al default', () => {
        const conDefault = calcularPaquete([{ cantidad: 2 }]);
        const conPeso = calcularPaquete([{ cantidad: 2, peso: 0.8 }]);

        assert.ok(Math.abs(conDefault.pesoTotal - 0.7) < 1e-9);
        assert.ok(Math.abs(conPeso.pesoTotal - 1.7) < 1e-9, `pesoTotal fue ${conPeso.pesoTotal}`);
    });

    test('peso 0 explícito NO cae al default (?? y no ||)', () => {
        // Si algún día alguien cambia `??` por `||`, un peso 0 de la base
        // volvería a sumar 0.3 kg fantasma por prenda. Este test lo frena.
        const { pesoTotal } = calcularPaquete([{ cantidad: 4, peso: 0 }]);
        assert.ok(Math.abs(pesoTotal - 0.1) < 1e-9, `pesoTotal fue ${pesoTotal}, esperaba sólo el embalaje`);
    });

    test('varias líneas del carrito se suman', () => {
        const { pesoTotal, paquete } = calcularPaquete([
            { cantidad: 2 },                 // 0.6
            { cantidad: 1, peso: 0.9 },      // 0.9  (un jean)
        ]);
        assert.ok(Math.abs(pesoTotal - 1.6) < 1e-9, `pesoTotal fue ${pesoTotal}`);
        assert.equal(paquete.alto, 3 * 3 + 5, 'el alto usa el total de prendas, no el de líneas');
    });

    test('el volumen se declara en m³ y es consistente con las medidas', () => {
        const { paquete, volumenM3 } = calcularPaquete([{ cantidad: 1 }]);
        const esperado = (paquete.alto / 100) * (paquete.ancho / 100) * (paquete.largo / 100);
        assert.ok(Math.abs(volumenM3 - esperado) < 1e-12);
        assert.ok(volumenM3 > 0 && volumenM3 < 1, `un paquete de ropa no puede medir ${volumenM3} m³`);
    });

    test('carrito vacío no rompe: queda la caja del embalaje sola', () => {
        // No debería llegar acá (crear-orden rechaza el carrito vacío antes),
        // pero si llega, tiene que devolver números válidos y no NaN.
        const { pesoTotal, paquete, volumenM3 } = calcularPaquete([]);
        assert.equal(pesoTotal, 0.1);
        assert.equal(paquete.alto, 5, 'sin prendas queda sólo el margen de embalaje');
        assert.ok(volumenM3 > 0 && Number.isFinite(volumenM3), `volumenM3 fue ${volumenM3}`);
    });
});
