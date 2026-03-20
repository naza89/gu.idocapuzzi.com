/**
 * POST /api/nave/crear-pago
 * 
 * Creates a NAVE payment intention for the given order.
 * 
 * Request body:
 *   { external_payment_id, total_ars, cart_items }
 * 
 * Response:
 *   { payment_request_id, qr_data, checkout_url, environment }
 * 
 * Side effect:
 *   Updates the order in Supabase with estado='pago_pendiente'
 *   and the nave_payment_id returned by NAVE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import {
    createPaymentRequest,
    getEnvironment,
    type CartItem,
} from '@/lib/nave/client';

interface CrearPagoBody {
    external_payment_id: string;
    total_ars: number;
    cart_items: CartItem[];
}

export async function POST(request: NextRequest) {
    try {
        const body: CrearPagoBody = await request.json();
        const { external_payment_id, total_ars, cart_items } = body;

        // ── Validate inputs ──────────────────────────────
        if (!external_payment_id || typeof external_payment_id !== 'string') {
            return NextResponse.json(
                { error: 'external_payment_id es obligatorio' },
                { status: 400 }
            );
        }
        if (!total_ars || typeof total_ars !== 'number' || total_ars <= 0) {
            return NextResponse.json(
                { error: 'total_ars debe ser un número positivo' },
                { status: 400 }
            );
        }
        if (!Array.isArray(cart_items) || cart_items.length === 0) {
            return NextResponse.json(
                { error: 'cart_items no puede estar vacío' },
                { status: 400 }
            );
        }

        console.log('[crear-pago] Recibido body:', JSON.stringify(body, null, 2));

        // ── Create payment request in NAVE ───────────────
        const naveResponse = await createPaymentRequest({
            externalPaymentId: external_payment_id,
            totalArs: total_ars,
            cartItems: cart_items,
            callbackUrl: process.env.NAVE_CALLBACK_URL || undefined,
            durationTime: 600, // 10 minutes
        });

        // ── Update order in Supabase ─────────────────────
        const supabase = createAdminClient();

        const { error: updateError } = await supabase
            .from('ordenes')
            .update({
                estado: 'pago_pendiente',
                nave_payment_id: naveResponse.id,
                nave_status: 'PENDING',
                nave_monto_ars: total_ars,
            })
            .eq('id', external_payment_id);

        if (updateError) {
            console.error('[crear-pago] Supabase UPDATE error:', updateError);
            // Non-blocking — the payment intention was already created in NAVE.
            // The webhook will still work because it uses external_payment_id.
        }

        // ── Return to frontend ───────────────────────────
        return NextResponse.json({
            payment_request_id: naveResponse.id,
            qr_data: naveResponse.qr_data,
            checkout_url: naveResponse.checkout_url,
            environment: getEnvironment(),
            public_key: process.env.NAVE_POS_ID || '',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('==================================================');
        console.error('[crear-pago] ERROR DETALLADO:', message, err);
        console.error('==================================================');
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
