import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { OCA_CONFIG } from '@/lib/oca/config';

export const preferredRegion = ['gru1'];
import { ocaPost } from '@/lib/oca/client';
import { generarXMLEnvio } from '@/lib/oca/xml-generator';
import { parsearCrearEnvio } from '@/lib/oca/xml-parser';
import { calcularPaquete } from '@/lib/oca/calculators';

/**
 * POST /api/oca/crear-envio
 *
 * Crea un envío en OCA ePak para una orden existente.
 * Se llama automáticamente al confirmar el pago (webhook).
 * ConfirmarRetiro = false → queda en carrito ePak para revisión manual.
 */
export async function POST(req: NextRequest) {
    try {
        const { ordenId, confirmarRetiro = false } = await req.json();
        const supabase = createAdminClient();

        // 1. Obtener la orden completa de Supabase
        const { data: orden, error } = await supabase
            .from('ordenes')
            .select('*, items_orden(*), direcciones_envio(*), clientes(*)')
            .eq('id', ordenId)
            .single();

        if (error || !orden) {
            return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
        }

        // 2. Calcular paquete (usa dimensiones estimadas hasta tener datos reales)
        const items = orden.items_orden.map((item: Record<string, unknown>) => ({
            cantidad: Number(item.cantidad),
        }));
        const { paquete, pesoTotal, volumenM3 } = calcularPaquete(items);

        // Con seguro activo → valor declarado = total del pedido
        const valorDeclarado = Math.round(orden.total_centavos / 100);

        // 3. Construir XML
        // Nota: la dirección viene de direcciones_envio con campos separados
        // (calle, numero, piso, depto — requiere migración SQL 07)
        const dir = orden.direcciones_envio;
        const cli = orden.clientes;

        const xml = generarXMLEnvio({
            destinatario: {
                apellido: cli.apellido || '',
                nombre: cli.nombre || '',
                calle: dir.calle || dir.direccion || '',
                nro: dir.numero || '',
                piso: dir.piso || '',
                depto: dir.departamento || dir.depto || '',
                localidad: dir.ciudad || dir.localidad || '',
                provincia: dir.provincia || '',
                cp: dir.codigo_postal || '',
                celular: cli.telefono || '',
                email: cli.email || '',
                idci: orden.id_sucursal_oca || 0,
            },
            paquetes: [{ ...paquete, valor: valorDeclarado }],
            operativa: orden.operativa_oca,
            nroRemito: String(orden.numero_orden),
            confirmarRetiro,
        });

        // 4. Llamar a OCA
        const xml_respuesta = await ocaPost('IngresoORMultiplesRetiros', {
            usr: OCA_CONFIG.usuario,
            psw: OCA_CONFIG.clave,
            XML_Datos: xml,
            ConfirmarRetiro: confirmarRetiro ? 'true' : 'false',
            ArchivoCliente: '',
            ArchivoProceso: '',
        });

        const resultado = parsearCrearEnvio(xml_respuesta);

        if (!resultado.success) {
            return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
        }

        // 5. Guardar en Supabase
        await supabase
            .from('ordenes')
            .update({
                id_orden_retiro_oca: resultado.idOrdenRetiro,
                estado: confirmarRetiro ? 'preparando' : 'pendiente_confirmacion',
            })
            .eq('id', ordenId);

        return NextResponse.json({ success: true, idOrdenRetiro: resultado.idOrdenRetiro });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[OCA crear-envio]', err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
