/**
 * POST /api/webhooks/nave
 * 
 * Receives async payment notifications from NAVE.
 * 
 * ⚠️ CRITICAL: Responds HTTP 200 IMMEDIATELY.
 * If not, NAVE retries up to 5 times (last at ~6.7 hours).
 * 
 * Webhook body from NAVE:
 *   { payment_id, payment_check_url, external_payment_id }
 * 
 * After responding 200:
 *   1. Verifies payment status via GET to NAVE
 *   2. Updates the order in Supabase accordingly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyPaymentStatus } from '@/lib/nave/client';

interface NaveWebhookPayload {
    payment_id: string;
    payment_check_url: string;
    external_payment_id: string;
}

// ─── POST Handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
    let body: NaveWebhookPayload;

    try {
        body = await request.json();
    } catch {
        // If body is not valid JSON, respond 200 anyway to avoid retries
        console.error('[webhook/nave] Body inválido (no es JSON)');
        return NextResponse.json({ received: true }, { status: 200 });
    }

    const { payment_id, external_payment_id } = body;

    console.log('[webhook/nave] 📩 Recibido:', {
        payment_id,
        external_payment_id,
        timestamp: new Date().toISOString(),
    });

    // ⚠️ CRITICAL: Respond 200 IMMEDIATELY, then process async
    // In Next.js serverless, fire-and-forget the processing
    processWebhook(payment_id, external_payment_id).catch((err) =>
        console.error('[webhook/nave] Error en procesamiento async:', err)
    );

    return NextResponse.json({ received: true }, { status: 200 });
}

// ─── GET Handler (health check / verification) ──────────

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/webhooks/nave',
        method: 'POST',
        description: 'NAVE (Banco Galicia) webhook endpoint',
        environment: process.env.NAVE_ENVIRONMENT || 'sandbox',
    });
}

// ─── Async Processing ────────────────────────────────────

async function processWebhook(
    paymentId: string,
    externalPaymentId: string
): Promise<void> {
    try {
        // STEP 1: Verify the actual payment status from NAVE
        const paymentData = await verifyPaymentStatus(paymentId);
        const status = paymentData?.status?.name ?? 'UNKNOWN';
        const reasonCode = paymentData?.status?.reason_code ?? '';

        console.log('[webhook/nave] Estado NAVE:', status, reasonCode, '→ orden:', externalPaymentId);

        // STEP 2: Map NAVE status to Supabase updates
        const supabase = createAdminClient();

        const updateData: Record<string, unknown> = {
            nave_payment_id: paymentId,
            nave_status: status,
        };

        switch (status) {
            case 'APPROVED':
                updateData.estado = 'pagado';
                updateData.pagado_at = new Date().toISOString();
                // Store available balance for reconciliation
                if (paymentData.available_balance?.value) {
                    updateData.nave_monto_ars = parseFloat(paymentData.available_balance.value);
                }
                break;

            case 'REJECTED':
            case 'CANCELLED':
                updateData.estado = 'cancelado';
                break;

            case 'REFUNDED':
            case 'PURCHASE_REVERSED':
                updateData.estado = 'cancelado';
                break;

            case 'CHARGEBACK_REVIEW':
            case 'CHARGED_BACK':
                // Only update nave_status, don't change order estado yet
                // (requires manual review)
                break;

            default:
                // PENDING, IN_PROGRESS, etc. — only update nave_status
                console.log('[webhook/nave] Estado no mapeado:', status);
                break;
        }

        // STEP 3: Update order in Supabase
        const { error } = await supabase
            .from('ordenes')
            .update(updateData)
            .eq('id', externalPaymentId);

        if (error) {
            console.error('[webhook/nave] Supabase UPDATE error:', error);
        } else {
            console.log('[webhook/nave] ✅ Orden actualizada:', externalPaymentId, '→', status);
        }

        // STEP 4: Post-payment actions (Fase 2 — no implementados aún)
        // if (status === 'APPROVED') {
        //     // Descontar stock:
        //     // SELECT items_orden WHERE orden_id = externalPaymentId
        //     // UPDATE variantes_producto SET stock = stock - cantidad
        //
        //     // Crear envío OCA:
        //     // POST /api/oca/crear-envio → nro_envio_oca
        //     // UPDATE ordenes SET estado='preparando', nro_envio_oca=...
        //
        //     // Email de confirmación:
        //     // sendConfirmationEmail(externalPaymentId)
        // }

    } catch (err) {
        console.error('[webhook/nave] Error en processWebhook:', err);
    }
}
