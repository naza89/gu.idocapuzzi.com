import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { parsearTracking } from '@/lib/oca/xml-parser';

/**
 * GET /api/oca/tracking?nroEnvio=XX
 *
 * Consulta el estado y los eventos de un envío OCA.
 * El nro_envio_oca (19 dígitos) se obtiene del panel ePak o de la orden.
 */
export async function GET(req: NextRequest) {
    const nroEnvio = req.nextUrl.searchParams.get('nroEnvio');
    if (!nroEnvio) return NextResponse.json({ error: 'nroEnvio requerido' }, { status: 400 });

    try {
        const xml = await ocaGet('Tracking_Pieza', { Pieza: nroEnvio });
        const tracking = parsearTracking(xml);

        return NextResponse.json({ success: true, tracking });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
