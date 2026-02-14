// app/api/webhooks/galicia/route.ts
// Endpoint para recibir notificaciones de pago de Galicia NAVE
// URL: POST /api/webhooks/galicia

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── Tipos ───────────────────────────────────────────────
interface GaliciaWebhookPayload {
    event_type: string;
    order_id: string;
    status: string;
    payment_data?: Record<string, unknown>;
    timestamp?: string;
    [key: string]: unknown;
}

// ─── Validación de firma HMAC ────────────────────────────
function validateSignature(
    rawBody: string,
    signature: string | null,
    secret: string
): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// ─── Supabase Admin Client ──────────────────────────────
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(url, serviceKey);
}

// ─── POST Handler ───────────────────────────────────────
export async function POST(request: NextRequest) {
    const receivedAt = new Date().toISOString();

    try {
        // 1. Leer el body como texto (necesario para validar firma)
        const rawBody = await request.text();

        // 2. Validar firma si tenemos webhook secret configurado
        const webhookSecret = process.env.GALICIA_WEBHOOK_SECRET;
        const signature = request.headers.get('x-galicia-signature');

        if (webhookSecret) {
            if (!validateSignature(rawBody, signature, webhookSecret)) {
                console.error('[Galicia Webhook] ❌ Firma inválida', {
                    receivedAt,
                    hasSignature: !!signature,
                });
                return NextResponse.json(
                    { error: 'Firma inválida' },
                    { status: 401 }
                );
            }
        } else {
            // En sandbox/dev, logueamos warning pero aceptamos
            console.warn('[Galicia Webhook] ⚠️ GALICIA_WEBHOOK_SECRET no configurado - aceptando sin validación');
        }

        // 3. Parsear el payload
        let payload: GaliciaWebhookPayload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            console.error('[Galicia Webhook] ❌ Body no es JSON válido');
            return NextResponse.json(
                { error: 'Invalid JSON' },
                { status: 400 }
            );
        }

        // 4. Log del evento recibido
        console.log('[Galicia Webhook] ✅ Evento recibido:', {
            receivedAt,
            event_type: payload.event_type,
            order_id: payload.order_id,
            status: payload.status,
        });

        // 5. Guardar el webhook en Supabase para auditoría
        try {
            const supabase = getSupabaseAdmin();

            // Log del webhook (tabla opcional para debugging)
            await supabase.from('webhook_logs').insert({
                source: 'galicia',
                event_type: payload.event_type,
                order_id: payload.order_id,
                payload: payload,
                received_at: receivedAt,
            });

            // 6. Actualizar estado de la orden si hay order_id
            if (payload.order_id) {
                const updateData: Record<string, unknown> = {
                    payment_status: payload.status,
                    payment_data: payload.payment_data || null,
                    updated_at: receivedAt,
                };

                // Mapear eventos a estados
                switch (payload.event_type) {
                    case 'payment.approved':
                        updateData.status = 'paid';
                        break;
                    case 'payment.rejected':
                        updateData.status = 'payment_failed';
                        break;
                    case 'payment.cancelled':
                        updateData.status = 'cancelled';
                        break;
                    case 'payment.refunded':
                        updateData.status = 'refunded';
                        break;
                    default:
                        console.log(`[Galicia Webhook] Evento no mapeado: ${payload.event_type}`);
                }

                const { error } = await supabase
                    .from('ordenes')
                    .update(updateData)
                    .eq('id', payload.order_id);

                if (error) {
                    console.error('[Galicia Webhook] Error actualizando orden:', error);
                }
            }
        } catch (dbError) {
            // Logueamos el error pero respondemos 200 igual
            // (para que Galicia no reintente, ya recibimos el webhook)
            console.error('[Galicia Webhook] Error de base de datos:', dbError);
        }

        // 7. Responder 200 OK (Galicia espera esto)
        return NextResponse.json(
            { received: true, timestamp: receivedAt },
            { status: 200 }
        );

    } catch (error) {
        console.error('[Galicia Webhook] ❌ Error inesperado:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ─── GET Handler (para verificación) ────────────────────
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: '/api/webhooks/galicia',
        method: 'POST',
        description: 'Galicia NAVE webhook endpoint',
        environment: process.env.GALICIA_SANDBOX === 'true' ? 'sandbox' : 'production',
    });
}
