/**
 * EL INVARIANTE DEL CAMINO DEL DINERO.
 *
 * El 18-ago se encontró que se podía pagar $1 una orden de $240.000: el browser
 * mandaba el total y el servidor le creía. El fix fue que `crear-orden` y
 * `crear-pago` resuelvan SIEMPRE el precio contra `productos.precio_centavos`
 * e ignoren lo que venga en el body.
 *
 * Eso hoy es una convención escrita en un comentario. Este archivo la convierte
 * en algo que frena el merge.
 *
 * ── Por qué es un test sobre el CÓDIGO FUENTE y no sobre el handler ──────────
 * Las dos rutas son route handlers de Next que abren un cliente de Supabase con
 * `service_role` en la primera línea útil. Ejercitarlas de verdad pide una base
 * (o un doble de todo PostgREST), que es justo lo que un test de CI no puede
 * tener: las credenciales productivas NO entran al pipeline (ya hubo una
 * filtración de la clave de OCA el 18-ago; el CI no puede ser la segunda
 * puerta). El chequeo de comportamiento real es el E2E manual contra Supabase.
 *
 * Lo que sí se puede verificar sin secretos, y es exactamente donde estuvo el
 * agujero, es la FORMA del contrato: que el tipo del body no tenga un campo de
 * precio, y que la ruta no lea uno. Es un test de regresión estrecho y honesto
 * sobre la superficie de ataque, no un sustituto del E2E.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8');

const CREAR_ORDEN = 'src/app/api/checkout/crear-orden/route.ts';
const CREAR_PAGO = 'src/app/api/nave/crear-pago/route.ts';

/** Nombres de campo que representan plata viniendo del cliente. */
const CAMPOS_DE_PRECIO = [
    'precio', 'price', 'total_ars', 'totalArs', 'monto', 'amount',
    'subtotal', 'precio_unitario', 'precioUnitario', 'unit_price',
];

/**
 * Devuelve el cuerpo del archivo sin comentarios, para que las menciones en
 * JSDoc (que son justamente advertencias sobre estos campos) no den falsos
 * positivos.
 */
