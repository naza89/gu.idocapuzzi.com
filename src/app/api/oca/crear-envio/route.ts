import { NextRequest, NextResponse } from 'next/server';
import { crearEnvioOCA } from '@/lib/oca/crear-envio';

/**
 * POST /api/oca/crear-envio
 *
 * Crea un envío en OCA ePak para una orden existente.
 * ConfirmarRetiro = false → queda en carrito ePak para revisión manual.
 */
export async function POST(req: NextRequest) {
    try {
        const { ordenId, confirmarRetiro = false } = await req.json();
        if (!ordenId) {
            return NextResponse.json({ success: false, error: 'ordenId requerido' }, { status: 400 });
        }

        const resultado = await crearEnvioOCA(ordenId, confirmarRetiro);

        if (!resultado.success) {
            return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, idOrdenRetiro: resultado.idOrdenRetiro });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[OCA crear-envio]', err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
