/**
 * NAVE (Banco Galicia) — API Client
 * 
 * Handles authentication and payment request creation.
 * Auth tokens are cached in memory (valid 24h, we refresh at 23h55min).
 */

// ─── Types ───────────────────────────────────────────────

export interface NaveAuthResponse {
    access_token: string;
    scope: string;
    expires_in: string;
    token_type: string;
}

export interface NavePaymentRequestResponse {
    id: string;
    external_payment_id: string;
    checkout_url: string;
    qr_data: string;
}

export interface NavePaymentStatus {
    id: string;
    status: {
        name: string;
        reason_code?: string;
        reason_name?: string;
    };
    updated_date?: string;
    lifecycle_stages?: string[];
    available_balance?: {
        value: string;
    };
}

export interface CartItem {
    name: string;
    quantity: number;
    price: number;
}

// ─── Environment Helpers ─────────────────────────────────

function isSandbox(): boolean {
    return process.env.NAVE_ENVIRONMENT !== 'production';
}

function getAuthUrl(): string {
    return isSandbox()
        ? 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
        : 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';
}

function getApiUrl(): string {
    return isSandbox()
        ? 'https://api-sandbox.ranty.io'
        : 'https://api.ranty.io';
}

export function getEnvironment(): 'sandbox' | 'production' {
    return isSandbox() ? 'sandbox' : 'production';
}

// ─── Token Cache ─────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Get a valid NAVE access token.
 * Cached in memory; refreshes 5 minutes before expiry.
 */
export async function getNaveToken(): Promise<string> {
    const now = Date.now();

    if (cachedToken && now < cachedToken.expiresAt) {
        return cachedToken.value;
    }

    const clientId = process.env.NAVE_CLIENT_ID;
    const clientSecret = process.env.NAVE_CLIENT_SECRET;
    const audience = process.env.NAVE_AUDIENCE ?? 'https://naranja.com/ranty/merchants/api';

    if (!clientId || !clientSecret) {
        throw new Error('NAVE_CLIENT_ID and NAVE_CLIENT_SECRET must be set');
    }

    const res = await fetch(getAuthUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            audience,
        }),
        signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`NAVE auth failed (${res.status}): ${errText}`);
    }

    const data: NaveAuthResponse = await res.json();

    // Cache with 5-minute safety margin
    const expiresInMs = (Number(data.expires_in) - 300) * 1000;
    cachedToken = {
        value: data.access_token,
        expiresAt: now + expiresInMs,
    };

    console.log('[NAVE] ✅ Token obtenido, expira en', data.expires_in, 'seg');
    return cachedToken.value;
}

// ─── Create Payment Request ──────────────────────────────

interface CreatePaymentOptions {
    externalPaymentId: string;
    totalArs: number;
    cartItems: CartItem[];
    callbackUrl?: string;
    durationTime?: number;
}

/**
 * Create a payment intention in NAVE.
 * Returns { id, checkout_url, qr_data }.
 */
export async function createPaymentRequest(
    options: CreatePaymentOptions
): Promise<NavePaymentRequestResponse> {
    const {
        externalPaymentId,
        totalArs,
        cartItems,
        callbackUrl,
        durationTime = 600,
    } = options;

    const posId = process.env.NAVE_POS_ID;
    if (!posId) throw new Error('NAVE_POS_ID must be set');

    const token = await getNaveToken();

    const products = cartItems.map((item) => ({
        name: item.name,
        description: item.name,
        quantity: item.quantity,
        unit_price: {
            currency: 'ARS',
            value: item.price.toFixed(2),
        },
    }));

    // Calculate sum of products
    const productsTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const difference = totalArs - productsTotal;

    // If there's a difference (likely shipping cost), add it as a product 
    // because NAVE rejects payments where the sum of products doesn't strictly match the total amount.
    if (difference > 0.01 || difference < -0.01) {
        products.push({
            name: 'Costo de envío / Otros',
            description: 'Envío y cargos adicionales',
            quantity: 1,
            unit_price: {
                currency: 'ARS',
                value: difference.toFixed(2),
            },
        });
    }

    const body: Record<string, unknown> = {
        external_payment_id: externalPaymentId.substring(0, 36),
        seller: { pos_id: posId },
        transactions: [
            {
                amount: {
                    currency: 'ARS',
                    value: totalArs.toFixed(2),
                },
                products,
            },
        ],
        duration_time: durationTime,
    };

    if (callbackUrl) {
        body.additional_info = { callback_url: callbackUrl };
    }

    const url = `${getApiUrl()}/api/payment_request/ecommerce`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`NAVE payment_request failed (${res.status}): ${errText}`);
    }

    const data: NavePaymentRequestResponse = await res.json();
    console.log('[NAVE] ✅ Respuesta completa de intención de pago:', JSON.stringify(data, null, 2));
    return data;
}

// ─── Verify Payment Status ───────────────────────────────

/**
 * Verify a payment status by its ID.
 * Used by the webhook handler to confirm the actual state from NAVE.
 */
export async function verifyPaymentStatus(
    paymentId: string
): Promise<NavePaymentStatus> {
    const token = await getNaveToken();

    const url = `${getApiUrl()}/ranty-payments/payments/${paymentId}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`NAVE verify payment failed (${res.status}): ${errText}`);
    }

    return res.json();
}
