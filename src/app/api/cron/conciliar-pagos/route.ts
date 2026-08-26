/**
 * GET /api/cron/conciliar-pagos
 *
 * Barre las órdenes que quedaron en `pago_pendiente` y las reconcilia contra
 * NAVE, sin depender de que el cliente vuelva a la página de confirmación.
 *
 * ─── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 * El webhook de NAVE no llega (verificado el 21 y el 25 de agosto: dos pagos
 * aprobados, cero notificaciones). La red de seguridad del GET de
 * `/api/ordenes/[id]` cubre el hueco, pero es **pull**: la dispara el browser
 * del cliente al volver a `/checkout/confirmacion`.
 *
 * Si el cliente paga y cierra la pestaña, no la dispara nadie. La orden queda en
 * `pago_pendiente` para siempre: no baja el stock (la prenda se revende — con
 * las piezas 1/1 sería vender dos veces algo que existe una sola vez), no sale
 * el mail al cliente, no sale el aviso interno y no se crea el envío. La plata
 * entra igual y nadie se entera.
 *
 * Este cron convierte esa red de **pull** en **push**.
 *
 * ─── POR QUÉ LLAMA AL ENDPOINT EN VEZ DE REIMPLEMENTAR ───────────────────────
 *
 * Hace un fetch interno a `GET /api/ordenes/{id}` por cada orden, en vez de
 * repetir la lógica de conciliación acá.
 *
 * Es a propósito: ese endpoint ya verifica contra NAVE, marca la orden como
 * pagada, descuenta el stock y manda los dos mails, todo con claims atómicos
 * que lo hacen idempotente. Duplicar el camino del dinero para tener "el mismo"
 * código en dos lugares es exactamente cómo los dos se desincronizan. Un salto
 * HTTP interno es barato en un cron que corre cada 10 minutos.
 *
 * ⚠️ El envío de OCA NO se crea acá, igual que no se crea al volver a la
 * confirmación: eso sólo lo hace el webhook de NAVE. Mientras el webhook siga
 * sin llegar, los envíos se generan a mano desde `/api/oca/crear-envio`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { safeEqualStr } from '@/lib/security';

/**
 * Margen antes de tocar una orden.
 *
 * Una orden recién creada puede estar con el cliente todavía en el checkout de
 * NAVE. No hay daño en consultarla (la conciliación falla cerrado y no marca
 * nada que NAVE no confirme), pero no tiene sentido gastar llamadas contra una
 * compra que está pasando ahora mismo.
 */
const MINUTOS_DE_GRACIA = 10;

/** Más allá de esto la intención de pago ya expiró en NAVE: no hay nada que rescatar. */
const DIAS_HACIA_ATRAS = 7;

/** Tope por corrida, para no encadenar cientos de llamadas a NAVE si algo se acumuló. */
const MAX_POR_CORRIDA = 25;

export const maxDuration = 60;

/**
 * Autorización. Dos vías:
 *   · `Authorization: Bearer <CRON_SECRET>` — la que manda Vercel Cron sola.
 *   · `x-admin-token: <ADMIN_API_TOKEN>` — para dispararlo a mano.
 *
 * FAIL-CLOSED: sin ninguna de las dos env vars configuradas, la ruta se bloquea.
 */
function autorizado(req: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization');
        if (safeEqualStr(auth, `Bearer ${cronSecret}`)) return true;
    }
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (adminToken && safeEqualStr(req.headers.get('x-admin-token'), adminToken)) {
        return true;
    }
    return false;
}

/**
 * Dominio público, en punycode porque el real lleva diéresis.
 *
 * ⚠️ Va con `www`. El apex 307-redirecciona, que es exactamente lo que dejó a
 * NAVE sin poder entregar sus webhooks.
 */
const SITIO = 'https://www.xn--gidocapuzzi-thb.com';

/**
 * Base URL para el fetch interno.
 *
 * ⚠️ NO usar `VERCEL_URL`. Apunta a la URL única del deployment
 * (`gc-xxxx.vercel.app`), que está detrás de Deployment Protection: devuelve la
 * página HTML de autenticación **con status 200**, así que el fetch parece
 * exitoso y revienta recién al parsear el JSON. Es exactamente lo que pasó en
 * la primera corrida real: las 3 órdenes dieron
 * `SyntaxError: Unexpected token '<', "<!DOCTYPE "...`.
 */
function baseUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || SITIO;
}

export async function GET(req: NextRequest) {
    if (!autorizado(req)) {
        console.warn('[cron/conciliar] 🚫 Sin autorización — rechazado 401');
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const hasta = new Date(Date.now() - MINUTOS_DE_GRACIA * 60_000).toISOString();
    const desde = new Date(Date.now() - DIAS_HACIA_ATRAS * 24 * 60 * 60_000).toISOString();

    const { data: pendientes, error } = await supabase
        .from('ordenes')
        .select('id, numero_orden, created_at')
        .eq('estado', 'pago_pendiente')
        .not('nave_payment_request_id', 'is', null)
        .lt('created_at', hasta)
        .gt('created_at', desde)
        .order('created_at', { ascending: true })
        .limit(MAX_POR_CORRIDA);

    if (error) {
        console.error('[cron/conciliar] Error consultando órdenes:', error.message);
        return NextResponse.json({ error: 'Error al consultar órdenes' }, { status: 500 });
    }

    if (!pendientes || pendientes.length === 0) {
        console.log('[cron/conciliar] Sin órdenes pendientes que revisar');
        return NextResponse.json({ revisadas: 0, reconciliadas: 0, ordenes: [] });
    }

    console.log(`[cron/conciliar] Revisando ${pendientes.length} orden(es) pendiente(s)`);

    const base = baseUrl();
    const resultados: { numero_orden: number; estado: string }[] = [];

    // Secuencial a propósito: cada iteración pega contra la API de NAVE, y un
    // burst en paralelo contra ellos no aporta nada en un cron.
    for (const orden of pendientes) {
        try {
            const res = await fetch(`${base}/api/ordenes/${orden.id}`, {
                headers: { 'x-conciliacion-cron': '1' },
                signal: AbortSignal.timeout(25_000),
            });

            if (!res.ok) {
                console.error(`[cron/conciliar] Orden ${orden.numero_orden}: HTTP ${res.status}`);
                resultados.push({ numero_orden: orden.numero_orden, estado: `error_http_${res.status}` });
                continue;
            }

            // Un 200 no alcanza: si el fetch cae en una página de Vercel (login
            // de Deployment Protection, 404 del SPA) vuelve HTML con status 200
            // y el JSON.parse revienta con un error que no dice nada. Mejor
            // detectarlo acá y decir qué pasó.
            const tipo = res.headers.get('content-type') || '';
            if (!tipo.includes('application/json')) {
                console.error(
                    `[cron/conciliar] Orden ${orden.numero_orden}: la respuesta no es JSON (content-type: ${tipo}). ` +
                    `¿Está bien la URL base? Usando: ${base}`
                );
                resultados.push({ numero_orden: orden.numero_orden, estado: 'error_no_json' });
                continue;
            }

            const json = await res.json();
            const estadoFinal = json?.orden?.estado ?? 'desconocido';
            resultados.push({ numero_orden: orden.numero_orden, estado: estadoFinal });

            if (estadoFinal === 'pagado') {
                console.log(
                    `[cron/conciliar] ✅ Orden ${orden.numero_orden} RECONCILIADA — ` +
                    'estaba pagada en NAVE y nadie la había reclamado'
                );
            }
        } catch (err) {
            console.error(`[cron/conciliar] Orden ${orden.numero_orden}:`, err);
            resultados.push({ numero_orden: orden.numero_orden, estado: 'error' });
        }
    }

    const reconciliadas = resultados.filter(r => r.estado === 'pagado').length;

    if (reconciliadas > 0) {
        console.warn(
            `[cron/conciliar] ⚠️ ${reconciliadas} orden(es) se reconciliaron por cron. ` +
            'Eso significa que el cliente pagó y NADIE lo había registrado: ' +
            'ni el webhook de NAVE ni la página de confirmación.'
        );
    }

    return NextResponse.json({
        revisadas: resultados.length,
        reconciliadas,
        ordenes: resultados,
    });
}
