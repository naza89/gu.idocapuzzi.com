/**
 * POST /api/webhooks/nave
 *
 * Recibe notificaciones asíncronas de pago de NAVE.
 *
 * ⚠️ CRÍTICO: Responde HTTP 200 apenas valida el origen.
 * Si no, NAVE reintenta hasta 5 veces (el último a ~6.7hs).
 *
 * SEGURIDAD (agregado pre-go-live):
 *   1. Valida el header X-API-KEY contra NAVE_WEBHOOK_API_KEY (cuando está
 *      configurada). Un POST sin la key correcta se rechaza con 401 y no toca nada.
 *   2. Cruza que el pago verificado corresponda a la orden que se marca pagada:
 *      un payment_id sólo puede quedar atado a UNA orden. Esto corta el replay
 *      de un payment_id ajeno (aprobado) contra órdenes caras.
 *
 * Body del webhook:
 *   { payment_id, payment_check_url, external_payment_id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyPaymentStatus } from '@/lib/nave/client';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { crearEnvioOCA } from '@/lib/oca/crear-envio';
import { safeEqualStr } from '@/lib/security';
import { TIPO_ENVIO_RETIRO } from '@/lib/envios';

interface NaveWebhookPayload {
    payment_id: string;
    payment_check_url: string;
    external_payment_id: string;
}

// IPs desde las que NAVE envía notificaciones productivas (soporte, ticket SI-168).
// Se usan sólo para log — la validación real de origen es la X-API-KEY.
const NAVE_NOTIFICATION_IPS = ['3.228.114.2', '3.213.3.172', '3.141.209.202', '3.20.58.62'];

// Estados de orden desde los que NO se debe degradar a 'cancelado' por una
// notificación tardía de rechazo (la orden ya avanzó en su ciclo positivo).
const ESTADOS_TERMINALES_POSITIVOS = ['pagado', 'preparando', 'enviado', 'entregado'];

// ─── POST Handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
    // ── 1. Validación de origen por X-API-KEY (enforce-when-set) ──
    const expectedKey = process.env.NAVE_WEBHOOK_API_KEY;
    if (expectedKey) {
        const provided = request.headers.get('x-api-key');
        if (!safeEqualStr(provided, expectedKey)) {
            console.warn('[webhook/nave] 🚫 X-API-KEY inválida o ausente — rechazado 401');
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
    } else {
        console.warn(
            '[webhook/nave] ⚠️ NAVE_WEBHOOK_API_KEY no configurada: webhook SIN validación de origen. ' +
            'Configurar la key en Vercel y pedirle a NAVE que la envíe antes del go-live.'
        );
    }

    // ── 2. Log-only: IP de origen (informativo, no bloquea) ──
    const fwd =
        request.headers.get('x-vercel-forwarded-for') ||
        request.headers.get('x-forwarded-for') ||
        '';
    if (fwd && !NAVE_NOTIFICATION_IPS.some((ip) => fwd.includes(ip))) {
        console.warn('[webhook/nave] ⚠️ Notificación desde IP fuera del rango NAVE conocido:', fwd);
    }

    let body: NaveWebhookPayload;
    try {
        body = await request.json();
    } catch {
        // Body no-JSON: respondemos 200 igual para no gatillar reintentos.
        console.error('[webhook/nave] Body inválido (no es JSON)');
        return NextResponse.json({ received: true }, { status: 200 });
    }

    const { payment_id, external_payment_id } = body;

    console.log('[webhook/nave] 📩 Recibido:', {
        payment_id,
        external_payment_id,
        timestamp: new Date().toISOString(),
    });

    // ⚠️ CRÍTICO: Respondemos 200 y seguimos procesando en `after()`.
    after(async () => {
        try {
            await processWebhook(payment_id, external_payment_id);
        } catch (err) {
            console.error('[webhook/nave] Error en procesamiento async:', err);
        }
    });

    return NextResponse.json({ received: true }, { status: 200 });
}

// ─── GET Handler (health check / verification) ──────────

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/webhooks/nave',
        method: 'POST',
        description: 'NAVE (Banco Galicia) webhook endpoint',
        environment: process.env.NAVE_ENVIRONMENT || 'sandbox',
    });
}

// ─── Async Processing ────────────────────────────────────

async function processWebhook(
    paymentId: string,
    externalPaymentId: string
): Promise<void> {
    try {
        if (!paymentId || !externalPaymentId) {
            console.error('[webhook/nave] payment_id o external_payment_id ausente — se ignora');
            return;
        }

        const supabase = createAdminClient();

        // STEP 1: Verificar el estado real del pago contra NAVE
        const paymentData = await verifyPaymentStatus(paymentId);
        const status = paymentData?.status?.name ?? 'UNKNOWN';
        const reasonCode = paymentData?.status?.reason_code ?? '';

        console.log('[webhook/nave] Estado NAVE:', status, reasonCode, '→ orden:', externalPaymentId);

        // STEP 2: Traer la orden objetivo
        const { data: orden, error: ordenErr } = await supabase
            .from('ordenes')
            .select('id, estado, total_centavos, nave_payment_id, tipo_envio')
            .eq('id', externalPaymentId)
            .single();

        if (ordenErr || !orden) {
            console.error('[webhook/nave] Orden no encontrada:', externalPaymentId, ordenErr?.message);
            return;
        }

        // STEP 3: CRUCE pago↔orden — un payment_id sólo puede quedar atado a UNA orden.
        // (a) Si esta orden ya tiene OTRO payment_id, esta notificación no le corresponde.
        if (orden.nave_payment_id && orden.nave_payment_id !== paymentId) {
            console.warn(
                '[webhook/nave] 🚫 La orden ya tiene otro nave_payment_id (%s) distinto del entrante (%s) — se ignora. Orden: %s',
                orden.nave_payment_id,
                paymentId,
                externalPaymentId
            );
            return;
        }
        // (b) Si este payment_id ya está atado a otra orden, es un replay.
        const { data: otrasOrdenes } = await supabase
            .from('ordenes')
            .select('id')
            .eq('nave_payment_id', paymentId)
            .neq('id', externalPaymentId);
        if (otrasOrdenes && otrasOrdenes.length > 0) {
            console.warn(
                '[webhook/nave] 🚫 REPLAY detectado: payment_id %s ya está atado a la orden %s, no se aplica a %s',
                paymentId,
                otrasOrdenes[0].id,
                externalPaymentId
            );
            return;
        }

        // STEP 4: Reconciliación de monto — log-only.
        // `available_balance` no siempre viene y su semántica respecto de comisiones
        // no está garantizada, así que NO se usa como gate (el monto ya quedó fijado
        // server-side en crear-pago). Sólo se avisa si hay una discrepancia visible.
        if (status === 'APPROVED' && paymentData.available_balance?.value != null) {
            const cobradoArs = parseFloat(paymentData.available_balance.value);
            const esperadoArs = (Number(orden.total_centavos) || 0) / 100;
            if (Number.isFinite(cobradoArs) && Math.abs(cobradoArs - esperadoArs) > 1) {
                console.warn(
                    '[webhook/nave] ⚠️ Monto NAVE (%s) != total de la orden (%s) — orden: %s. Revisar.',
                    cobradoArs,
                    esperadoArs,
                    externalPaymentId
                );
            }
        }

        // STEP 5: Mapear el estado NAVE a la actualización de la orden
        const updateData: Record<string, unknown> = {
            nave_payment_id: paymentId,
            nave_status: status,
        };

        switch (status) {
            case 'APPROVED':
                updateData.estado = 'pagado';
                updateData.pagado_at = new Date().toISOString();
                if (paymentData.available_balance?.value) {
                    updateData.nave_monto_ars = parseFloat(paymentData.available_balance.value);
                }
                break;

            case 'REJECTED':
            case 'CANCELLED':
                // Guarda: no degradar a 'cancelado' una orden que ya avanzó
                // (evita que un rechazo tardío pise un pago posterior aprobado).
                if (ESTADOS_TERMINALES_POSITIVOS.includes(orden.estado)) {
                    console.warn(
                        '[webhook/nave] ⚠️ %s tardío sobre orden en estado "%s" — no se degrada. Orden: %s',
                        status,
                        orden.estado,
                        externalPaymentId
                    );
                    delete updateData.estado;
                } else {
                    updateData.estado = 'cancelado';
                }
                break;

            case 'REFUNDED':
            case 'PURCHASE_REVERSED':
                // Reembolso/reversa sobre una orden posiblemente ya despachada:
                // no tocamos `estado` automáticamente, queda para revisión manual.
                console.warn(
                    '[webhook/nave] ℹ️ %s recibido — orden %s marcada para revisión manual (estado sin cambiar)',
                    status,
                    externalPaymentId
                );
                break;

            case 'CHARGEBACK_REVIEW':
            case 'CHARGED_BACK':
                // Sólo actualizar nave_status; requiere revisión manual.
                break;

            default:
                console.log('[webhook/nave] Estado no mapeado:', status, '— orden:', externalPaymentId);
                break;
        }

        // STEP 6: Aplicar la actualización.
        // Para APPROVED se exige que la orden todavía NO esté pagada, así el claim
        // de "primer webhook que gana" también cubre la transición de estado.
        let updateQuery = supabase.from('ordenes').update(updateData).eq('id', externalPaymentId);
        if (status === 'APPROVED') {
            updateQuery = updateQuery.not('estado', 'in', '("pagado","preparando","enviado","entregado")');
        }
        const { error } = await updateQuery;

        if (error) {
            console.error('[webhook/nave] Supabase UPDATE error:', error);
        } else {
            console.log('[webhook/nave] ✅ Orden actualizada:', externalPaymentId, '→', status);
        }

        // STEP 7: Acciones post-pago (idempotencia atómica via UPDATE ... WHERE flag=false)
        if (status === 'APPROVED') {
            // 7a. Decrementar stock — atomic claim: solo el primer UPDATE que gana ejecuta el RPC
            try {
                const { data: stockClaimed } = await supabase
                    .from('ordenes')
                    .update({ stock_decremented: true })
                    .eq('id', externalPaymentId)
                    .eq('stock_decremented', false)
                    .select('id');

                if (stockClaimed && stockClaimed.length > 0) {
                    const { data: items, error: itemsError } = await supabase
                        .from('items_orden')
                        .select('variante_id, cantidad')
                        .eq('orden_id', externalPaymentId);

                    if (itemsError) {
                        console.error('[webhook/nave] Error al obtener items_orden:', itemsError);
                    } else if (items && items.length > 0) {
                        await Promise.all(
                            items
                                .filter(item => item.variante_id != null)
                                .map(item =>
                                    supabase.rpc('decrement_stock', {
                                        p_variante_id: item.variante_id,
                                        p_cantidad: item.cantidad,
                                    })
                                )
                        );
                        console.log('[webhook/nave] ✅ Stock decrementado — orden:', externalPaymentId);
                    }
                } else {
                    console.log('[webhook/nave] ⏭️ Stock ya decrementado — orden:', externalPaymentId);
                }
            } catch (stockErr) {
                console.error('[webhook/nave] Error al decrementar stock:', stockErr);
            }

            // 7b. Email de confirmación — atomic claim: solo el primer UPDATE que gana envía
            try {
                const { data: emailClaimed } = await supabase
                    .from('ordenes')
                    .update({ email_sent: true })
                    .eq('id', externalPaymentId)
                    .eq('email_sent', false)
                    .select('id');

                if (emailClaimed && emailClaimed.length > 0) {
                    await sendOrderConfirmationEmail(externalPaymentId);
                    console.log('[webhook/nave] ✅ Email enviado — orden:', externalPaymentId);
                } else {
                    console.log('[webhook/nave] ⏭️ Email ya enviado — orden:', externalPaymentId);
                }
            } catch (emailErr) {
                console.error('[webhook/nave] Error al enviar email:', emailErr);
            }

            // 7c. Crear envío OCA — solo si no se creó antes
            const { data: ocaCheck } = await supabase
                .from('ordenes')
                .select('id_orden_retiro_oca')
                .eq('id', externalPaymentId)
                .single();

            if (orden.tipo_envio === TIPO_ENVIO_RETIRO) {
                // Retiro coordinado: no hay envío que despachar. Sin este guard,
                // OCA genera una etiqueta real y sale un correo a buscar el
                // paquete por una compra que se entrega en mano.
                console.log(
                    '[webhook/nave] ⏭️ Retiro coordinado — no se crea envío OCA. Orden:',
                    externalPaymentId
                );
            } else if (!ocaCheck?.id_orden_retiro_oca) {
                try {
                    const ocaResult = await crearEnvioOCA(externalPaymentId, false);
                    if (ocaResult.success) {
                        console.log('[webhook/nave] ✅ Envío OCA creado:', ocaResult.idOrdenRetiro, '— orden:', externalPaymentId);
                    } else {
                        console.error('[webhook/nave] ⚠️ OCA crear-envio falló:', ocaResult.error);
                    }
                } catch (ocaErr) {
                    console.error('[webhook/nave] Error al crear envío OCA:', ocaErr);
                }
            } else {
                console.log('[webhook/nave] ⏭️ Envío OCA ya creado — orden:', externalPaymentId);
            }
        }

    } catch (err) {
        console.error('[webhook/nave] Error en processWebhook:', err);
    }
}
