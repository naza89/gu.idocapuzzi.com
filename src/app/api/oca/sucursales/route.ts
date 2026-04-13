import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { parsearSucursales } from '@/lib/oca/xml-parser';

export const preferredRegion = ['gru1'];
import { validarCP } from '@/lib/oca/validations';

/**
 * GET /api/oca/sucursales?cp=1414
 *
 * Lista sucursales OCA con servicio de entrega activo
 * para el código postal indicado.
 */
export async function GET(req: NextRequest) {
    const cp = req.nextUrl.searchParams.get('cp');
    if (!cp) return NextResponse.json({ error: 'CP requerido' }, { status: 400 });

    const cpError = validarCP(cp);
    if (cpError) {
        return NextResponse.json({ success: false, error: cpError.mensaje }, { status: 400 });
    }

    try {
        const xml = await ocaGet(
            'GetCentrosImposicionConServiciosByCP',
            { CodigoPostal: cp }
        );

        const sucursales = parsearSucursales(xml);

        return NextResponse.json({ success: true, sucursales });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
