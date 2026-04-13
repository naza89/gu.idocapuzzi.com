import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';

export const preferredRegion = ['gru1'];

/**
 * GET /api/oca/etiqueta?ordenId=XX&formato=pdf
 *
 * Descarga la etiqueta de un envío OCA.
 * Formatos: html, pdf (A4), etiquetadora (10x15), zpl (Zebra).
 * Recomendación GÜIDO: "pdf" para hoja común, "etiquetadora" para impresora de etiquetas.
 */
export async function GET(req: NextRequest) {
    const ordenId = req.nextUrl.searchParams.get('ordenId');
    const formato = req.nextUrl.searchParams.get('formato') || 'pdf';

    if (!ordenId) return NextResponse.json({ error: 'ordenId requerido' }, { status: 400 });

    const endpointMap: Record<string, string> = {
        html: 'GetHtmlDeEtiquetasPorOrdenOrNumeroEnvio',
        pdf: 'GetPdfDeEtiquetasPorOrdenOrNumeroEnvio',
        etiquetadora: 'GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora',
        zpl: 'ObtenerEtiquetasZPL',
    };

    const endpoint = endpointMap[formato] || endpointMap.pdf;

    try {
        const respuesta = await ocaGet(endpoint, { idOrdenRetiro: ordenId });

        // PDF viene en Base64 dentro del XML — extraer el contenido
        if (formato === 'pdf' || formato === 'etiquetadora') {
            const match = respuesta.match(/<[^>]+>([A-Za-z0-9+/=\s]+)<\/[^>]+>/);
            if (match) {
                const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="etiqueta-${ordenId}.pdf"`,
                    },
                });
            }
        }

        return NextResponse.json({ success: true, contenido: respuesta });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
