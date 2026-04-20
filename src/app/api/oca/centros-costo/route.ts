import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { XMLParser } from 'fast-xml-parser';

/**
 * GET /api/oca/centros-costo?operativa=XXXXX
 *
 * Lista centros de costo para una operativa dada.
 * Usa el endpoint alternativo (Oep_Track.asmx).
 */
export async function GET(req: NextRequest) {
    const operativa = req.nextUrl.searchParams.get('operativa');
    if (!operativa) return NextResponse.json({ error: 'Operativa requerida' }, { status: 400 });

    try {
        const xml = await ocaGet(
            'GetCentroCostoPorOperativa',
            { CUIT: process.env.OCA_CUIT!, Operativa: operativa },
            true // useAltUrl
        );

        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
        const obj = parser.parse(xml);
        const data = obj?.NewDataSet?.Table;

        if (!data) return NextResponse.json({ success: true, centrosCosto: [] });

        const arr = Array.isArray(data) ? data : [data];
        const centrosCosto = arr.map((c: Record<string, unknown>) => ({
            id: Number(c.NroCentroCosto),
            descripcion: String(c.Descripcion || ''),
        }));

        return NextResponse.json({ success: true, centrosCosto });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
