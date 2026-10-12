/**
 * POST /api/ordenes/[id]/transferencia
 *
 * Backoffice: confirma o cancela una orden que espera transferencia. Lo llama
 * WIDO (el agente de Telegram) cuando el equipo recibe el comprobante. NO es
 * parte del storefront: requiere `x-admin-token` (ver `src/lib/admin-auth.ts`).
 *
 * Body: { accion: 'confirmar' | 'cancelar', nota?: string }
 *
 * confirmar:
 *   esperando_transferencia → pagado (+ pagado_at). Después dispara el MISMO
 *   post-pago que una compra con tarjeta: descuento de stock, mail de
 *   confirmación al cliente, aviso interno y aviso a Telegram.
 *
 * cancelar:
 *   esperando_transferencia → cancelado. No toca stock: nunca se descontó.
 *
 * ─── POR QUÉ LLAMA AL GET EN VEZ DE REIMPLEMENTAR EL POST-PAGO ───────────────
 *
 * Mismo criterio que el cron de conciliación: `GET /api/ordenes/{id}` ya corre
 * el post-pago de toda orden en `pagado`, con claims atómicos (stock_decremented,
 * email_sent, notificado_telegram) que lo hacen idempotente. Una segunda copia
 * del camino del dinero es cómo las dos terminan desincronizadas.
 *
 * El fetch interno va al MISMO origen del request (no a `VERCEL_URL`, que está
 * detrás de Deployment Protection — ver el cron). Si el fetch falla, la orden
 * igual quedó pagada y el próximo GET (o el cliente al abrir su pedido) corre
 * el post-pago: el claim lo hace seguro.
 *
 * Idempotencia de la confirmación: el UPDATE exige `estado =
 * esperando_transferencia`. Un segundo "confirmar" devuelve 409 con el estado
 * actual y no hace nada.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';
import { ESTADO_ESPERANDO_TRANSFERENCIA, METODO_PAGO_TRANSFERENCIA } from '@/lib/pagos';

export const maxDuration = 60;

type Accion = 'confirmar' | 'cancelar';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const denied = requireAdmin(request);
    if (denied) return denied;

    try {
        const { id } = await params;
        const body = (await request.json().catch(() => ({}))) as { accion?: unknown; nota?: unknown };
        const accion = body.accion as Accion;
        if (accion !== 'confirmar' && accion !== 'cancelar') {
            return NextResponse.json({ error: "accion debe ser 'confirmar' o 'cancelar'" }, { status: 400 });
        }
        const nota = typeof body.nota === 'string' ? body.nota.trim().slice(0, 500) : '';

        const supabase = createAdminClient();

        const { data: previa } = await supabase
            .from('ordenes')
            .select('id, numero_orden, estado, metodo_pago, total_centavos, notas')
            .eq('id', id)
            .maybeSingle();

        if (!previa) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }
        if (previa.metodo_pago !== METODO_PAGO_TRANSFERENCIA || previa.estado !== ESTADO_ESPERANDO_TRANSFERENCIA) {
            return NextResponse.json(
                {
                    error: 'La orden no está esperando una transferencia',
                    numero_orden: previa.numero_orden,
                    estado: previa.estado,
                    metodo_pago: previa.metodo_pago,
                },
                { status: 409 }
            );
        }

        const ahora = new Date().toISOString();
        const etiqueta = accion === 'confirmar' ? 'Transferencia confirmada' : 'Transferencia cancelada';
        const notas = [previa.notas, `[${ahora}] ${etiqueta}${nota ? `: ${nota}` : ''}`]
            .filter(Boolean)
            .join('\n');

        const cambios: Record<string, unknown> = accion === 'confirmar'
            ? { estado: 'pagado', pagado_at: ahora, notas, updated_at: ahora }
            : { estado: 'cancelado', notas, updated_at: ahora };

        const { data: actualizada, error } = await supabase
            .from('ordenes')
            .update(cambios)
            .eq('id', id)
            .eq('estado', ESTADO_ESPERANDO_TRANSFERENCIA)
            .select('id, numero_orden, estado')
            .maybeSingle();

        if (error) {
            console.error('[transferencia/backoffice] Error actualizando orden:', error);
            return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
        }
        if (!actualizada) {
            return NextResponse.json({ error: 'La orden cambió de estado mientras tanto' }, { status: 409 });
        }

        console.log(`[transferencia/backoffice] ✅ Orden ${previa.numero_orden}: ${etiqueta}`);

        let postPago: 'ok' | 'pendiente' | 'no_aplica' = 'no_aplica';
        if (accion === 'confirmar') {
            postPago = 'pendiente';
            try {
                const origen = new URL(request.url).origin;
                const res = await fetch(`${origen}/api/ordenes/${id}`, {
                    headers: { 'x-confirmacion-transferencia': '1' },
                    signal: AbortSignal.timeout(25_000),
                });
                const tipo = res.headers.get('content-type') || '';
                if (res.ok && tipo.includes('application/json')) postPago = 'ok';
                else console.error(`[transferencia/backoffice] Post-pago: HTTP ${res.status} (${tipo})`);
            } catch (err) {
                // La orden ya está pagada; el próximo GET corre el post-pago.
                console.error('[transferencia/backoffice] Post-pago no corrió, queda para el próximo GET:', err);
            }
        }

        return NextResponse.json({
            numero_orden: actualizada.numero_orden,
            estado: actualizada.estado,
            total_centavos: previa.total_centavos,
            post_pago: postPago,
        });
    } catch (err) {
        console.error('[transferencia/backoffice] ERROR:', err);
        return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
    }
}
