import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { OCA_CONFIG } from '@/lib/oca/config';

/**
 * POST /api/oca/anular
 *
 * Anula una orden de retiro en OCA ePak.
 * Solo funciona si la orden aún no fue despachada.
 */
export async function POST(req: NextRequest) {
    try {
        const { idOrdenRetiro } = await req.json();

        if (!idOrdenRetiro) {
            return NextResponse.json({ error: 'idOrdenRetiro requerido' }, { status: 400 });
        }

        const xml = await ocaGet('AnularOrdenGenerada', {
            usr: OCA_CONFIG.usuario,
            psw: OCA_CONFIG.clave,
            IdOrdenRetiro: idOrdenRetiro,
        });

        // Verificar si la respuesta indica éxito
        const esExito = xml.includes('true') || xml.includes('True') || xml.includes('1');

        if (esExito) {
            return NextResponse.json({ success: true, message: 'Orden anulada correctamente' });
        }

        // Extraer mensaje de error
        const errorMsg = xml.replace(/<[^>]+>/g, '').trim() || 'No se pudo anular la orden';
        return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[OCA anular]', err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
