/**
 * /api/checkout/transferencia
 *
 * GET  → { habilitada, descuentoPct }
 *        El Step 3 lo consulta para decidir si ofrece la opción. Sin datos
 *        bancarios configurados (ver `datosTransferencia()`), no se ofrece.
 *
 * POST { ordenId } → cierra la orden como pago por transferencia.
 *        Respuesta: { ordenId, numeroOrden, subtotalCentavos, descuentoCentavos,
 *                     costoEnvioCentavos, totalCentavos, datosTransferencia,
 *                     horasParaTransferir }
 *
 * ⚠️ SEGURIDAD — el monto y el descuento son AUTORITATIVOS DEL SERVIDOR.
 *   El body sólo trae el id de la orden. El subtotal se recalcula desde el
 *   catálogo (`productos.precio_centavos`), igual que en `nave/crear-pago`, y el
 *   15% se aplica acá. El browser no puede pedir otro porcentaje ni otro monto.
 *
 * Qué NO hace:
 *   - No descuenta stock. Lo descuenta la confirmación (WIDO), por el mismo
 *     camino post-pago que una compra con tarjeta. Sí VERIFICA que haya stock:
 *     no tiene sentido mandar a alguien a transferir por una prenda que no hay.
 *   - No marca la orden como pagada. Queda en `esperando_transferencia`.
 *
 * Side effects (después de responder, con `after()`):
 *   - Mail al cliente con los datos para transferir.
 *   - Aviso a Telegram de que hay una transferencia por confirmar.
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
    CODIGO_DESCUENTO_TRANSFERENCIA,
    DESCUENTO_TRANSFERENCIA_PCT,
    ESTADO_ESPERANDO_TRANSFERENCIA,
    HORAS_PARA_TRANSFERIR,
    METODO_PAGO_TRANSFERENCIA,
    calcularDescuentoTransferencia,
    datosTransferencia,
} from '@/lib/pagos';

/**
 * Sólo una orden con el envío ya elegido puede pasar a transferencia.
 *
 * `pago_pendiente` queda AFUERA a propósito: es una orden que ya tiene una
 * intención de pago abierta en NAVE (dura 10 minutos). Si se pudiera pasar a
 * transferencia, el cliente podría terminar pagando dos veces. Volver a
 * confirmar el envío (PATCH) la devuelve a `envio_calculado`.
 */
const ESTADOS_ORIGEN = ['envio_calculado'];

