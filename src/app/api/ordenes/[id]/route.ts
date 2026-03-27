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
                items_orden (
                    nombre_producto,
                    color,
                    talle,
                    precio_unitario_centavos,
                    cantidad,
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

        // Update costo_envio_centavos for sidebar totals
        updateData.costo_envio_centavos = Math.round(precio_envio * 100);

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
