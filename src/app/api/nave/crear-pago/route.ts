/**
 * POST /api/nave/crear-pago
 *
 * Creates a NAVE payment intention for the given order.
 *
 * ⚠️ SEGURIDAD — el monto es AUTORITATIVO DEL SERVIDOR.
 *   El body puede traer `total_ars`/`cart_items` (los manda el frontend), pero
 *   NO se usan para cobrar: el monto se recalcula server-side leyendo la orden,
 *   sus items, y el precio vigente del catálogo (`productos.precio_centavos`).
 *   Así un cliente no puede pagar $1 una orden de $240.000 manipulando el body.
 *
 * Request body:
 *   { external_payment_id, total_ars?, cart_items?, success_url? }
 *
 * Response:
 *   { payment_request_id, qr_data, checkout_url, environment }
 *
 * Side effect:
 *   Actualiza la orden en Supabase: estado='pago_pendiente', re-sincroniza
 *   subtotal_centavos/total_centavos con los valores autoritativos y guarda
 *   el nave_payment_request_id devuelto por NAVE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
    createPaymentRequest,
    getEnvironment,
    type CartItem,
} from '@/lib/nave/client';

interface CrearPagoBody {
    external_payment_id: string;
    total_ars?: number;
    cart_items?: CartItem[];
    success_url?: string;
}

// Estados desde los que es válido iniciar/reintentar un pago.
// 'pagado' y posteriores quedan fuera: no se re-cobra una orden ya paga.
const ESTADOS_PAGABLES = ['envio_calculado', 'pago_pendiente'];

// Orígenes permitidos para la success_url (evita open-redirect vía el body).
const ORIGENES_PERMITIDOS = [
    'https://guidocapuzzi.com',
    'https://www.guidocapuzzi.com',
    'https://xn--gidocapuzzi-thb.com',
    'https://www.xn--gidocapuzzi-thb.com',
    'http://localhost:3000',
    'http://localhost:3001',
];

function resolverSuccessUrl(bodyUrl: string | undefined, ordenId: string): string {
    const base =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
        'https://xn--gidocapuzzi-thb.com';
    const fallback = `${base}/checkout/confirmacion?orden=${encodeURIComponent(ordenId)}`;

    if (!bodyUrl) return fallback;
    try {
        const u = new URL(bodyUrl);
        if (ORIGENES_PERMITIDOS.includes(u.origin)) return bodyUrl;
    } catch {
        /* url inválida → fallback */
    }
    return fallback;
}

