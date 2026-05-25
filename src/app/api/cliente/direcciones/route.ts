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

// GET /api/cliente/direcciones
// Returns all saved addresses for the authenticated client.
export async function GET(request: NextRequest) {
    const result = await getClienteId(request);
    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('direcciones_envio')
        .select('id, direccion, ciudad, provincia, codigo_postal, calle, numero, piso, depto, es_predeterminada, created_at')
        .eq('cliente_id', result.clienteId)
        .order('es_predeterminada', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[GET cliente/direcciones]', error);
        return NextResponse.json({ error: 'Error al obtener direcciones' }, { status: 500 });
    }

    return NextResponse.json({ direcciones: data ?? [] });
}

// POST /api/cliente/direcciones
// Creates a new address for the authenticated client.
export async function POST(request: NextRequest) {
    const result = await getClienteId(request);
    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    let body: {
        calle?: string;
        numero?: string;
        piso?: string;
        depto?: string;
        ciudad?: string;
        provincia?: string;
        codigo_postal?: string;
        es_predeterminada?: boolean;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const { calle, numero, ciudad, provincia, codigo_postal, piso, depto, es_predeterminada } = body;
    if (!calle || !numero || !ciudad || !provincia || !codigo_postal) {
        return NextResponse.json({ error: 'Faltan campos requeridos: calle, numero, ciudad, provincia, codigo_postal' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // If this address is being set as default, clear the current default first
    if (es_predeterminada) {
        await supabase
            .from('direcciones_envio')
            .update({ es_predeterminada: false })
            .eq('cliente_id', result.clienteId);
    }

    const direccionCompleta = `${calle} ${numero}${piso ? `, piso ${piso}` : ''}${depto ? ` dpto ${depto}` : ''}`;

    const { data, error } = await supabase
        .from('direcciones_envio')
        .insert({
            cliente_id: result.clienteId,
            direccion: direccionCompleta,
            calle,
            numero,
            piso: piso ?? null,
            depto: depto ?? null,
            ciudad,
            provincia,
            codigo_postal,
            es_predeterminada: es_predeterminada ?? false,
        })
        .select('id, direccion, ciudad, provincia, codigo_postal, calle, numero, piso, depto, es_predeterminada')
        .single();

    if (error) {
        console.error('[POST cliente/direcciones]', error);
        return NextResponse.json({ error: 'Error al guardar dirección' }, { status: 500 });
    }

    return NextResponse.json({ direccion: data }, { status: 201 });
}