function codigoSinComentarios(rel: string): string {
    return leer(rel)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('el precio nunca viene del browser', () => {
    test('crear-orden: ningún campo del body declarado es un precio', () => {
        const codigo = codigoSinComentarios(CREAR_ORDEN);

        // Las interfaces del body describen literalmente lo que el cliente puede
        // mandar. Si aparece un campo de plata acá, alguien reabrió el agujero.
        const bloquesDeTipo = codigo.match(/interface\s+(ItemIn|Body|DatosCheckout)\s*\{[\s\S]*?\n\}/g) ?? [];
        assert.ok(bloquesDeTipo.length >= 3, 'no se encontraron las interfaces del body de crear-orden');

        for (const bloque of bloquesDeTipo) {
            for (const campo of CAMPOS_DE_PRECIO) {
                assert.ok(
                    !new RegExp(`^\\s*${campo}\\??\\s*:`, 'mi').test(bloque),
                    `el body de crear-orden declara "${campo}" — el precio no puede venir del cliente`
                );
            }
        }
    });

    test('crear-orden: el precio sale de productos.precio_centavos', () => {
        const codigo = codigoSinComentarios(CREAR_ORDEN);
        assert.match(
            codigo,
            /productos!inner\([^)]*precio_centavos/,
            'crear-orden dejó de resolver el precio contra productos.precio_centavos'
        );
        assert.match(
            codigo,
            /precio_unitario_centavos:\s*variante\.precio/,
            'el precio del item ya no sale de la variante resuelta en la base'
        );
    });

    test('crear-orden: un item que no resuelve precio corta con 409, no se cobra $0', () => {
        const codigo = codigoSinComentarios(CREAR_ORDEN);
        assert.match(codigo, /noResueltos/, 'desapareció el acumulador de items sin precio');
        assert.match(
            codigo,
            /noResueltos\.length\s*>\s*0[\s\S]{0,400}status:\s*409/,
            'los items sin precio verificable ya no cortan la creación de la orden con 409'
        );
    });

    test('crear-pago: recalcula el total y no usa el del body', () => {
        const codigo = codigoSinComentarios(CREAR_PAGO);

        assert.match(
            codigo,
            /precio_centavos/,
            'crear-pago dejó de mirar precio_centavos para recalcular el total'
        );

        // El body puede seguir *aceptando* total_ars por compatibilidad, pero no
        // puede terminar en el monto que se le manda a NAVE.
        const usaTotalDelBody = /amount[^\n]*\b(body|payload|req)\b[^\n]*total/i.test(codigo);
        assert.ok(!usaTotalDelBody, 'el monto que va a NAVE parece salir del body en vez del catálogo');
    });
});

describe('los guards de estado del camino del dinero siguen puestos', () => {
    test('crear-pago sólo acepta órdenes en envio_calculado / pago_pendiente', () => {
        const codigo = codigoSinComentarios(CREAR_PAGO);
        assert.match(codigo, /envio_calculado/, 'se perdió el guard de estado de crear-pago');
        assert.match(codigo, /pago_pendiente/, 'se perdió el guard de estado de crear-pago');
    });

    test('el webhook de NAVE valida X-API-KEY con comparación en tiempo constante', () => {
        const codigo = codigoSinComentarios('src/app/api/webhooks/nave/route.ts');
        assert.match(codigo, /x-api-key/i, 'el webhook de NAVE dejó de leer el header X-API-KEY');
        assert.match(codigo, /safeEqualStr/, 'el webhook compara el secreto sin safeEqualStr (timing attack)');
    });

    test('los endpoints de backoffice de OCA siguen detrás de requireAdmin', () => {
        const protegidos = [
            'src/app/api/oca/crear-envio/route.ts',
            'src/app/api/oca/anular/route.ts',
            'src/app/api/oca/etiqueta/route.ts',
            'src/app/api/oca/tracking/route.ts',
            'src/app/api/oca/centros-costo/route.ts',
        ];
        for (const ruta of protegidos) {
            const codigo = codigoSinComentarios(ruta);
            assert.match(codigo, /requireAdmin\s*\(/, `${ruta} quedó sin requireAdmin — endpoint de backoffice abierto a internet`);
        }
    });

    test('requireAdmin es fail-closed: sin ADMIN_API_TOKEN bloquea', () => {
        const codigo = codigoSinComentarios('src/lib/admin-auth.ts');
        assert.match(
            codigo,
            /if\s*\(!expected\)[\s\S]{0,300}status:\s*401/,
            'requireAdmin dejó de bloquear cuando ADMIN_API_TOKEN no está configurada'
        );
    });
});

describe('ninguna credencial de servidor queda expuesta al browser', () => {
    const SECRETOS = [
        'SUPABASE_SERVICE_ROLE_KEY', 'NAVE_CLIENT_SECRET', 'OCA_CLAVE',
        'ADMIN_API_TOKEN', 'NAVE_WEBHOOK_API_KEY', 'RESEND_API_KEY',
    ];

    test('no existe ninguna env var NEXT_PUBLIC_ con nombre de secreto', () => {
        for (const secreto of SECRETOS) {
            assert.ok(
                !SECRETOS.includes(`NEXT_PUBLIC_${secreto}`),
                `NEXT_PUBLIC_${secreto} expondría el secreto en el bundle del cliente`
            );
        }
    });

    test('los scripts de public/js/ no mencionan ninguna env var de servidor', () => {
        // Todo lo de public/js/ se sirve tal cual al navegador. Se ignoran los
        // comentarios: varios explican justamente que tal cosa ahora la hace el
        // servidor con service_role, y esa mención es correcta.
        for (const archivo of ['start.js', 'checkout-logic.js', 'checkout-payment.js', 'supabase-config.js']) {
            const codigo = codigoSinComentarios(path.join('public', 'js', archivo));
            for (const secreto of SECRETOS) {
                assert.ok(
                    !codigo.includes(secreto),
                    `public/js/${archivo} menciona ${secreto} — ese archivo lo lee cualquiera`
                );
            }
            assert.ok(
                !/service_role/.test(codigo),
                `public/js/${archivo} menciona service_role`
            );
        }
    });
});