export async function POST(request: NextRequest) {
    try {
        const body: CrearPagoBody = await request.json();
        const { external_payment_id, success_url } = body;

        // ── Validar inputs ──────────────────────────────
        if (!external_payment_id || typeof external_payment_id !== 'string') {
            return NextResponse.json(
                { error: 'external_payment_id es obligatorio' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // ── Leer la orden + items + precio autoritativo del catálogo ──
        const { data: orden, error: ordenError } = await supabase
            .from('ordenes')
            .select(`
                id,
                estado,
                subtotal_centavos,
                costo_envio_centavos,
                total_centavos,
                items_orden (
                    cantidad,
                    nombre_producto,
                    variante_id,
                    variantes_producto:variante_id (
                        productos:producto_id (
                            precio_centavos
                        )
                    )
                )
            `)
            .eq('id', external_payment_id)
            .single();

        if (ordenError || !orden) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        // ── Guarda de estado: no re-cobrar una orden ya paga ──
        if (!ESTADOS_PAGABLES.includes(orden.estado)) {
            console.warn('[crear-pago] Estado no pagable:', orden.estado, '— orden:', external_payment_id);
            return NextResponse.json(
                { error: 'La orden no está en un estado válido para pagar', estado: orden.estado },
                { status: 409 }
            );
        }

        // Supabase infiere el embed como array en el tipo estático, pero un embed
        // many-to-one (variante→producto) viene como objeto en runtime. Cast vía unknown.
        const items = (orden.items_orden ?? []) as unknown as Array<{
            cantidad: number;
            nombre_producto: string;
            variante_id: string | null;
            variantes_producto: { productos: { precio_centavos: number } | null } | null;
        }>;

        if (items.length === 0) {
            return NextResponse.json({ error: 'La orden no tiene items' }, { status: 409 });
        }

        // ── Recalcular el subtotal desde el catálogo (fuente de verdad) ──
        let subtotalCentavos = 0;
        const cartItems: CartItem[] = [];
        for (const it of items) {
            const precioCatalogo = it.variantes_producto?.productos?.precio_centavos;
            if (precioCatalogo == null) {
                // Item sin variante resoluble o sin precio en el catálogo: no
                // podemos verificar cuánto cobrar. Se rechaza en vez de adivinar.
                console.error(
                    '[crear-pago] Item sin precio autoritativo — orden:',
                    external_payment_id,
                    'producto:',
                    it.nombre_producto,
                    'variante:',
                    it.variante_id
                );
                return NextResponse.json(
                    { error: 'No pudimos verificar el precio de un producto de la orden' },
                    { status: 409 }
                );
            }
            const cantidad = Number(it.cantidad) || 0;
            subtotalCentavos += precioCatalogo * cantidad;
            cartItems.push({
                name: it.nombre_producto,
                quantity: cantidad,
                price: precioCatalogo / 100,
            });
        }

        const costoEnvioCentavos = Number(orden.costo_envio_centavos) || 0;
        const totalCentavos = subtotalCentavos + costoEnvioCentavos;
        const totalArs = totalCentavos / 100;

        if (totalArs <= 0) {
            return NextResponse.json({ error: 'El total de la orden es inválido' }, { status: 409 });
        }

        // Log de auditoría si el total que mandó el browser no coincide con el
        // autoritativo (indicio de manipulación o de precios desincronizados).
        if (typeof body.total_ars === 'number' && Math.abs(body.total_ars - totalArs) > 0.01) {
            console.warn(
                '[crear-pago] ⚠️ total_ars del body (%s) != total autoritativo (%s) — orden: %s. Se cobra el autoritativo.',
                body.total_ars,
                totalArs,
                external_payment_id
            );
        }

        // ── Crear la intención de pago en NAVE con el monto autoritativo ──
        const callbackUrl = resolverSuccessUrl(success_url, external_payment_id);
        const naveResponse = await createPaymentRequest({
            externalPaymentId: external_payment_id,
            totalArs,
            cartItems,
            callbackUrl,
            durationTime: 600, // 10 minutos
        });

        // ── Actualizar la orden con los valores autoritativos ──
        const { error: updateError } = await supabase
            .from('ordenes')
            .update({
                estado: 'pago_pendiente',
                nave_payment_request_id: naveResponse.id,
                nave_status: 'PENDING',
                subtotal_centavos: subtotalCentavos,
                total_centavos: totalCentavos,
                nave_monto_ars: totalArs,
            })
            .eq('id', external_payment_id)
            .in('estado', ESTADOS_PAGABLES);

        if (updateError) {
            console.error('[crear-pago] Supabase UPDATE error:', updateError);
            // No bloqueante — la intención ya se creó en NAVE. El webhook usa
            // external_payment_id, así que el pago igual se puede reconciliar.
        }

        // ── Responder al frontend ────────────────────────
        return NextResponse.json({
            payment_request_id: naveResponse.id,
            qr_data: naveResponse.qr_data,
            checkout_url: naveResponse.checkout_url,
            environment: getEnvironment(),
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[crear-pago] ERROR:', message, err);
        // Mensaje genérico al cliente — el detalle interno de NAVE queda en el log.
        return NextResponse.json(
            { error: 'No pudimos iniciar el pago. Probá de nuevo en unos minutos.' },
            { status: 500 }
        );
    }
}
