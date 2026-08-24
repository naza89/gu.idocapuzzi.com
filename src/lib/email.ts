/**
 * Email transaccional — GÜIDO CAPUZZI
 * Usa Resend con dominio guidocapuzzi.com (verificado)
 * From: ventas@guidocapuzzi.com
 *
 * Templates disponibles:
 *   sendOrderConfirmationEmail(ordenId)              → Confirmación de compra (trigger: webhook NAVE APPROVED)
 *   sendShippingStatusEmail(ordenId, idEstado, ...) → Actualizaciones de estado del envío OCA
 */

import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase';
import { etiquetaTipoEnvio } from '@/lib/envios';

/**
 * Cliente de Resend, construido perezosamente.
 *
 * ⚠️ NO construir a nivel de módulo. `new Resend(undefined)` TIRA
 * ("Missing API key"), y este archivo lo importan los DOS webhooks del camino
 * del dinero (`/api/webhooks/nave` y `/api/webhooks/oca`). Un throw en el
 * import se lleva puesta la ruta entera: sin `RESEND_API_KEY`, NAVE no podría
 * avisar que una orden se pagó — no es que fallaría el mail, es que fallaría
 * el procesamiento del pago.
 *
 * Con la construcción diferida, la falta de la clave degrada sólo el envío del
 * mail, que es lo que corresponde, y queda registrada en el log.
 *
 * Lo encontró el primer run del CI (2026-08-20): `next build` sin
 * `RESEND_API_KEY` fallaba con "Failed to collect page data for
 * /api/webhooks/oca". En local y en Vercel no se veía porque la variable
 * siempre estaba.
 */
let resendCliente: Resend | null = null;

function getResend(): Resend | null {
    if (resendCliente) return resendCliente;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[email] RESEND_API_KEY no configurada — no se envía el mail');
        return null;
    }
    resendCliente = new Resend(apiKey);
    return resendCliente;
}

/**
 * Logo de los mails — PNG rasterizado de `public/assets/brand/logo-guido-registrado.svg`
 * (1000×116, alpha, ~13KB), subido al bucket `assets` el 2026-08-21.
 *
 * ⚠️ NO apuntar esto a un `.svg`. Gmail lo strippea y Outlook no lo soporta:
 * el logo desaparecería en la mayoría de los clientes. El SVG de marca es la
 * fuente; lo que se sirve al mail tiene que ser raster.
 *
 * Reemplaza a `mail_smtp.png`, que era el logo dibujado en **Univers** (subido
 * el 2026-02-18, anterior al cambio de marca del 2026-08-06). Al ser una imagen,
 * no tenía fallback que lo salvara: era el único lugar donde la tipografía vieja
 * seguía visible de verdad.
 *
 * Para regenerarlo tras un cambio de marca:
 *   node -e "require('sharp')(require('fs').readFileSync('public/assets/brand/logo-guido-registrado.svg'),{density:600}).resize(1000,116).png().toFile('logo.png')"
 */
const LOGO_URL = 'https://zwzzrqjmnrlkltuijjjf.supabase.co/storage/v1/object/public/assets/mail-logo-registrado.png';

/**
 * CSS compartido por los dos templates.
 *
 * ⚠️ NO agregar `@font-face` acá. Se sacó a propósito (2026-08-21):
 *
 * 1. No funciona. Gmail (web y apps), Outlook desktop y Yahoo strippean
 *    `@font-face` por completo. Sólo lo renderiza Apple Mail / iOS Mail. Los
 *    mails ya venían cayendo al fallback en la enorme mayoría de los casos.
 * 2. Licencia. Servir Helvetica Neue desde el bucket público de Supabase es
 *    exactamente el web-embedding que falta licenciar con Monotype — el
 *    bloqueante de lanzamiento abierto. No se extiende a una segunda
 *    superficie hasta resolverlo.
 *
 * Hasta el 2026-08-21 esto cargaba UniversCnBold.ttf y UniversRegular.ttf
 * desde Supabase Storage, con la marca ya migrada a Helvetica desde el
 * 2026-08-06. Los títulos caían en 'Arial Narrow', que no es la marca en
 * ningún escenario.
 *
 * Los stacks de abajo resuelven sin descargar nada: en macOS/iOS
 * 'HelveticaNeue-CondensedBold' engancha la condensada real del sistema; en
 * Windows/Gmail cae a Arial Narrow.
 *
 * ⚠️ NO agregar 'Helvetica Neue Condensed' ni 'Helvetica Neue' a la cadena.
 * En Windows esos nombres SÍ resuelven (por fuente instalada o por la tabla de
 * sustitución) y se comen el fallback: nunca se llega a Arial Narrow y el texto
 * sale en ancho normal. Medido con el mismo texto y estilos: la cadena con
 * 'Helvetica Neue Condensed' daba 423px (= Arial); sin él da 349px, idéntico a
 * forzar 'Arial Narrow'. El nombre PostScript no matchea nada en Windows, que
 * es justamente lo que lo hace seguro como primer nombre.
 *
 * **Todo el texto va en condensed**, no sólo los títulos — decisión de marca de
 * Naza (2026-08-21). Por eso las 13 declaraciones son idénticas: en email no se
 * puede confiar en la herencia de `font-family`, así que se declara en cada
 * regla en vez de sólo en `body`.
 */

