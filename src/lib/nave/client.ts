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
    id: string; // payment_REQUEST_id — NO es el payment_id real. No sirve para verificar estado.
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
 * Verify a payment status by its real payment_id (NOT payment_request_id).
 * The payment_id comes from the webhook payload, not from crear-pago response.
 * Using payment_request_id here will always return PENDING.
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

// ─── Verify Payment REQUEST Status ───────────────────────

/**
 * Estado de una INTENCIÓN de pago (payment_request), que es distinto del estado
 * del pago en sí. Ver docs/NAVE_CHECKOUT_API_DOCS.md §10 y §11.
 *
 * ⚠️ Por qué existe esta función, además de `verifyPaymentStatus`:
 *
 * `verifyPaymentStatus` necesita el `payment_id` real, y ese dato **sólo llega
 * por el webhook**. Eso hacía que la red de seguridad del GET de
 * `/api/ordenes/[id]` fuera circular: no podía cubrir el caso "el webhook nunca
 * llegó", que es exactamente para lo que estaba escrita.
 *
 * El `payment_request_id` sí lo tenemos desde `crear-pago` (guardado en
 * `ordenes.nave_payment_request_id`), así que este endpoint permite resolver el
 * estado sin depender del webhook.
 *
 * Lo encontró el E2E del 2026-08-21: NAVE cobró la orden 63 y nunca llamó al
 * webhook (tenían dada de alta la URL del apex, que 307-redirecciona). La orden
 * quedó en `pago_pendiente`, sin mail, sin stock descontado, y las 7 llamadas de
 * la red de seguridad fueron no-ops.
 */
export interface NavePaymentRequestStatus {
    id?: string;
    external_payment_id?: string;
    /** Forma esperada según los docs. Se parsea defensivamente — ver `extraerEstadoIntencion`. */
    status?: string | { name?: string };
    state?: string;
    payment_id?: string;
    [k: string]: unknown;
}

/**
 * Normaliza el estado de la intención a un string, tolerando las formas que
 * puede devolver la API (`status` string, `status.name`, o `state`).
 *
 * Devuelve `null` si no se pudo determinar — y el llamador NO debe asumir éxito
 * en ese caso.
 */
export function extraerEstadoIntencion(data: NavePaymentRequestStatus): string | null {
    if (typeof data?.status === 'string') return data.status;
    if (data?.status && typeof data.status === 'object' && typeof data.status.name === 'string') {
        return data.status.name;
    }
    if (typeof data?.state === 'string') return data.state;
    return null;
}

/**
 * Consulta el estado de una intención de pago por su `payment_request_id`.
 *
 * Los docs indican `GET /api/payment_requests/{id}`, pero `verifyPaymentStatus`
 * usa el prefijo `/ranty-payments/...`, así que la API no es consistente entre
 * secciones. Probamos la ruta documentada y, si da 404, la variante — en vez de
 * fallar por un prefijo.
 */
export async function verifyPaymentRequestStatus(
    paymentRequestId: string
): Promise<NavePaymentRequestStatus> {
    const token = await getNaveToken();

    const rutas = [
        `${getApiUrl()}/api/payment_requests/${paymentRequestId}`,
        `${getApiUrl()}/ranty-payments/payment_requests/${paymentRequestId}`,
    ];

    let ultimoError = '';

    for (const url of rutas) {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(20000),
        });

        if (res.ok) return res.json();

        ultimoError = `${res.status} en ${url}: ${(await res.text().catch(() => '')).slice(0, 200)}`;
        if (res.status !== 404) break;
    }

    throw new Error(`NAVE verify payment_request failed (${ultimoError})`);
}
