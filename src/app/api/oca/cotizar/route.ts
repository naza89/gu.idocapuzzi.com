import { NextRequest, NextResponse } from 'next/server';
import { OCA_CONFIG } from '@/lib/oca/config';
import { ocaGet } from '@/lib/oca/client';
import { parsearCotizacion } from '@/lib/oca/xml-parser';
import { validarCP, validarCotizacion } from '@/lib/oca/validations';

/**
 * POST /api/oca/cotizar
 * 
 * Cotiza envío con todas las operativas activas.
 * Retorna un array de opciones con precio y plazo.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { cpDestino, pesoKg, volumenM3, cantidadPaquetes = 1, valorDeclarado: rawValor = 0 } = body;
        const valorDeclarado = Math.round(Number(rawValor) || 0);

        // Validar inputs
        const cpError = validarCP(cpDestino);
        if (cpError) {
            return NextResponse.json({ success: false, error: cpError.mensaje }, { status: 400 });
        }

        const errores = validarCotizacion(pesoKg, volumenM3);
        if (errores.length > 0) {
            return NextResponse.json({ success: false, errores }, { status: 400 });
        }

        // Cotizar con cada operativa activa
        const resultados = await Promise.all(
            Object.entries(OCA_CONFIG.operativas)
                .filter(([, id]) => id > 0)
                .map(async ([nombre, operativa]) => {
                    const xml = await ocaGet('Tarifar_Envio_Corporativo', {
                        Cuit: OCA_CONFIG.cuit,
                        Operativa: operativa,
                        PesoTotal: pesoKg,
                        VolumenTotal: volumenM3,
                        CodigoPostalOrigen: OCA_CONFIG.origen.cp,
                        CodigoPostalDestino: cpDestino,
                        CantidadPaquetes: cantidadPaquetes,
                        ValorDeclarado: valorDeclarado,
                    });

                    const cotizaciones = parsearCotizacion(xml);
                    return cotizaciones.map(c => ({ ...c, nombre, operativa }));
                })
        );

        return NextResponse.json({
            success: true,
            opciones: resultados.flat(),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[OCA cotizar]', err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
