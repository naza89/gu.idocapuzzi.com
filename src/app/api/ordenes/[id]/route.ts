/**
 * GET /api/ordenes/[id]
 *
 * Returns order details for the post-payment confirmation page.
 * Used when the cart is empty (user was redirected back from NAVE checkout).
 * Only returns orders that have reached at least 'pago_pendiente' state.
 *
 * PATCH /api/ordenes/[id]
 *
 * Updates an order with shipping information before proceeding to payment.
 * Called from start.js when the user confirms their shipping selection in Step 2.
 *
 * Request body:
 *   {
 *     tipo_envio: 'domicilio' | 'sucursal',
 *     precio_envio: number,          // in pesos (not centavos)
 *     id_sucursal_oca?: number,       // only if sucursal
 *     operativa_oca?: number
 *   }
 *
 * Side effect:
 *   Updates ordenes SET estado='envio_calculado', tipo_envio, precio_envio, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface PatchOrdenBody {
    tipo_envio?: string;
    precio_envio?: number;
    id_sucursal_oca?: number | null;
    operativa_oca?: number | null;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'ID de orden es obligatorio' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('ordenes')
            .select(`
                id,
                estado,
                total_centavos,
                costo_envio_centavos,
                tipo_envio,
                precio_envio,
                nave_payment_id,
                nave_payment_request_id,
                items_orden (
                    nombre_producto,
                    color,
                    talle,
                    precio_unitario_centavos,
                    cantidad,
                    variante_id,
                    variantes_producto:variante_id (
                        producto_id,
                        productos:producto_id (
                            imagenes
                        )
                    )
                ),
                clientes (
                    email,
                    nombre,
                    apellido
                ),
                direcciones_envio (
                    calle,
                    numero,
                    ciudad,
                    provincia,
                    codigo_postal
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        // Only expose orders that have progressed past the initial 'pendiente' state
        if (data.estado === 'pendiente') {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        // ── Verify payment with NAVE if order is still pago_pendiente ──
        // nave_payment_id (real payment ID) is set by the webhook.
        // nave_payment_request_id (from crear-pago) does NOT work for status verification.
        // Only verify if the webhook has already set the real payment_id.
        let runPostPayActions = false;
        if (data.estado === 'pago_pendiente' && data.nave_payment_id) {
            try {
                const { verifyPaymentStatus } = await import('@/lib/nave/client');
                const paymentData = await verifyPaymentStatus(data.nave_payment_id);
                const status = paymentData?.status?.name ?? 'UNKNOWN';

                if (status === 'APPROVED') {
                    console.log('[GET ordenes] Pago verificado APPROVED, procesando...');

                    // Update order to pagado
                    await supabase
                        .from('ordenes')
                        .update({
                            estado: 'pagado',
                            pagado_at: new Date().toISOString(),
                            nave_status: status,
                            nave_monto_ars: paymentData.available_balance?.value
                                ? parseFloat(paymentData.available_balance.value)
                                : null,
                        })
                        .eq('id', id);

                    data.estado = 'pagado';
                    runPostPayActions = true;
                }
            } catch (verifyErr) {
                console.error('[GET ordenes] Error verificando pago NAVE:', verifyErr);
            }
        }

        // Red de seguridad: si la orden está pagada pero el webhook no terminó
        // los post-pay (Vercel mató la función async), los corremos acá.
        if (data.estado === 'pagado') runPostPayActions = true;

        if (runPostPayActions) {
            try {
                // Atomic stock claim — solo el primer UPDATE que gana ejecuta el RPC
                const { data: stockClaimed } = await supabase
                    .from('ordenes')
                    .update({ stock_decremented: true })
                    .eq('id', id)
                    .eq('stock_decremented', false)
                    .select('id');

                if (stockClaimed && stockClaimed.length > 0) {
                    try {
                        const items = data.items_orden || [];
                        await Promise.all(
                            items
                                .filter((item: { variante_id: string | null }) => item.variante_id != null)
                                .map((item: { variante_id: string; cantidad: number }) =>
                                    supabase.rpc('decrement_stock', {
                                        p_variante_id: item.variante_id,
                                        p_cantidad: item.cantidad,
                                    })
                                )
                        );
                        console.log('[GET ordenes] ✅ Stock decrementado');
                    } catch (stockErr) {
                        console.error('[GET ordenes] Error stock:', stockErr);
                    }
                } else {
                    console.log('[GET ordenes] ⏭️ Stock ya decrementado');
                }

                // Atomic email claim — solo el primer UPDATE que gana envía
                const { data: emailClaimed } = await supabase
                    .from('ordenes')
                    .update({ email_sent: true })
                    .eq('id', id)
                    .eq('email_sent', false)
                    .select('id');

                if (emailClaimed && emailClaimed.length > 0) {
                    import('@/lib/email').then(({ sendOrderConfirmationEmail }) =>
                        sendOrderConfirmationEmail(id).catch((emailErr) =>
                            console.error('[GET ordenes] Error email:', emailErr)
                        )
                    ).catch(() => console.warn('[GET ordenes] Email module not available'));
                } else {
                    console.log('[GET ordenes] ⏭️ Email ya enviado');
                }
            } catch (postPayErr) {
                console.error('[GET ordenes] Error post-pay:', postPayErr);
            }
        }

        return NextResponse.json({ orden: data });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[GET ordenes] Error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'ID de orden es obligatorio' },
                { status: 400 }
            );
        }

        const body: PatchOrdenBody = await request.json();
        const { tipo_envio, precio_envio, id_sucursal_oca, operativa_oca } = body;

        if (!tipo_envio || precio_envio === undefined || precio_envio === null) {
            return NextResponse.json(
                { error: 'tipo_envio y precio_envio son obligatorios' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Build the update payload
        const updateData: Record<string, unknown> = {
            estado: 'envio_calculado',
            tipo_envio,
            precio_envio,
        };

        // Optional OCA fields
        if (id_sucursal_oca !== undefined) {
            updateData.id_sucursal_oca = id_sucursal_oca;
        }
        if (operativa_oca !== undefined) {
            updateData.operativa_oca = operativa_oca;
        }

        // Update costo_envio_centavos and recalculate total
        const costoEnvioCentavos = Math.round(precio_envio * 100);
        updateData.costo_envio_centavos = costoEnvioCentavos;

        // Fetch current subtotal to recalculate total with shipping
        const { data: currentOrder } = await supabase
            .from('ordenes')
            .select('subtotal_centavos')
            .eq('id', id)
            .single();

        if (currentOrder) {
            updateData.total_centavos = currentOrder.subtotal_centavos + costoEnvioCentavos;
        }

        const { data, error } = await supabase
            .from('ordenes')
            .update(updateData)
            .eq('id', id)
            .select('id, estado, tipo_envio, precio_envio')
            .single();

        if (error) {
            console.error('[PATCH ordenes] Supabase error:', error);
            return NextResponse.json(
                { error: 'Error al actualizar la orden' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Orden no encontrada' },
                { status: 404 }
            );
        }

        console.log('[PATCH ordenes] ✅ Orden actualizada:', id, '→ envio_calculado');

        return NextResponse.json({
            success: true,
            orden: data,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[PATCH ordenes] Error:', err);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
