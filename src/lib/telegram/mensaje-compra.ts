/**
 * Mensaje de "entró una compra" para Telegram.
 *
 * Función pura y sin imports a propósito: la prueba el runner nativo de Node
 * (`tests/telegram-mensaje-compra.test.ts`), que no resuelve el alias `@/`.
 * Lo que necesita de otros módulos (la etiqueta del tipo de envío) llega ya
 * resuelto en los datos.
 *
 * Formato: HTML de Telegram (`parse_mode: 'HTML'`). Todo lo que viene del
 * cliente — nombre, dirección, email — pasa por `escaparHTML`: un `<` en un
 * nombre rompería el parseo y Telegram rechazaría el mensaje entero.
 */

export interface ItemCompra {
    nombre: string;
    color: string;
    talle: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    sku: string | null;
    /** Stock de la variante DESPUÉS de esta venta. `null` si no se pudo leer. */
    stockRestante: number | null;
    oneOfOne: boolean;
}

export interface DatosCompra {
    numeroOrden: number | null;
    totalCentavos: number;
    subtotalCentavos: number;
    costoEnvioCentavos: number;
    descuentoCentavos: number;
    codigoDescuento: string | null;
    /** Etiqueta legible, de `etiquetaTipoEnvio()`. */
    entrega: string;
    esRetiro: boolean;
    /** Dirección, sucursal o instrucción, ya armada en líneas. */
    detalleEntrega: string[];
    cliente: {
        nombre: string;
        email: string | null;
        telefono: string | null;
    };
    items: ItemCompra[];
    montoCobradoArs: number | null;
    pagadoAt: string | null;
}

export function escaparHTML(texto: string): string {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatearARS(centavos: number): string {
    const pesos = Math.round((Number(centavos) || 0) / 100);
    return '$' + pesos.toLocaleString('es-AR');
}

function fechaArgentina(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    // Se arma a mano desde las partes: `toLocaleString` cambia de formato según
    // el ICU del runtime ("15:30" en uno, "03:30 p. m." en otro).
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(d).map(p => [p.type, p.value])
    );
    // Y se rellena igual: hay ICU que ignora '2-digit' en el día.
    const dos = (s: string) => s.padStart(2, '0');
    return `${dos(partes.day)}/${dos(partes.month)} ${dos(partes.hour)}:${dos(partes.minute)}`;
}

function lineaStock(item: ItemCompra): string | null {
    if (item.stockRestante == null) return null;
    if (item.stockRestante <= 0) {
        // La vidriera NO lee el stock de Supabase: decide "vendido" con el flag
        // `soldOut` de start.js. Si nadie lo marca, la prenda se sigue vendiendo.
        return '⚠️ <b>SIN STOCK</b> — marcarlo vendido en la web (soldOut en start.js)';
    }
    if (item.oneOfOne) return `quedan ${item.stockRestante} (pieza 1/1 — revisar)`;
    return `quedan ${item.stockRestante}`;
}

export function armarMensajeCompra(d: DatosCompra): string {
    const e = escaparHTML;
    const lineas: string[] = [];

    const numero = d.numeroOrden != null ? ` #${d.numeroOrden}` : '';
    lineas.push(`🛒 <b>NUEVA COMPRA${numero}</b> — ${formatearARS(d.totalCentavos)}`);
    const cuando = fechaArgentina(d.pagadoAt);
    if (cuando) lineas.push(`<i>Pagada ${cuando}</i>`);
    lineas.push('');

    for (const item of d.items) {
        const sub = formatearARS(item.precioUnitarioCentavos * item.cantidad);
        lineas.push(`• ${item.cantidad}× <b>${e(item.nombre)}</b> — ${e(item.color)} · talle ${e(item.talle)} — ${sub}`);
        const detalle = [item.sku ? `<code>${e(item.sku)}</code>` : null, lineaStock(item)]
            .filter(Boolean)
            .join(' · ');
        if (detalle) lineas.push(`   ${detalle}`);
    }
    lineas.push('');

    lineas.push(`Subtotal ${formatearARS(d.subtotalCentavos)}`);
    lineas.push(`Envío ${d.costoEnvioCentavos > 0 ? formatearARS(d.costoEnvioCentavos) : 'sin cargo'}`);
    if (d.descuentoCentavos > 0) {
        const codigo = d.codigoDescuento ? ` (${e(d.codigoDescuento)})` : '';
        lineas.push(`Descuento −${formatearARS(d.descuentoCentavos)}${codigo}`);
    }
    if (d.montoCobradoArs != null) {
        lineas.push(`Cobrado por NAVE $${Number(d.montoCobradoArs).toLocaleString('es-AR')}`);
    }
    lineas.push('');

    lineas.push('<b>Cliente</b>');
    lineas.push(e(d.cliente.nombre || 'Sin nombre'));
    if (d.cliente.email) lineas.push(e(d.cliente.email));
    if (d.cliente.telefono) lineas.push(e(d.cliente.telefono));
    lineas.push('');

    lineas.push(`<b>Entrega</b> — ${e(d.entrega)}`);
    for (const l of d.detalleEntrega) lineas.push(e(l));
    if (d.esRetiro) {
        lineas.push('👉 Escribirle para coordinar lugar y horario. No se genera envío en OCA.');
    }

    return lineas.join('\n');
}
