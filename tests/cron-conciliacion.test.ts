/**
 * EL CRON DE CONCILIACIÓN.
 *
 * Es la única red que no depende ni de NAVE ni de que el cliente vuelva a la
 * página de confirmación. Si se rompe, un cliente puede pagar y que la compra
 * no quede registrada en ningún lado: sin stock descontado, sin mail y sin
 * aviso.
 *
 * Estos tests son de estructura (leen el fuente), no de red: corren en el CI
 * sin credenciales y sin tocar Supabase ni NAVE.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8');

const CRON = 'src/app/api/cron/conciliar-pagos/route.ts';
const VERCEL_JSON = 'vercel.json';

describe('el cron está efectivamente programado', () => {
    test('vercel.json declara el cron', () => {
        const cfg = JSON.parse(leer(VERCEL_JSON));
        assert.ok(Array.isArray(cfg.crons) && cfg.crons.length > 0, 'no hay crons declarados');
        const job = cfg.crons.find((c: { path: string }) => c.path === '/api/cron/conciliar-pagos');
        assert.ok(job, 'el cron de conciliación no está en vercel.json: la ruta existiría pero no la llamaría nadie');
        assert.match(job.schedule, /^\S+ \S+ \S+ \S+ \S+$/, 'el schedule no parece una expresión cron');
    });

    test('la ruta declarada en vercel.json existe', () => {
        assert.doesNotThrow(() => leer(CRON), 'vercel.json apunta a una ruta que no existe');
    });
});

describe('autorización del cron', () => {
    const codigo = leer(CRON);

    test('acepta el Bearer de Vercel Cron', () => {
        assert.match(codigo, /CRON_SECRET/);
        assert.match(codigo, /Bearer/);
    });

    test('acepta el token de admin para dispararlo a mano', () => {
        assert.match(codigo, /ADMIN_API_TOKEN/);
    });

    test('compara los secretos en tiempo constante', () => {
        // Un `===` acá filtra el secreto por timing. Existe safeEqualStr para esto.
        assert.match(codigo, /safeEqualStr/);
    });

    test('falla cerrado: sin env vars no autoriza', () => {
        // La función devuelve false por defecto — sólo dos caminos devuelven true,
        // y los dos exigen que la env var correspondiente esté configurada.
        assert.match(codigo, /return false;/);
        assert.doesNotMatch(
            codigo,
            /if \(!cronSecret\) return true/,
            'no debe autorizar cuando falta el secreto'
        );
    });
});

describe('el barrido no puede desbocarse', () => {
    const codigo = leer(CRON);

    test('sólo mira órdenes en pago_pendiente', () => {
        assert.match(codigo, /'pago_pendiente'/);
    });

    test('exige nave_payment_request_id', () => {
        // Sin ese id no hay nada contra qué verificar en NAVE.
        assert.match(codigo, /nave_payment_request_id/);
    });

    test('tiene tope por corrida', () => {
        assert.match(codigo, /MAX_POR_CORRIDA/);
        assert.match(codigo, /\.limit\(MAX_POR_CORRIDA\)/);
    });

    test('tiene ventana temporal acotada por los dos lados', () => {
        // Margen de gracia para no pisar un checkout en curso, y un techo para no
        // reintentar eternamente intenciones que ya expiraron en NAVE.
        assert.match(codigo, /MINUTOS_DE_GRACIA/);
        assert.match(codigo, /DIAS_HACIA_ATRAS/);
    });

    test('cada llamada tiene timeout', () => {
        // Sin timeout, una orden colgada se come el maxDuration entero y las
        // siguientes no se revisan.
        assert.match(codigo, /AbortSignal\.timeout/);
    });
});

describe('no duplica la lógica del camino del dinero', () => {
    const codigo = leer(CRON);

    test('reusa el endpoint de la orden en vez de reimplementar la conciliación', () => {
        assert.match(codigo, /\/api\/ordenes\//);
        // Si aparecieran estas llamadas acá, habría dos implementaciones del
        // camino del dinero y tarde o temprano se desincronizan.
        assert.doesNotMatch(codigo, /verifyPaymentRequestStatus/, 'el cron no debe verificar el pago por su cuenta');
        assert.doesNotMatch(codigo, /decrement_stock/, 'el cron no debe tocar el stock por su cuenta');
        assert.doesNotMatch(codigo, /sendOrderConfirmationEmail/, 'el cron no debe mandar mails por su cuenta');
    });

    test('no crea envíos de OCA', () => {
        // Igual que la red de seguridad del GET: el envío lo crea sólo el webhook.
        assert.doesNotMatch(codigo, /crearEnvioOCA/);
    });
});
