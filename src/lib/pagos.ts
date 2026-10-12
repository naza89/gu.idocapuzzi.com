/**
 * Métodos de pago — fuente de verdad del lado del servidor.
 *
 * `ordenes.metodo_pago` y `ordenes.estado` son TEXT libre (no hay CHECK en la
 * tabla), así que estos literales son el único contrato. El front
 * (`public/js/start.js`, `public/js/checkout-payment.js`) no puede importar de
 * `src/`: `tests/pago-transferencia.test.ts` verifica que los dos lados usen las
 * mismas cadenas y el mismo porcentaje de descuento.
 *
 * Mismo esquema que `src/lib/envios.ts`.
 */

/** Tarjeta o MODO: el cobro lo hace NAVE en su checkout hosted. */
export const METODO_PAGO_NAVE = 'nave';

/** Transferencia bancaria: el cliente transfiere y el equipo confirma a mano (WIDO). */
export const METODO_PAGO_TRANSFERENCIA = 'transferencia';

/**
 * Estado de una orden por transferencia que todavía no se acreditó.
 *
 * Es un estado PROPIO y no `pago_pendiente` a propósito: `pago_pendiente` lo
 * barren el cron de conciliación y la red de seguridad del GET contra NAVE. Una
 * transferencia no tiene nada que conciliar en NAVE, y mezclarlas haría que el
 * día que alguien afloje un filtro, el cron consulte a NAVE por órdenes que NAVE
 * nunca vio.
 */
export const ESTADO_ESPERANDO_TRANSFERENCIA = 'esperando_transferencia';

/**
 * Descuento por pagar con transferencia, en porcentaje sobre los PRODUCTOS.
 * El envío no se descuenta: es lo que se le paga a OCA.
 *
 * Es la promo que comunican los anuncios ("15% off con transferencia").
 * Si cambia, cambia acá y en las dos constantes del front (el test lo exige).
 */
export const DESCUENTO_TRANSFERENCIA_PCT = 15;

/** Código que queda en `ordenes.codigo_descuento` para identificar la promo. */
export const CODIGO_DESCUENTO_TRANSFERENCIA = 'TRANSFERENCIA';

/** Horas que se reserva la compra esperando el comprobante (se comunica al cliente). */
export const HORAS_PARA_TRANSFERIR = 48;

/**
 * Descuento en centavos para un subtotal de productos en centavos.
 * Se redondea a pesos enteros: nadie transfiere centavos.
 */
export function calcularDescuentoTransferencia(subtotalCentavos: number): number {
    if (!Number.isFinite(subtotalCentavos) || subtotalCentavos <= 0) return 0;
    const descuentoPesos = Math.round((subtotalCentavos / 100) * DESCUENTO_TRANSFERENCIA_PCT / 100);
    return descuentoPesos * 100;
}

export interface DatosTransferencia {
    alias: string | null;
    cbu: string | null;
    titular: string;
    cuit: string | null;
    banco: string | null;
    /** Casilla a la que el cliente manda el comprobante. */
    emailComprobante: string;
}

/**
 * Datos de la cuenta donde se transfiere. Vienen de env vars para que cambiar
 * de cuenta no requiera un deploy de código:
 *
 *   TRANSFERENCIA_ALIAS, TRANSFERENCIA_CBU   (al menos uno)
 *   TRANSFERENCIA_TITULAR                    (obligatorio)
 *   TRANSFERENCIA_CUIT, TRANSFERENCIA_BANCO  (opcionales)
 *   TRANSFERENCIA_EMAIL_COMPROBANTE          (default ventas@guidocapuzzi.com)
 *
 * FAIL-CLOSED: si falta el titular o faltan alias y CBU a la vez, devuelve null
 * y la opción de transferencia NO se ofrece. Mostrar la opción sin datos sería
 * dejar a un cliente con una orden reservada y ningún lugar a donde pagar.
 *
 * Se lee en cada llamada, nunca a nivel de módulo.
 */
export function datosTransferencia(): DatosTransferencia | null {
    const limpio = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
    const alias = limpio(process.env.TRANSFERENCIA_ALIAS);
    const cbu = limpio(process.env.TRANSFERENCIA_CBU);
    const titular = limpio(process.env.TRANSFERENCIA_TITULAR);
    if (!titular || (!alias && !cbu)) return null;
    return {
        alias,
        cbu,
        titular,
        cuit: limpio(process.env.TRANSFERENCIA_CUIT),
        banco: limpio(process.env.TRANSFERENCIA_BANCO),
        emailComprobante: limpio(process.env.TRANSFERENCIA_EMAIL_COMPROBANTE) || 'ventas@guidocapuzzi.com',
    };
}
