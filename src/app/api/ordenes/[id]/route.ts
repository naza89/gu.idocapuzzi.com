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
                numero_orden,
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

        // ── Red de seguridad: verificar el pago contra NAVE ──
        //
        // Dos caminos, en orden de confianza:
        //
        //   A. `nave_payment_id` presente → el webhook llegó. Verificamos el PAGO.
        //   B. `nave_payment_id` ausente  → el webhook NUNCA llegó. Verificamos la
        //      INTENCIÓN con `nave_payment_request_id`, que sí tenemos desde
        //      `crear-pago`.
        //
        // ⚠️ El camino B es el que faltaba. Hasta el 2026-08-21 esta red exigía
        // `nave_payment_id`, que lo setea el webhook — o sea que no podía cubrir el
        // caso "el webhook nunca llegó", que es exactamente para lo que existía.
        // Lo destapó el E2E: NAVE cobró la orden 63 y no llamó nunca (tenían dada
        // de alta la URL del apex, que 307-redirecciona). Esta función se ejecutó 7
        // veces y las 7 fueron no-ops.
        //
        // Ambos caminos FALLAN CERRADO: si no se puede afirmar el éxito, la orden
        // NO se marca pagada. Marcar de más es peor que no marcar.
        let runPostPayActions = false;

        if (data.estado === 'pago_pendiente' && data.nave_payment_id) {
            // ── A. El webhook llegó: verificamos el pago real ──
            try {
                const { verifyPaymentStatus } = await import('@/lib/nave/client');
                const paymentData = await verifyPaymentStatus(data.nave_payment_id);
                const status = paymentData?.status?.name ?? 'UNKNOWN';

                if (status === 'APPROVED') {
                    console.log('[GET ordenes] Pago verificado APPROVED, procesando...');

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
        } else if (data.estado === 'pago_pendiente' && data.nave_payment_request_id) {
            // ── B. El webhook nunca llegó: verificamos la INTENCIÓN ──
            try {
                const { verifyPaymentRequestStatus, extraerEstadoIntencion } =
                    await import('@/lib/nave/client');

                const intencion = await verifyPaymentRequestStatus(data.nave_payment_request_id);
                const estadoIntencion = extraerEstadoIntencion(intencion);

                // Se loguea la respuesta cruda: la forma exacta del payload no está
                // documentada con un ejemplo, y este log es lo que permite ajustar
                // el parseo si NAVE devuelve otra estructura.
                console.log('[GET ordenes] Intención sin webhook — respuesta NAVE:', {
                    payment_request_id: data.nave_payment_request_id,
                    estadoParseado: estadoIntencion,
                    payload: JSON.stringify(intencion).slice(0, 600),
                });

                if (estadoIntencion === 'SUCCESS_PROCESSED') {
                    console.log('[GET ordenes] ✅ Intención SUCCESS_PROCESSED — reconciliando sin webhook');

                    const actualizacion: Record<string, unknown> = {
                        estado: 'pagado',
                        pagado_at: new Date().toISOString(),
                        nave_status: estadoIntencion,
                    };

                    // Si la respuesta trae el payment_id real, lo guardamos: sirve
                    // para conciliar después y para no repetir esta consulta.
                    if (typeof intencion.payment_id === 'string' && intencion.payment_id) {
                        actualizacion.nave_payment_id = intencion.payment_id;
                    }

                    await supabase.from('ordenes').update(actualizacion).eq('id', id);

                    data.estado = 'pagado';
                    runPostPayActions = true;
                } else if (estadoIntencion === null) {
                    console.error(
                        '[GET ordenes] ⚠️ No se pudo determinar el estado de la intención — ' +
                        'la orden NO se marca pagada. Revisar el payload logueado arriba.'
                    );
                } else {
                    console.log('[GET ordenes] Intención en estado', estadoIntencion, '— no se reconcilia');
                }
            } catch (verifyErr) {
                console.error('[GET ordenes] Error verificando la intención NAVE:', verifyErr);
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

        // Guarda de estado: sólo se puede recalcular el envío de una orden que
        // todavía no fue pagada. Sin esto, apretar "Atrás" desde el pago y
        // re-confirmar el envío degradaba una orden ya `pagado` a
        // `envio_calculado`, habilitando un segundo cobro.
        const ESTADOS_EDITABLES = ['pendiente', 'envio_calculado', 'pago_pendiente'];

        const { data, error } = await supabase
            .from('ordenes')
            .update(updateData)
            .eq('id', id)
            .in('estado', ESTADOS_EDITABLES)
            .select('id, estado, tipo_envio, precio_envio')
            .maybeSingle();

        if (error) {
            console.error('[PATCH ordenes] Supabase error:', error);
            return NextResponse.json(
                { error: 'Error al actualizar la orden' },
                { status: 500 }
            );
        }

        if (!data) {
            // La orden no existe, o ya está en un estado no editable (p.ej. pagado).
            return NextResponse.json(
                { error: 'La orden no se puede modificar en su estado actual' },
                { status: 409 }
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
