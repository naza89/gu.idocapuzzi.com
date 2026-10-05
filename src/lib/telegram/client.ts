/**
 * Envío de mensajes a Telegram por la Bot API, sin SDK.
 *
 * Usa el MISMO bot que el agente de GÜIDO (Hermes). No hay conflicto: Hermes
 * escucha con getUpdates y acá sólo se llama sendMessage, que no consume updates.
 * Así el aviso de una compra no depende de que el agente esté vivo.
 *
 * Variables (se leen en cada llamada — nunca a nivel de módulo, ver
 * `tests/invariante-precio-servidor.test.ts`):
 *   TELEGRAM_BOT_TOKEN  token de @BotFather
 *   TELEGRAM_CHAT_IDS   chats que reciben los avisos, separados por coma
 *                       (el chat privado de cada uno, o un grupo con id negativo)
 *
 * Si faltan, no tira: loguea y devuelve false. Un aviso que no sale no puede
 * romper el camino del pago.
 */

const TIMEOUT_MS = 8000;

export function chatsDestino(): string[] {
    return (process.env.TELEGRAM_CHAT_IDS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Manda `texto` (HTML de Telegram) a todos los chats configurados.
 * Devuelve `true` si llegó a al menos uno.
 */
export async function enviarTelegram(texto: string): Promise<boolean> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chats = chatsDestino();
    if (!token || chats.length === 0) {
        console.warn('[telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_IDS sin configurar — aviso no enviado');
        return false;
    }

    const resultados = await Promise.all(chats.map(async chatId => {
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: texto,
                    parse_mode: 'HTML',
                    link_preview_options: { is_disabled: true },
                }),
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
            if (!res.ok) {
                // El cuerpo de error de Telegram no incluye el token; la URL sí, por eso no se loguea.
                const detalle = await res.text().catch(() => '');
                console.error(`[telegram] sendMessage a ${chatId} falló (${res.status}):`, detalle.slice(0, 300));
                return false;
            }
            return true;
        } catch (err) {
            console.error(`[telegram] sendMessage a ${chatId} falló:`, err instanceof Error ? err.message : err);
            return false;
        }
    }));

    return resultados.some(Boolean);
}
