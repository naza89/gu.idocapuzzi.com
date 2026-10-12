/**
 * Aviso a Telegram de que una orden espera transferencia.
 *
 * Lo dispara `POST /api/checkout/transferencia` una sola vez: el UPDATE atómico
 * `envio_calculado → esperando_transferencia` sólo lo gana un request, así que no
 * hace falta flag propio. Si el aviso falla no se reintenta; la orden igual
 * aparece en el listado de pendientes de WIDO.
 *
 * El aviso de COMPRA (`notificarCompraTelegram`) sale aparte, cuando el equipo
 * confirma la transferencia y la orden pasa a `pagado`.
 *
 * Nunca tira.
 */

import { HORAS_PARA_TRANSFERIR } from '@/lib/pagos';
import { enviarTelegram } from './client';
import { armarMensajeTransferenciaPendiente } from './mensaje-compra';
import { leerDatosCompra } from './notificar-compra';

export async function notificarTransferenciaPendiente(ordenId: string): Promise<void> {
    try {
        const datos = await leerDatosCompra(ordenId);
        if (!datos) return;
        const enviado = await enviarTelegram(armarMensajeTransferenciaPendiente(datos, HORAS_PARA_TRANSFERIR));
        if (enviado) console.log('[telegram] ✅ Aviso de transferencia pendiente — orden:', ordenId);
        else console.warn('[telegram] ⚠️ Aviso de transferencia pendiente no salió — orden:', ordenId);
    } catch (err) {
        console.error('[telegram] Error en aviso de transferencia:', err);
    }
}