export async function GET() {
    return NextResponse.json({
        habilitada: datosTransferencia() !== null,
        descuentoPct: DESCUENTO_TRANSFERENCIA_PCT,
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json().catch(() => ({}))) as { ordenId?: unknown };
        const ordenId = typeof body.ordenId === 'string' ? body.ordenId : '';
        if (!ordenId) {
            return NextResponse.json({ error: 'ordenId es obligatorio' }, { status: 400 });
        }

        const datos = datosTransferencia();
        if (!datos) {
            console.error('[transferencia] Datos bancarios sin configurar — opción deshabilitada');
            return NextResponse.json(
                { error: 'El pago por transferencia no está disponible en este momento.' },
                { status: 503 }
            );
        }

        const supabase = createAdminClient();

        const { data: orden, error: ordenError } = await supabase
            .from('ordenes')
            .select(`
                id,
                numero_orden,
                estado,
                costo_envio_centavos,
                nave_payment_id,
                items_orden (
                    cantidad,
                    nombre_producto,
                    talle,
                    variante_id,
                    variantes_producto:variante_id (
                        stock,
                        productos:producto_id ( precio_centavos )
                    )
                )
            `)
            .eq('id', ordenId)
            .single();

        if (ordenError || !orden) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        if (!ESTADOS_ORIGEN.includes(orden.estado) || orden.nave_payment_id) {
            console.warn('[transferencia] Estado no válido:', orden.estado, '— orden:', ordenId);
            return NextResponse.json(
                { error: 'La orden no se puede pagar por transferencia en su estado actual', estado: orden.estado },
                { status: 409 }
            );
        }

        // Embed many-to-one: en runtime viene como objeto, el tipo estático dice array.
        const items = (orden.items_orden ?? []) as unknown as Array<{
            cantidad: number;
            nombre_producto: string;
            talle: string;
            variante_id: string | null;
            variantes_producto: {
                stock: number | null;
                productos: { precio_centavos: number } | null;
            } | null;
        }>;

        if (items.length === 0) {
            return NextResponse.json({ error: 'La orden no tiene items' }, { status: 409 });
        }

        // ── Subtotal desde el catálogo + verificación de stock ──
        let subtotalCentavos = 0;
        const sinStock: string[] = [];
        for (const it of items) {
            const precio = it.variantes_producto?.productos?.precio_centavos;
            if (precio == null) {
                console.error('[transferencia] Item sin precio autoritativo:', it.nombre_producto, it.variante_id);
                return NextResponse.json(
                    { error: 'No pudimos verificar el precio de un producto de la orden' },
                    { status: 409 }
                );
            }
            const cantidad = Number(it.cantidad) || 0;
            subtotalCentavos += precio * cantidad;

            const stock = it.variantes_producto?.stock;
            if (stock != null && stock < cantidad) {
                sinStock.push(`${it.nombre_producto} ${it.talle || ''}`.trim());
            }
        }

        if (sinStock.length > 0) {
            return NextResponse.json(
                { error: `Sin stock: ${sinStock.join(', ')}. Escribinos y lo resolvemos.` },
                { status: 409 }
            );
        }

        const descuentoCentavos = calcularDescuentoTransferencia(subtotalCentavos);
        const costoEnvioCentavos = Number(orden.costo_envio_centavos) || 0;
        const totalCentavos = subtotalCentavos - descuentoCentavos + costoEnvioCentavos;

        if (totalCentavos <= 0) {
            return NextResponse.json({ error: 'El total de la orden es inválido' }, { status: 409 });
        }

        // ── Pasar la orden a transferencia (atómico sobre el estado) ──
        const { data: actualizada, error: updError } = await supabase
            .from('ordenes')
            .update({
                estado: ESTADO_ESPERANDO_TRANSFERENCIA,
                metodo_pago: METODO_PAGO_TRANSFERENCIA,
                subtotal_centavos: subtotalCentavos,
                descuento_centavos: descuentoCentavos,
                codigo_descuento: CODIGO_DESCUENTO_TRANSFERENCIA,
                total_centavos: totalCentavos,
                updated_at: new Date().toISOString(),
            })
            .eq('id', ordenId)
            .in('estado', ESTADOS_ORIGEN)
            .select('id')
            .maybeSingle();

        if (updError) {
            // Típicamente: falta la migración 25 (columna metodo_pago).
            console.error('[transferencia] Error actualizando la orden (¿falta la migración 25?):', updError);
            return NextResponse.json({ error: 'No pudimos procesar la orden' }, { status: 500 });
        }
        if (!actualizada) {
            // Otro request ganó la carrera (doble click, dos pestañas).
            return NextResponse.json(
                { error: 'La orden ya no se puede pagar por transferencia' },
                { status: 409 }
            );
        }

        console.log('[transferencia] ✅ Orden', orden.numero_orden, 'esperando transferencia — total', totalCentavos / 100);

        after(async () => {
            try {
                const { sendTransferInstructionsEmail } = await import('@/lib/email');
                await sendTransferInstructionsEmail(ordenId);
            } catch (err) {
                console.error('[transferencia] Error mail de instrucciones:', err);
            }
            try {
                const { notificarTransferenciaPendiente } = await import('@/lib/telegram/notificar-transferencia');
                await notificarTransferenciaPendiente(ordenId);
            } catch (err) {
                console.error('[transferencia] Error aviso Telegram:', err);
            }
        });

        return NextResponse.json({
            ordenId,
            numeroOrden: orden.numero_orden,
            subtotalCentavos,
            descuentoCentavos,
            costoEnvioCentavos,
            totalCentavos,
            datosTransferencia: datos,
            horasParaTransferir: HORAS_PARA_TRANSFERIR,
        });
    } catch (err: unknown) {
        console.error('[transferencia] ERROR:', err);
        return NextResponse.json({ error: 'Error inesperado al procesar la orden' }, { status: 500 });
    }
}
