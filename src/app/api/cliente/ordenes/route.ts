import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET /api/cliente/ordenes
// Returns authenticated client's orders with items, shipping events and address.
// Requires: Authorization: Bearer <supabase_access_token>
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.email) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', user.email)
        .single();

    if (!cliente) {
        return NextResponse.json({ ordenes: [] });
    }

    const { data: ordenes, error } = await supabase
        .from('ordenes')
        .select(`
            id,
            numero_orden,
            estado,
            estado_envio,
            subtotal_centavos,
            costo_envio_centavos,
            total_centavos,
            tipo_envio,
            nro_envio_oca,
            id_sucursal_oca,
            created_at,
            pagado_at,
            items_orden (
                id,
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
            direcciones_envio:direccion_envio_id (
                direccion,
                ciudad,
                provincia,
                codigo_postal,
                calle,
                numero,
                piso,
                depto
            ),
            eventos_envio_oca (
                id_estado,
                estado,
                motivo,
                sucursal_info,
                fecha_evento
            )
        `)
        .eq('cliente_id', cliente.id)
        .neq('estado', 'pendiente')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[GET cliente/ordenes]', error);
        return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
    }

    // Sort events desc and cap at 20 per order (cronograma needs full history)
    const result = (ordenes ?? []).map(orden => ({
        ...orden,
        eventos_envio_oca: ((orden.eventos_envio_oca ?? []) as { fecha_evento: string }[])
            .sort((a, b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime())
            .slice(0, 20),
    }));

    return NextResponse.json({ ordenes: result });
}
