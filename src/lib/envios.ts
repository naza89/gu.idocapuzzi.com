/**
 * Tipos de envío — fuente de verdad del lado del servidor.
 *
 * `ordenes.tipo_envio` es TEXT libre (no hay CHECK en la tabla), así que estos
 * literales son el único contrato. El front los escribe desde
 * `public/js/start.js` (mapa `TIPOS_ENVIO`, no puede importar de `src/`), y hay
 * un test que verifica que los dos lados usen las mismas cadenas.
 *
 * ⚠️ Si cambiás un literal, las órdenes viejas quedan con el valor anterior:
 * son datos ya persistidos, no una enum. Migrar antes de renombrar.
 */

/** Envío OCA a domicilio. */
export const TIPO_ENVIO_DOMICILIO = 'puerta_puerta';

/** Envío OCA a sucursal, para retirar por el punto que eligió el cliente. */
export const TIPO_ENVIO_SUCURSAL = 'sucursal';

/**
 * Retiro coordinado en mano, sin cargo y sin OCA.
 *
 * Agregado el 2026-08-22 para que quien pueda pasar a buscar la pieza no tenga
 * que pagar el envío. Es el único tipo que legítimamente vale $0.
 *
 * ⚠️ Una orden con este tipo NO debe generar envío en OCA. El guard vive en
 * `src/app/api/webhooks/nave/route.ts`, en el bloque post-pago: sin él, OCA
 * emite una etiqueta real y despacha un correo a buscar un paquete que se
 * entrega en mano.
 */
export const TIPO_ENVIO_RETIRO = 'retiro_local';

/** Etiqueta legible, para mails y para el detalle de la orden en /cuenta. */
export function etiquetaTipoEnvio(tipo: string | null | undefined): string {
    switch (tipo) {
        case TIPO_ENVIO_RETIRO:
            return 'Retiro coordinado — sin cargo';
        case TIPO_ENVIO_SUCURSAL:
            return 'OCA — Retiro en sucursal';
        default:
            return 'OCA — Envío a domicilio';
    }
}

/** `true` si el tipo de envío no debe generar un despacho en OCA. */
export function esRetiroEnMano(tipo: string | null | undefined): boolean {
    return tipo === TIPO_ENVIO_RETIRO;
}
