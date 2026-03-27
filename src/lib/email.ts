/**
 * Email transaccional — GÜIDO CAPUZZI
 * Usa Resend con dominio guidocapuzzi.com (verificado)
 * From: ventas@guidocapuzzi.com
 *
 * Templates disponibles:
 *   sendOrderConfirmationEmail(ordenId)  → Confirmación de compra (trigger: webhook NAVE APPROVED)
 *
 * Pendientes:
 *   sendShippingEmail(ordenId, tracking) → Pedido enviado con tracking OCA
 */

import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

const LOGO_URL = 'https://zwzzrqjmnrlkltuijjjf.supabase.co/storage/v1/object/public/assets/mail_smtp.png';
const FONT_CN  = 'https://zwzzrqjmnrlkltuijjjf.supabase.co/storage/v1/object/public/assets/UniversCnBold.ttf';
const FONT_REG = 'https://zwzzrqjmnrlkltuijjjf.supabase.co/storage/v1/object/public/assets/UniversRegular.ttf';

// ─── Shared CSS ─────────────────────────────────────────────────────────────

function emailBaseStyles(): string {
    return `
    @font-face {
      font-family: 'UniversCn';
      src: url('${FONT_CN}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Univers';
      src: url('${FONT_REG}') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #efefef;
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-weight: 400;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #fafafa; }
    .header { padding: 48px 48px 36px; border-bottom: 1px solid #e0e0e0; }
    .logo-img { display: block; width: 500px; max-width: 100%; height: auto; }
    .body { padding: 48px 48px 40px; }
    .eyebrow {
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: #999; margin-bottom: 16px;
    }
    .heading {
      font-family: 'UniversCn', 'Arial Narrow', Arial, sans-serif;
      font-weight: 700; font-size: 56px;
      letter-spacing: 0.02em; line-height: 1.0;
      color: #1a1a1a; margin-bottom: 24px; text-transform: uppercase;
    }
    .copy {
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px; font-weight: 400;
      line-height: 1.8; color: #555;
      margin-bottom: 36px; max-width: 440px;
    }
    table { border-collapse: collapse; width: 100%; }
    .items-header th {
      padding: 0 0 10px; border-bottom: 1px solid #1a1a1a;
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.14em; text-transform: uppercase; color: #999;
    }
    .items-header th:first-child { text-align: left; }
    .items-header th:nth-child(2) { text-align: center; }
    .items-header th:last-child { text-align: right; }
    .item-row td { padding: 12px 0; border-bottom: 1px solid #ebebeb; vertical-align: top; }
    .item-name {
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px; color: #1a1a1a; line-height: 1.4; margin: 0;
    }
    .item-variant {
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px; color: #999;
      letter-spacing: 0.04em; text-transform: uppercase; margin: 2px 0 0;
    }
    .item-qty { text-align: center; font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1a1a1a; }
    .item-price { text-align: right; font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1a1a1a; white-space: nowrap; }
    .totals-row td { padding: 5px 0; font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; }
    .totals-label { color: #999; }
    .totals-value { text-align: right; color: #1a1a1a; }
    .total-row td {
      padding: 14px 0 0; border-top: 1px solid #e0e0e0;
      font-family: 'UniversCn', 'Arial Narrow', Arial, sans-serif;
      font-size: 18px; font-weight: 700;
      letter-spacing: 0.04em; text-transform: uppercase; color: #1a1a1a;
    }
    .total-amount { text-align: right; color: #ad1c1c; white-space: nowrap; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 36px 0 0; }
    .footer { padding: 0 48px 48px; }
    .footer-note {
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px; font-weight: 400; line-height: 1.8; color: #aaa;
    }
    .footer-note a { color: #1a1a1a; text-decoration: none; }
    .footer-domain {
      margin-top: 6px;
      font-family: 'Univers', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10px; color: #ccc;
    }
    .accent-bar { height: 4px; background-color: #ad1c1c; }
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

    const tipoEnvio = orden.tipo_envio === 'sucursal'
        ? 'OCA — Retiro en sucursal'
        : 'OCA — Envío a domicilio';

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
