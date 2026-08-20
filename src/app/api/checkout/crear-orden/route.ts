/**
 * POST /api/checkout/crear-orden
 *
 * Crea (o re-sincroniza) la orden del checkout Step 1 SERVER-SIDE con el
 * service_role. Reemplaza los inserts que antes hacía el browser con la anon key.
 *
 * ⚠️ SEGURIDAD:
 *   - Los precios NO vienen del browser: se resuelven contra el catálogo
 *     (`productos.precio_centavos`) a partir del SKU/variante de cada item.
 *   - Con esto, sumado al RLS cerrado (migración 17), el cliente ya no puede
 *     insertar órdenes con precios arbitrarios ni marcar una orden como pagada.
 *
 * Body:
 *   {
 *     datos: { email, nombre, apellido, telefono, newsletter,
 *              direccion, departamento, ciudad, provincia, cp },
 *     items: [{ sku?, name?, colorway?, size?, color?, qty }],
 *     existingOrdenId?, existingDireccionId?
 *   }
 *
 * Respuesta: { ordenId, numeroOrden, clienteId, direccionId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface DatosCheckout {
    email: string;
    nombre: string;
    apellido: string;
    telefono: string;
    newsletter?: boolean;
    direccion: string;
    departamento?: string;
    ciudad: string;
    provincia: string;
    cp: string;
}

interface ItemIn {
    sku?: string;
    name?: string;
    colorway?: string;
    size?: string;
    color?: string;
    qty?: number;
}

interface Body {
    datos: DatosCheckout;
    items: ItemIn[];
    existingOrdenId?: string | null;
    existingDireccionId?: string | null;
}

const ESTADOS_ORDEN_REUTILIZABLE = ['pendiente', 'envio_calculado'];

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as Body;
        const { datos, items } = body;
        let { existingOrdenId } = body;
        const { existingDireccionId } = body;

        // ── Validación mínima server-side ──
        if (!datos || typeof datos !== 'object') {
            return NextResponse.json({ error: 'Faltan los datos del checkout' }, { status: 400 });
        }
        const requeridos: (keyof DatosCheckout)[] = [
            'email', 'nombre', 'apellido', 'direccion', 'ciudad', 'provincia', 'cp', 'telefono',
        ];
        for (const campo of requeridos) {
            if (!datos[campo] || String(datos[campo]).trim() === '') {
                return NextResponse.json({ error: `Falta el campo ${campo}` }, { status: 400 });
            }
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
            return NextResponse.json({ error: 'El email no es válido' }, { status: 400 });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // ── 1. Upsert cliente por email ──
        const { data: clienteExistente, error: errBuscarCli } = await supabase
            .from('clientes')
            .select('id')
            .eq('email', datos.email)
            .limit(1)
            .maybeSingle();
        if (errBuscarCli) {
            console.error('[crear-orden] Error buscando cliente:', errBuscarCli);
            return NextResponse.json({ error: 'Error al procesar el cliente' }, { status: 500 });
        }

        let clienteId: string;
        if (clienteExistente) {
            const { data: upd, error } = await supabase
                .from('clientes')
                .update({
                    nombre: datos.nombre,
                    apellido: datos.apellido,
                    telefono: datos.telefono,
                    newsletter: !!datos.newsletter,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', clienteExistente.id)
                .select('id')
                .single();
            if (error || !upd) {
                console.error('[crear-orden] Error actualizando cliente:', error);
                return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
            }
            clienteId = upd.id;
        } else {
            const { data: nuevo, error } = await supabase
                .from('clientes')
                .insert({
                    email: datos.email,
                    nombre: datos.nombre,
                    apellido: datos.apellido,
                    telefono: datos.telefono,
                    newsletter: !!datos.newsletter,
                })
                .select('id')
                .single();
            if (error || !nuevo) {
                console.error('[crear-orden] Error creando cliente:', error);
                return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
            }
            clienteId = nuevo.id;
        }

        // ── 2. Dirección de envío (insert o update de re-entrada) ──
        const departamento = (datos.departamento || '').trim();
        const direccionPayload = {
            cliente_id: clienteId,
            direccion: datos.direccion + (departamento ? `, ${departamento}` : ''),
            departamento: departamento || null,
            ciudad: datos.ciudad,
            provincia: datos.provincia,
            codigo_postal: datos.cp,
            es_predeterminada: true,
            calle: datos.direccion ? datos.direccion.replace(/\s+\d+\s*$/, '').trim() : null,
            numero: datos.direccion ? (datos.direccion.match(/(\d+)\s*$/) || [])[1] || '' : null,
            piso: departamento ? departamento.replace(/[^\d]/g, '').slice(0, 5) || null : null,
            depto: departamento ? departamento.replace(/^\d+\s*/, '').trim() || null : null,
        };

        let direccionId: string | null = null;
        if (existingDireccionId) {
            const { data: upd, error } = await supabase
                .from('direcciones_envio')
                .update(direccionPayload)
                .eq('id', existingDireccionId)
                .eq('cliente_id', clienteId)
                .select('id')
                .single();
            if (error || !upd) {
                // La dirección de sesión no matcheó (p.ej. otro cliente): insertamos nueva.
                console.warn('[crear-orden] Dirección de re-entrada no válida, se crea una nueva');
            } else {
                direccionId = upd.id;
            }
        }
        if (!direccionId) {
            const { data: dir, error } = await supabase
                .from('direcciones_envio')
                .insert(direccionPayload)
                .select('id')
                .single();
            if (error || !dir) {
                console.error('[crear-orden] Error guardando dirección:', error);
                return NextResponse.json({ error: 'Error al guardar la dirección' }, { status: 500 });
            }
            direccionId = dir.id;
        }

        // ── 3. Resolver variante + precio AUTORITATIVO de cada item ──
        const itemsResueltos: Array<{
            variante_id: string;
            nombre_producto: string;
            color: string;
            talle: string;
            precio_unitario_centavos: number;
            cantidad: number;
            subtotal_centavos: number;
        }> = [];
        const noResueltos: string[] = [];

        for (const item of items) {
            const qty = Math.max(1, Number(item.qty) || 1);
            let variante: { id: string; precio: number } | null = null;

            if (item.sku) {
                const { data } = await supabase
                    .from('variantes_producto')
                    .select('id, productos!inner(precio_centavos)')
                    .eq('sku', item.sku)
                    .limit(1)
                    .maybeSingle();
                const precio = (data as { productos?: { precio_centavos?: number } } | null)?.productos?.precio_centavos;
                if (data && precio != null) variante = { id: data.id, precio };
            }

            if (!variante && item.name) {
                const { data } = await supabase
                    .from('variantes_producto')
                    .select('id, productos!inner(nombre, precio_centavos)')
                    .eq('productos.nombre', item.name)
                    .eq('colorway', item.colorway || '')
                    .eq('talle', item.size || '')
                    .limit(1)
                    .maybeSingle();
                const precio = (data as { productos?: { precio_centavos?: number } } | null)?.productos?.precio_centavos;
                if (data && precio != null) variante = { id: data.id, precio };
            }

            if (!variante) {
                noResueltos.push(`${item.name || item.sku || 'producto'} ${item.size || ''}`.trim());
                continue;
            }

            itemsResueltos.push({
                variante_id: variante.id,
                nombre_producto: item.name || '',
                color: item.color || '',
                talle: item.size || '',
                precio_unitario_centavos: variante.precio,
                cantidad: qty,
                subtotal_centavos: variante.precio * qty,
            });
        }

        if (noResueltos.length > 0) {
            // Falla visible: no creamos una orden con items sin precio verificable
            // (esto incluye las piezas 1/1 mientras su talle no coincida con la DB).
            console.error('[crear-orden] Items sin variante/precio:', noResueltos);
            return NextResponse.json(
                { error: `No pudimos procesar: ${noResueltos.join(', ')}. Escribinos y lo resolvemos.` },
                { status: 409 }
            );
        }

        const subtotalCentavos = itemsResueltos.reduce((acc, it) => acc + it.subtotal_centavos, 0);

        // ── 4. Crear o re-sincronizar la orden ──
        // Re-entrada: sólo se reutiliza la orden si sigue sin pagar.
        let ordenId: string | null = null;
        let numeroOrden: number | string | null = null;

        if (existingOrdenId) {
            const { data: ordenPrev } = await supabase
                .from('ordenes')
                .select('id, estado, cliente_id, numero_orden')
                .eq('id', existingOrdenId)
                .maybeSingle();
            if (
                ordenPrev &&
                ordenPrev.cliente_id === clienteId &&
                ESTADOS_ORDEN_REUTILIZABLE.includes(ordenPrev.estado)
            ) {
                ordenId = ordenPrev.id;
                numeroOrden = ordenPrev.numero_orden;
                // Re-sincronizar items + montos con el carrito actual
                await supabase.from('items_orden').delete().eq('orden_id', ordenId);
                await supabase
                    .from('ordenes')
                    .update({
                        direccion_envio_id: direccionId,
                        estado: 'pendiente',
                        subtotal_centavos: subtotalCentavos,
                        costo_envio_centavos: 0,
                        total_centavos: subtotalCentavos,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', ordenId);
            } else {
                // La orden de sesión no sirve (pagada, de otro cliente, o inexistente)
                existingOrdenId = null;
            }
        }

        if (!ordenId) {
            const { data: orden, error: errOrden } = await supabase
                .from('ordenes')
                .insert({
                    cliente_id: clienteId,
                    direccion_envio_id: direccionId,
                    estado: 'pendiente',
                    subtotal_centavos: subtotalCentavos,
                    costo_envio_centavos: 0,
                    descuento_centavos: 0,
                    total_centavos: subtotalCentavos,
                })
                .select('id, numero_orden')
                .single();
            if (errOrden || !orden) {
                console.error('[crear-orden] Error creando orden:', errOrden);
                return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 });
            }
            ordenId = orden.id;
            numeroOrden = orden.numero_orden;
        }

        // ── 5. Insertar items ──
        const { error: errItems } = await supabase
            .from('items_orden')
            .insert(itemsResueltos.map((it) => ({ ...it, orden_id: ordenId })));
        if (errItems) {
            console.error('[crear-orden] Error insertando items:', errItems);
            return NextResponse.json({ error: 'Error al guardar los items de la orden' }, { status: 500 });
        }

        console.log('[crear-orden] ✅ Orden lista:', numeroOrden, '| ID:', ordenId, '| items:', itemsResueltos.length);

        return NextResponse.json({
            ordenId,
            numeroOrden,
            clienteId,
            direccionId,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[crear-orden] ERROR:', message, err);
        return NextResponse.json({ error: 'Error inesperado al procesar la orden' }, { status: 500 });
    }
}