function emailBaseStyles(): string {
    return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #efefef;
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-weight: 400;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #fafafa; }
    .header { padding: 48px 48px 36px; border-bottom: 1px solid #e0e0e0; }
    .logo-img { display: block; width: 500px; max-width: 100%; height: auto; }
    .body { padding: 48px 48px 40px; }
    .eyebrow {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: #999; margin-bottom: 16px;
    }
    .heading {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-weight: 700; font-size: 56px;
      letter-spacing: 0.02em; line-height: 1.0;
      color: #1a1a1a; margin-bottom: 24px; text-transform: uppercase;
    }
    .copy {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 13px; font-weight: 400;
      line-height: 1.8; color: #555;
      margin-bottom: 36px; max-width: 440px;
    }
    table { border-collapse: collapse; width: 100%; }
    .items-header th {
      padding: 0 0 10px; border-bottom: 1px solid #1a1a1a;
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.14em; text-transform: uppercase; color: #999;
    }
    .items-header th:first-child { text-align: left; }
    .items-header th:nth-child(2) { text-align: center; }
    .items-header th:last-child { text-align: right; }
    .item-row td { padding: 12px 0; border-bottom: 1px solid #ebebeb; vertical-align: top; }
    .item-name {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 13px; color: #1a1a1a; line-height: 1.4; margin: 0;
    }
    .item-variant {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 11px; color: #999;
      letter-spacing: 0.04em; text-transform: uppercase; margin: 2px 0 0;
    }
    .item-qty { text-align: center; font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif; font-size: 13px; color: #1a1a1a; }
    .item-price { text-align: right; font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif; font-size: 13px; color: #1a1a1a; white-space: nowrap; }
    .totals-row td { padding: 5px 0; font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif; font-size: 12px; }
    .totals-label { color: #999; }
    .totals-value { text-align: right; color: #1a1a1a; }
    .total-row td {
      padding: 14px 0 0; border-top: 1px solid #e0e0e0;
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 18px; font-weight: 700;
      letter-spacing: 0.04em; text-transform: uppercase; color: #1a1a1a;
    }
    .total-amount { text-align: right; color: #ad1c1c; white-space: nowrap; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 36px 0 0; }
    .footer { padding: 0 48px 48px; }
    .footer-note {
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 11px; font-weight: 400; line-height: 1.8; color: #aaa;
    }
    .footer-note a { color: #1a1a1a; text-decoration: none; }
    .footer-domain {
      margin-top: 6px;
      font-family: 'HelveticaNeue-CondensedBold', 'Arial Narrow', Arial, sans-serif;
      font-size: 10px; color: #ccc;
    }
    .accent-bar { height: 4px; background-color: #ad1c1c; }

    /* ── Mobile responsive ── */
    @media screen and (max-width: 480px) {
      .wrapper { width: 100% !important; }
      .header { padding: 28px 24px 24px !important; }
      .logo-img { width: 100% !important; }
      .body { padding: 28px 24px 24px !important; }
      .eyebrow { font-size: 9px !important; }
      .heading { font-size: 28px !important; line-height: 1.1 !important; margin-bottom: 16px !important; }
      .copy { font-size: 12px !important; }
      .item-name { font-size: 12px !important; }
      .item-variant { font-size: 10px !important; }
      .item-qty { font-size: 12px !important; }
      .item-price { font-size: 12px !important; }
      .totals-row td { font-size: 11px !important; }
      .total-row td { font-size: 16px !important; }
      .footer { padding: 0 24px 28px !important; }
      .footer-note { font-size: 10px !important; }
    }
  `;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ItemOrden = {
    nombre_producto: string;
    color: string;
    talle: string;
    cantidad: number;
    precio_unitario_centavos: number;
};

type ClienteOrden = {
    nombre: string;
    apellido: string;
    email: string;
};

function formatARS(centavos: number): string {
    return `$${Math.round(centavos / 100).toLocaleString('es-AR')}`;
}

// ─── Template: Confirmación de compra ─────────────────────────────────────────

export async function sendOrderConfirmationEmail(ordenId: string): Promise<void> {
    const supabase = createAdminClient();

    const { data: orden, error } = await supabase
        .from('ordenes')
        .select(`
            numero_orden,
            total_centavos,
            subtotal_centavos,
            costo_envio_centavos,
            tipo_envio,
            clientes (nombre, apellido, email),
            items_orden (nombre_producto, color, talle, cantidad, precio_unitario_centavos)
        `)
        .eq('id', ordenId)
        .single();

    if (error || !orden) {
        console.error('[email] No se pudo obtener la orden:', error);
        return;
    }

    const cliente = orden.clientes as unknown as ClienteOrden | null;
    if (!cliente?.email) {
        console.error('[email] Orden sin email de cliente:', ordenId);
        return;
    }

    const items = (orden.items_orden as ItemOrden[]) || [];

    // Ojo: esto era un ternario, y un ternario tiene dos ramas. Con un tercer
    // tipo de envío (`retiro_local`) el mail le decía al cliente que su compra
    // viajaba a domicilio cuando en realidad la pasaba a buscar.
    const tipoEnvio = etiquetaTipoEnvio(orden.tipo_envio);

    const itemsHTML = items.map(item => `
        <tr class="item-row">
          <td>
            <p class="item-name">${item.nombre_producto}</p>
            <p class="item-variant">${item.color} &middot; ${item.talle}</p>
          </td>
          <td class="item-qty">${item.cantidad}</td>
          <td class="item-price">${formatARS(item.precio_unitario_centavos * item.cantidad)}</td>
        </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Orden #${orden.numero_orden} confirmada — GÜIDO CAPUZZI</title>
  <style>${emailBaseStyles()}</style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <img class="logo-img" src="${LOGO_URL}" alt="Güido Capuzzi" width="500" />
    </div>

    <div class="body">
      <p class="eyebrow">Confirmación de compra</p>

      <h1 class="heading">Orden #${orden.numero_orden}<br>confirmada.</h1>

      <p class="copy">
        Hola ${cliente.nombre}, tu pedido fue recibido y el pago fue confirmado.<br>
        En breve nos ponemos en contacto para coordinar el envío.
      </p>

      <!-- Items -->
      <table>
        <thead class="items-header">
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <!-- Totales -->
      <table style="margin-top:16px;">
        <tr class="totals-row">
          <td class="totals-label">Subtotal</td>
          <td class="totals-value">${formatARS(orden.subtotal_centavos)}</td>
        </tr>
        <tr class="totals-row">
          <td class="totals-label">${tipoEnvio}</td>
          <td class="totals-value">${formatARS(orden.costo_envio_centavos || 0)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td class="total-amount">${formatARS(orden.total_centavos)}</td>
        </tr>
      </table>

      <hr class="divider" />
    </div>

    <div class="footer">
      <p class="footer-note">
        Ante cualquier consulta respondé este email a
        <a href="mailto:ventas@guidocapuzzi.com">ventas@guidocapuzzi.com</a>
      </p>
      <p class="footer-domain">GÜIDO CAPUZZI — güidocapuzzi.com</p>
    </div>

    <div class="accent-bar"></div>

  </div>
</body>
</html>
    `.trim();

    const resend = getResend();
    if (!resend) return;   // getResend ya logueó el motivo

    const { error: sendError } = await resend.emails.send({
        from: 'GÜIDO CAPUZZI <ventas@guidocapuzzi.com>',
        to: cliente.email,
        replyTo: 'ventas@guidocapuzzi.com',
        subject: `Orden #${orden.numero_orden} confirmada — GÜIDO CAPUZZI`,
        html,
    });

    if (sendError) {
        console.error('[email] Resend error:', sendError);
    } else {
        console.log('[email] ✅ Email enviado a:', cliente.email, '— orden:', ordenId);
    }
}

// ─── Template: Cambios de estado del envío OCA ────────────────────────────────

// Forma real del objeto `sucursal` que envía el webhook de novedades de OCA.
// (ver docs/external/Webhook OCA.pdf, sección 3.1)
interface Sucursal {
    sigla?: string;
    descripcion?: string;
    calle?: string;
    numero?: string;
    localidad?: string;
    provincia?: string;
    latitud?: number;
    longitud?: number;
}

export async function sendShippingStatusEmail(
    ordenId: string,
    idEstado: number,
    sucursal?: Sucursal,
    motivo?: string
): Promise<void> {
    const supabase = createAdminClient();

    const { data: orden, error } = await supabase
        .from('ordenes')
        .select(`
            numero_orden,
            clientes (nombre, email)
        `)
        .eq('id', ordenId)
        .single();

    if (error || !orden) {
        console.error('[email] No se pudo obtener la orden:', error);
        return;
    }

    const cliente = orden.clientes as unknown as ClienteOrden | null;
    if (!cliente?.email) {
        console.error('[email] Orden sin email de cliente:', ordenId);
        return;
    }

    // OCA envía idEstado como string ("7"). Normalizar a número para el switch (usa ===).
    idEstado = Number(idEstado);

    let asunto: string;
    let eyebrow: string;
    let titulo: string;
    let contenido: string;

    switch (idEstado) {
        case 7:
            // Disponible para retiro en sucursal
            asunto = `Tu pedido está disponible para retiro — Orden #${orden.numero_orden}`;
            eyebrow = 'Disponible para retiro';
            titulo = `¡Llega a sucursal!`;
            contenido = `
                <p class="copy">
                    Hola ${cliente.nombre}, tu pedido llegó a la sucursal de OCA y está disponible para retiro.<br>
                    ${sucursal ? `
                        <br>
                        <strong>${sucursal.descripcion ?? 'Sucursal OCA'}</strong><br>
                        ${[sucursal.calle, sucursal.numero].filter(Boolean).join(' ')}<br>
                        ${[sucursal.localidad, sucursal.provincia].filter(Boolean).join(', ')}
                    ` : ''}
                </p>
            `;
            break;

        case 10:
            // Entregado
            asunto = `¡Tu pedido fue entregado! — Orden #${orden.numero_orden}`;
            eyebrow = 'Entregado';
            titulo = `¡Llegó tu pedido!`;
            contenido = `
                <p class="copy">
                    Hola ${cliente.nombre}, tu orden fue entregada con éxito.
                    Esperamos que disfrutes tu compra. 👗
                </p>
            `;
            break;

        case 11:
            // No entregado
            asunto = `Revisión necesaria — No pudimos entregar tu pedido`;
            eyebrow = 'No entregado';
            titulo = `Necesitamos tu ayuda.`;
            contenido = `
                <p class="copy">
                    Hola ${cliente.nombre}, por el momento no pudimos entregar tu pedido.
                    ${motivo ? `<br><br><strong>Motivo:</strong> ${motivo}` : ''}
                    <br><br>
                    Por favor contactanos a <a href="mailto:ventas@guidocapuzzi.com">ventas@guidocapuzzi.com</a>
                    para coordinar una nueva entrega.
                </p>
            `;
            break;

        default:
            // Otros estados (en camino, en preparación, etc.)
            asunto = `Actualización de tu pedido — Orden #${orden.numero_orden}`;
            eyebrow = 'Actualización de envío';
            titulo = `Tu pedido en camino.`;
            contenido = `
                <p class="copy">
                    Hola ${cliente.nombre}, tu orden está en proceso de entrega.
                </p>
            `;
    }

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${asunto}</title>
  <style>${emailBaseStyles()}</style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <img class="logo-img" src="${LOGO_URL}" alt="Güido Capuzzi" width="500" />
    </div>

    <div class="body">
      <p class="eyebrow">${eyebrow}</p>

      <h1 class="heading">${titulo}</h1>

      ${contenido}

      <hr class="divider" />
    </div>

    <div class="footer">
      <p class="footer-note">
        Ante cualquier consulta respondé este email a
        <a href="mailto:ventas@guidocapuzzi.com">ventas@guidocapuzzi.com</a>
      </p>
      <p class="footer-domain">GÜIDO CAPUZZI — güidocapuzzi.com</p>
    </div>

    <div class="accent-bar"></div>

  </div>
</body>
</html>
    `.trim();

    const resend = getResend();
    if (!resend) return;   // getResend ya logueó el motivo

    const { error: sendError } = await resend.emails.send({
        from: 'GÜIDO CAPUZZI <ventas@guidocapuzzi.com>',
        to: cliente.email,
        replyTo: 'ventas@guidocapuzzi.com',
        subject: asunto,
        html,
    });

    if (sendError) {
        console.error('[email] Resend error:', sendError);
    } else {
        console.log('[email] ✅ Email de envío enviado a:', cliente.email, '— orden:', ordenId, '— estado:', idEstado);
    }
}
