import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

async function getClienteId(request: NextRequest): Promise<{ clienteId: string } | { error: string; status: number }> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return { error: 'No autorizado', status: 401 };
    const token = authHeader.slice(7);
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user?.email) return { error: 'Token inválido', status: 401 };
    const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', user.email)
        .single();
    if (!cliente) return { error: 'Cliente no encontrado', status: 404 };
    return { clienteId: cliente.id };
}

// PATCH /api/cliente/direcciones/[id]
// Updates an address or sets it as default.
// Body: { calle?, numero?, piso?, depto?, ciudad?, provincia?, codigo_postal?, es_predeterminada? }
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getClienteId(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ensure the address belongs to this client
    const { data: existing } = await supabase
        .from('direcciones_envio')
        .select('id')
        .eq('id', id)
        .eq('cliente_id', auth.clienteId)
        .single();

    if (!existing) {
        return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    // If setting as default, clear all others first
    if (body.es_predeterminada === true) {
        await supabase
            .from('direcciones_envio')
            .update({ es_predeterminada: false })
            .eq('cliente_id', auth.clienteId);
    }

    const updatePayload: Record<string, unknown> = {};
    const fields = ['calle', 'numero', 'piso', 'depto', 'ciudad', 'provincia', 'codigo_postal', 'es_predeterminada'];
    for (const field of fields) {
        if (body[field] !== undefined) updatePayload[field] = body[field];
    }

    // Rebuild direccion string if address fields changed
    if (updatePayload.calle || updatePayload.numero) {
        const { data: current } = await supabase
            .from('direcciones_envio')
            .select('calle, numero, piso, depto')
            .eq('id', id)
            .single();
        if (current) {
            const c = (updatePayload.calle ?? current.calle) as string;
            const n = (updatePayload.numero ?? current.numero) as string;
            const p = (updatePayload.piso ?? current.piso) as string | null;
            const d = (updatePayload.depto ?? current.depto) as string | null;
            updatePayload.direccion = `${c} ${n}${p ? `, piso ${p}` : ''}${d ? ` dpto ${d}` : ''}`;
        }
    }

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('direcciones_envio')
        .update(updatePayload)
        .eq('id', id)
        .select('id, direccion, ciudad, provincia, codigo_postal, calle, numero, piso, depto, es_predeterminada')
        .single();

    if (error) {
        console.error('[PATCH cliente/direcciones/id]', error);
        return NextResponse.json({ error: 'Error al actualizar dirección' }, { status: 500 });
    }

    return NextResponse.json({ direccion: data });
}

// DELETE /api/cliente/direcciones/[id]
// Hard deletes an address that belongs to the authenticated client.
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getClienteId(request);
    if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await params;

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('direcciones_envio')
        .delete()
        .eq('id', id)
        .eq('cliente_id', auth.clienteId);

    if (error) {
        console.error('[DELETE cliente/direcciones/id]', error);
        return NextResponse.json({ error: 'Error al eliminar dirección' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
