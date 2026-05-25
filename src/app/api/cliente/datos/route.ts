import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

async function getAuthenticatedEmail(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.email ?? null;
}

// PATCH /api/cliente/datos
// Updates client personal data (nombre, apellido, telefono, newsletter).
// Requires: Authorization: Bearer <supabase_access_token>
export async function PATCH(request: NextRequest) {
    const email = await getAuthenticatedEmail(request);
    if (!email) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let body: { nombre?: string; apellido?: string; telefono?: string; newsletter?: boolean };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const { nombre, apellido, telefono, newsletter } = body;

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updatePayload.nombre = nombre.trim();
    if (apellido !== undefined) updatePayload.apellido = apellido.trim();
    if (telefono !== undefined) updatePayload.telefono = telefono.trim();
    if (newsletter !== undefined) updatePayload.newsletter = newsletter;

    if (Object.keys(updatePayload).length === 1) {
        return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('clientes')
        .update(updatePayload)
        .eq('email', email)
        .select('id, nombre, apellido, telefono, newsletter, email')
        .single();

    if (error) {
        console.error('[PATCH cliente/datos]', error);
        return NextResponse.json({ error: 'Error al actualizar datos' }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ cliente: data });
}
