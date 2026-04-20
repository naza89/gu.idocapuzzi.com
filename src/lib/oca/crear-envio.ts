import { createAdminClient } from '@/lib/supabase';
import { OCA_CONFIG } from '@/lib/oca/config';
import { ocaPost } from '@/lib/oca/client';
import { generarXMLEnvio } from '@/lib/oca/xml-generator';
import { parsearCrearEnvio } from '@/lib/oca/xml-parser';
import { calcularPaquete } from '@/lib/oca/calculators';

export interface CrearEnvioResult {
    success: boolean;
    idOrdenRetiro?: string;
    error?: string;
}

/**
 * Crea un envío en OCA ePak para una orden existente en Supabase.
 * Llamable desde API routes y desde el webhook de NAVE (server-side).
 *
 * ConfirmarRetiro=false → queda en carrito ePak para revisión manual antes
 * de que OCA pase a buscar el paquete.
 */
export async function crearEnvioOCA(
    ordenId: string,
    confirmarRetiro = false
): Promise<CrearEnvioResult> {
    const supabase = createAdminClient();

    const { data: orden, error } = await supabase
        .from('ordenes')
        .select('*, items_orden(*), direcciones_envio(*), clientes(*)')
        .eq('id', ordenId)
        .single();

    if (error || !orden) {
        return { success: false, error: 'Orden no encontrada' };
    }

    const items = orden.items_orden.map((item: Record<string, unknown>) => ({
        cantidad: Number(item.cantidad),
    }));
    const { paquete } = calcularPaquete(items);
    const valorDeclarado = Math.round(orden.total_centavos / 100);

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
        return { success: false, error: resultado.error };
    }

    await supabase
        .from('ordenes')
        .update({
            id_orden_retiro_oca: resultado.idOrdenRetiro,
            estado: confirmarRetiro ? 'preparando' : 'pendiente_confirmacion',
        })
        .eq('id', ordenId);

    return { success: true, idOrdenRetiro: resultado.idOrdenRetiro != null ? String(resultado.idOrdenRetiro) : undefined };
}
