import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/health
 *
 * Readiness check del deploy. Lo usa NAVE para validar conectividad, y nosotros
 * para saber, antes de un E2E, si el deploy que está arriba tiene todo lo que
 * necesita para cobrar.
 *
 * ── Por qué se reescribió (FASE 2 · observabilidad, 20-ago-2026) ─────────────
 * La versión anterior devolvía `{status:'ok'}` incondicionalmente: respondía
 * "sano" con Supabase caída y sin una sola env var configurada. Un healthcheck
 * que no puede fallar no es un healthcheck — es un verde falso, que es peor que
 * no tener nada, porque se lo cree.
 *
 * ── Dos respuestas, según quién pregunta ─────────────────────────────────────
 *   · PÚBLICA (sin header): `{status, timestamp}` y nada más. `status` es
 *     'ok' | 'degraded'. No dice QUÉ falta: enumerar la configuración faltante
 *     de un sitio de e-commerce es regalarle el mapa a cualquiera.
 *   · ADMIN (`x-admin-token`, el mismo de los endpoints de backoffice de OCA):
 *     el detalle completo — qué chequeo falló y qué env vars faltan, siempre
 *     como booleanos. NUNCA se devuelve el valor de un secreto.
 *
 * ── Códigos ─────────────────────────────────────────────────────────────────
 *   200 si todo lo crítico está en pie · 503 si algo crítico falta o falla.
 *   Que devuelva 503 es a propósito: así un monitor externo (o el propio Vercel)
 *   lo puede levantar sin parsear el body.
 */

// Sin caché: un healthcheck cacheado no sirve para nada.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Env vars sin las que el camino de compra NO puede funcionar. */
const CRITICAS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NAVE_CLIENT_ID',
    'NAVE_CLIENT_SECRET',
    'NAVE_POS_ID',
    'OCA_CUIT',
    'OCA_USUARIO',
    'OCA_CLAVE',
] as const;

/**
 * Env vars que no rompen el checkout pero cuya ausencia deja un agujero:
 *   · ADMIN_API_TOKEN ausente ⇒ `requireAdmin` es fail-closed y los endpoints de
 *     backoffice de OCA quedan inutilizables (seguro, pero roto).
 *   · NAVE_WEBHOOK_API_KEY ausente ⇒ el webhook acepta sin validar `X-API-KEY`
 *     (enforce-when-set): cualquiera podría marcar una orden como paga.
 *   · RESEND_API_KEY ausente ⇒ el cliente no recibe el mail de su compra.
 */
const RECOMENDADAS = [
    'ADMIN_API_TOKEN',
    'NAVE_WEBHOOK_API_KEY',
    'RESEND_API_KEY',
] as const;

const faltantes = (nombres: readonly string[]) =>
    nombres.filter((n) => !process.env[n] || process.env[n]!.trim() === '');

export async function GET(request: NextRequest) {
    const inicio = Date.now();

    const envCriticasFaltantes = faltantes(CRITICAS);
    const envRecomendadasFaltantes = faltantes(RECOMENDADAS);

    // ── Supabase: una lectura barata contra el catálogo ──
    // Se elige `productos` porque es exactamente la tabla de la que
    // `crear-orden` saca el precio autoritativo: si ésta no responde, no se
    // puede cobrar. `head: true` no trae filas, sólo el count.
    let supabase: { ok: boolean; latencia_ms: number | null; error: string | null } = {
        ok: false, latencia_ms: null, error: 'no evaluado',
    };

    if (envCriticasFaltantes.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        envCriticasFaltantes.includes('NEXT_PUBLIC_SUPABASE_URL')) {
        supabase = { ok: false, latencia_ms: null, error: 'sin credenciales' };
    } else {
        const t0 = Date.now();
        try {
            const { error } = await createAdminClient()
                .from('productos')
                .select('id', { count: 'exact', head: true })
                .limit(1);
            supabase = error
                ? { ok: false, latencia_ms: Date.now() - t0, error: error.message }
                : { ok: true, latencia_ms: Date.now() - t0, error: null };
        } catch (e) {
            supabase = {
                ok: false,
                latencia_ms: Date.now() - t0,
                error: e instanceof Error ? e.message : 'error desconocido',
            };
        }
    }

    const sano = supabase.ok && envCriticasFaltantes.length === 0;
    const status = sano ? 'ok' : 'degraded';
    const httpStatus = sano ? 200 : 503;

    // ── Respuesta pública: mínima a propósito ──
    const esAdmin = requireAdmin(request) === null;
    if (!esAdmin) {
        return NextResponse.json(
            { status, timestamp: new Date().toISOString() },
            { status: httpStatus },
        );
    }

    // ── Respuesta admin: el detalle, siempre en booleanos ──
    return NextResponse.json(
        {
            status,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            // Cuál de los dos entornos de NAVE está activo. Es EL dato que hay
            // que mirar antes y después del go-live: `production` sobre código
            // sin verificar ya pasó una vez (19-ago).
            nave_environment: process.env.NAVE_ENVIRONMENT ?? 'no seteado',
            oca_sandbox: process.env.OCA_SANDBOX === 'true',
            vercel: {
                commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
                branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
                region: process.env.VERCEL_REGION ?? null,
            },
            checks: {
                supabase,
                env_criticas: {
                    ok: envCriticasFaltantes.length === 0,
                    faltantes: envCriticasFaltantes,
                },
                env_recomendadas: {
                    ok: envRecomendadasFaltantes.length === 0,
                    faltantes: envRecomendadasFaltantes,
                },
            },
            latencia_total_ms: Date.now() - inicio,
        },
        { status: httpStatus },
    );
}
