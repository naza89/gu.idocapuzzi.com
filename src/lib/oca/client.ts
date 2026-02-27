import { OCA_CONFIG } from './config';

/**
 * HTTP GET to OCA ePak API.
 * OCA uses GET with query params for most endpoints.
 */
export async function ocaGet(
    endpoint: string,
    params: Record<string, string | number>,
    useAltUrl = false
): Promise<string> {
    const baseUrl = useAltUrl ? OCA_CONFIG.baseUrlAlt : OCA_CONFIG.baseUrl;
    const url = new URL(`${baseUrl}/${endpoint}`);

    Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, String(v));
    });

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
        throw new Error(`OCA HTTP error: ${res.status}`);
    }

    return res.text(); // OCA siempre responde XML como texto
}

/**
 * HTTP POST to OCA ePak API.
 * IngresoORMultiplesRetiros usa POST con form data.
 */
export async function ocaPost(
    endpoint: string,
    params: Record<string, string>
): Promise<string> {
    const baseUrl = OCA_CONFIG.baseUrl;
    const url = `${baseUrl}/${endpoint}`;

    const body = new URLSearchParams(params);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
        throw new Error(`OCA HTTP error: ${res.status}`);
    }

    return res.text();
}
