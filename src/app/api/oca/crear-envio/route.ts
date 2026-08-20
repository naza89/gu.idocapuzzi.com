import { NextRequest, NextResponse } from 'next/server';
import { crearEnvioOCA } from '@/lib/oca/crear-envio';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

// La creación automática al pagar la dispara el webhook llamando a crearEnvioOCA()
// directamente (no esta route). Esta route es sólo para creación manual de backoffice.
const ESTADOS_ENVIABLES = ['pagado', 'preparando', 'pendiente_confirmacion', 'enviado'];

/**
 * POST /api/oca/crear-envio
 *
 * Crea un envío en OCA ePak para una orden existente.
 * ConfirmarRetiro = false → queda en carrito ePak para revisión manual.
 * Ruta de backoffice — requiere header x-admin-token y que la orden esté paga.
 */
export async function POST(req: NextRequest) {
    const denied = requireAdmin(req);
    if (denied) return denied;

    try {
        const { ordenId, confirmarRetiro = false } = await req.json();
        if (!ordenId) {
            return NextResponse.json({ success: false, error: 'ordenId requerido' }, { status: 400 });
        }

        // No generar envíos para órdenes que no fueron pagadas.
        const supabase = createAdminClient();
        const { data: orden } = await supabase
            .from('ordenes')
            .select('estado')
            .eq('id', ordenId)
            .maybeSingle();
        if (!orden) {
            return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
        }
        if (!ESTADOS_ENVIABLES.includes(orden.estado)) {
            return NextResponse.json(
                { success: false, error: `La orden no está paga (estado: ${orden.estado})` },
                { status: 409 }
            );
        }

        const resultado = await crearEnvioOCA(ordenId, confirmarRetiro);

        if (!resultado.success) {
            return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, idOrdenRetiro: resultado.idOrdenRetiro });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[OCA crear-envio]', err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
