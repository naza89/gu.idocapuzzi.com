import { NextRequest, NextResponse } from 'next/server';
import { safeEqualStr } from '@/lib/security';

/**
 * Guard para endpoints de backoffice (OCA: crear-envío, anular, etiqueta,
 * tracking, centros-costo). NO son parte del storefront: sólo se llaman a mano
 * desde la terminal de Naza. Antes estaban abiertos a internet, lo que permitía
 * anular envíos ajenos, enumerar etiquetas con datos personales y generar
 * retiros facturados a la cuenta.
 *
 * Uso en una route:
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 *
 * Se manda el token en el header `x-admin-token`, comparado contra la env var
 * `ADMIN_API_TOKEN` (scope Production en Vercel).
 *
 * FAIL-CLOSED: si `ADMIN_API_TOKEN` no está configurada, la ruta se bloquea
 * (401). Es lo contrario del webhook viejo de Galicia, que aceptaba todo si el
 * secreto no estaba seteado.
 *
 * @returns una NextResponse 401 si el acceso está denegado, o null si es válido.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
        console.error('[admin-auth] ADMIN_API_TOKEN no configurada — ruta de backoffice bloqueada');
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const provided = req.headers.get('x-admin-token');
    if (!safeEqualStr(provided, expected)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return null;
}
