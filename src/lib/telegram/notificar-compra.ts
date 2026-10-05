/**
 * Aviso de compra a Telegram — se llama cuando una orden queda pagada.
 *
 * Lo disparan los dos caminos que marcan una orden como pagada:
 *   - el webhook de NAVE (`/api/webhooks/nave`)
 *   - la red de seguridad del GET (`/api/ordenes/[id]`), que también corre el
 *     cron de conciliación cada 10 minutos
 *
 * Idempotencia con su PROPIO flag (`ordenes.notificado_telegram`), no colgado del
 * de los mails: si el aviso falla, se libera el claim y el próximo camino lo
 * reintenta. Con el claim de `email_sent` eso no se podría (el mail ya salió).
 *
 *   claim (UPDATE ... WHERE notificado_telegram = false)
 *     → armar mensaje → enviar
 *     → si no salió: notificado_telegram = false (reintenta el próximo)
 *
 * Nunca tira: un error acá no puede frenar nada del post-pago.
 */

import { createAdminClient } from '@/lib/supabase';
import { esRetiroEnMano, etiquetaTipoEnvio, TIPO_ENVIO_SUCURSAL } from '@/lib/envios';
import { enviarTelegram } from './client';
import { armarMensajeCompra, type DatosCompra, type ItemCompra } from './mensaje-compra';

interface FilaItem {
    nombre_producto: string;
    color: string;
    talle: string;
    cantidad: number;
    precio_unitario_centavos: number;
    variantes_producto: { sku: string; stock: number; one_of_one: boolean } | null;
}

export async function notificarCompraTelegram(ordenId: string): Promise<void> {
    try {
        const supabase = createAdminClient();

        const { data: claim, error: claimError } = await supabase
            .from('ordenes')
            .update({ notificado_telegram: true })
            .eq('id', ordenId)
            .eq('notificado_telegram', false)
            .select('id');

        if (claimError) {
            // Típicamente: la columna no existe porque falta correr la migración 24.
            console.error('[telegram] No se pudo reclamar el aviso (¿falta la migración 24?):', claimError.message);
            return;
        }
        if (!claim || claim.length === 0) {
            console.log('[telegram] ⏭️ Aviso ya enviado (o en curso) — orden:', ordenId);
            return;
        }

        let enviado = false;
        try {
            const datos = await leerDatosCompra(ordenId);
            if (datos) enviado = await enviarTelegram(armarMensajeCompra(datos));
        } finally {
            if (enviado) {
                console.log('[telegram] ✅ Aviso de compra enviado — orden:', ordenId);
            } else {
                await supabase
                    .from('ordenes')
                    .update({ notificado_telegram: false })
                    .eq('id', ordenId);
                console.warn('[telegram] ⚠️ Aviso de compra no salió, se reintenta en el próximo pase — orden:', ordenId);
            }
        }
    } catch (err) {
        console.error('[telegram] Error en aviso de compra:', err);
    }
}

async function leerDatosCompra(ordenId: string): Promise<DatosCompra | null> {
    const supabase = createAdminClient();
    const { data: orden, error } = await supabase
        .from('ordenes')
        .select(`
            numero_orden,
            total_centavos,
            subtotal_centavos,
            costo_envio_centavos,
            descuento_centavos,
            codigo_descuento,
            tipo_envio,
            id_sucursal_oca,
            nave_monto_ars,
            pagado_at,
            clientes (nombre, apellido, email, telefono),
            direcciones_envio (calle, numero, piso, depto, ciudad, provincia, codigo_postal),
            items_orden (
                nombre_producto, color, talle, cantidad, precio_unitario_centavos,
                variantes_producto (sku, stock, one_of_one)
            )
        `)
        .eq('id', ordenId)
        .single();

    if (error || !orden) {
        console.error('[telegram] Orden no encontrada:', ordenId, error?.message);
        return null;
    }

    const cliente = orden.clientes as unknown as {
        nombre?: string; apellido?: string; email?: string; telefono?: string;
    } | null;
    const dir = orden.direcciones_envio as unknown as {
        calle?: string; numero?: string; piso?: string; depto?: string;
        ciudad?: string; provincia?: string; codigo_postal?: string;
    } | null;
    const filas = (orden.items_orden as unknown as FilaItem[]) || [];

    const esRetiro = esRetiroEnMano(orden.tipo_envio);
    let detalleEntrega: string[];
    if (esRetiro) {
        detalleEntrega = [];
    } else if (orden.tipo_envio === TIPO_ENVIO_SUCURSAL) {
        detalleEntrega = [orden.id_sucursal_oca ? `Sucursal OCA N° ${orden.id_sucursal_oca}` : 'Sucursal OCA (sin ID registrado)'];
    } else if (dir) {
        const piso = [dir.piso, dir.depto].filter(Boolean).join(' ');
        detalleEntrega = [
            [dir.calle, dir.numero].filter(Boolean).join(' ') + (piso ? ` — ${piso}` : ''),
            [dir.ciudad, dir.provincia].filter(Boolean).join(', '),
            dir.codigo_postal ? `CP ${dir.codigo_postal}` : '',
        ].filter(Boolean);
    } else {
        detalleEntrega = ['Sin dirección registrada — revisar la orden.'];
    }

    const items: ItemCompra[] = filas.map(f => ({
        nombre: f.nombre_producto,
        color: f.color,
        talle: f.talle,
        cantidad: f.cantidad,
        precioUnitarioCentavos: f.precio_unitario_centavos,
        sku: f.variantes_producto?.sku ?? null,
        stockRestante: f.variantes_producto?.stock ?? null,
        oneOfOne: f.variantes_producto?.one_of_one ?? false,
    }));

    return {
        numeroOrden: orden.numero_orden,
        totalCentavos: orden.total_centavos,
        subtotalCentavos: orden.subtotal_centavos,
        costoEnvioCentavos: orden.costo_envio_centavos ?? 0,
        descuentoCentavos: orden.descuento_centavos ?? 0,
        codigoDescuento: orden.codigo_descuento,
        entrega: etiquetaTipoEnvio(orden.tipo_envio),
        esRetiro,
        detalleEntrega,
        cliente: {
            nombre: [cliente?.nombre, cliente?.apellido].filter(Boolean).join(' '),
            email: cliente?.email ?? null,
            telefono: cliente?.telefono ?? null,
        },
        items,
        montoCobradoArs: orden.nave_monto_ars != null ? Number(orden.nave_monto_ars) : null,
        pagadoAt: orden.pagado_at,
    };
}
