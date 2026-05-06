/**
 * POST /api/webhooks/oca/novedades
 *
 * Webhook de novedades de OCA.
 * Recibe cambios de estado de envíos en tiempo real.
 *
 * ⚠️ CRITICAL: Responde HTTP 200 INMEDIATAMENTE.
 * Si no, OCA reintenta (máximo configurable).
 *
 * Payload de OCA:
 * {
 *   "nroEnvio": "1234567890123456789",
 *   "nroDocCliente": "12345678",
 *   "idEstado": 8,
 *   "estado": "En camino",
 *   "motivo": null,
 *   "fecha": "2026-05-06T10:30:00",
 *   "sucursal": {
 *     "id": 123,
 *     "nombre": "Sucursal Centro",
 *     "domicilio": "Calle 123",
 *     "codigo_postal": "1010",
 *     "localidad": "Buenos Aires",
 *     "provincia": "Buenos Aires"
 *   },
 *   "datosReceptor": {
 *     "nombre": "Juan",
 *     "apellido": "Pérez",
 *     "domicilio": "Calle 456"
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendShippingStatusEmail } from '@/lib/email';

interface OCAWebhookPayload {
  nroEnvio: string;
  nroDocCliente?: string;
  idEstado: number;
  estado?: string;
  motivo?: string;
  fecha: string;
  sucursal?: {
    id: number;
    nombre: string;
    domicilio: string;
    codigo_postal: string;
    localidad: string;
    provincia: string;
  };
  datosReceptor?: {
    nombre: string;
    apellido: string;
    domicilio: string;
  };
}

// ─── Mapeo de estados OCA a estados internos ──────────────

const OCA_STATUS_MAP: Record<number, string> = {
  1: 'en_preparacion',    // Creado
  2: 'en_preparacion',    // Presentado
  3: 'en_preparacion',    // Facturación
  4: 'en_preparacion',    // Facturado
  5: 'en_preparacion',    // Pesado
  6: 'en_preparacion',    // Transito a concentrador
  7: 'disponible_retiro_sucursal', // Disponible para retiro en sucursal
  8: 'en_camino',         // Entregado a transportista
  9: 'en_camino',         // Transito
  10: 'entregado',        // Entregado
  11: 'no_entregado',     // No entregado
  12: 'en_devolucion',    // En devolución
};

// ─── POST Handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: OCAWebhookPayload;
  let rawBody = '';

  try {
    rawBody = await request.text();
    body = JSON.parse(rawBody);
  } catch {
    console.error('[webhook/oca] Body inválido (no es JSON):', rawBody);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { nroEnvio, idEstado, fecha } = body;

  console.log('[webhook/oca] 📩 Recibido:', {
    nroEnvio,
    idEstado,
    estado: body.estado,
    fecha,
    timestamp: new Date().toISOString(),
  });

  // ⚠️ CRITICAL: Responde 200 INMEDIATAMENTE.
  // `after()` garantiza que el procesamiento async siga corriendo
  // después de enviar la respuesta.
  after(async () => {
    try {
      await processWebhook(body, rawBody);
    } catch (err) {
      console.error('[webhook/oca] Error en procesamiento async:', err);
    }
  });

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── GET Handler (health check) ───────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/oca',
    method: 'POST',
    description: 'OCA ePak webhook endpoint (novedades de envíos)',
  });
}

// ─── Async Processing ────────────────────────────────────

async function processWebhook(
  payload: OCAWebhookPayload,
  rawBody: string
): Promise<void> {
  const { nroEnvio, nroDocCliente, idEstado, estado, motivo, fecha, sucursal, datosReceptor } = payload;

  try {
    const supabase = createAdminClient();

    // STEP 1: Buscar la orden por nroEnvio (preferred)
    let { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('id, cliente_id, email')
      .eq('nro_envio_oca', nroEnvio)
      .single();

    // STEP 2: Si no encontramos por nroEnvio, buscar por nroDocCliente + numero_orden
    if (ordenError || !orden) {
      console.log('[webhook/oca] No encontrada por nroEnvio, buscando por numero_orden...');
      // Esto es un fallback raro, pero lo documentamos
      if (nroDocCliente) {
        const { data: ordenAlt } = await supabase
          .from('ordenes')
          .select('id, cliente_id, email')
          .eq('numero_orden', parseInt(nroDocCliente))
          .single();
        orden = ordenAlt;
      }
    }

    if (!orden) {
      console.warn('[webhook/oca] ⚠️ Orden no encontrada:', { nroEnvio, nroDocCliente });
      return;
    }

    console.log('[webhook/oca] ✅ Orden encontrada:', orden.id);

    // STEP 3: Mapear estado OCA a estado interno
    const estadoInterno = OCA_STATUS_MAP[idEstado] || 'en_preparacion';
    console.log('[webhook/oca] Estado mapeado:', idEstado, '→', estadoInterno);

    // STEP 4: Crear el evento en eventos_envio_oca
    const { error: eventoError } = await supabase
      .from('eventos_envio_oca')
      .insert({
        orden_id: orden.id,
        nro_envio_oca: nroEnvio,
        nro_doc_cliente: nroDocCliente,
        id_estado: idEstado,
        estado: estado,
        motivo: motivo,
        sucursal_info: sucursal ? JSON.stringify(sucursal) : null,
        datos_receptor: datosReceptor ? JSON.stringify(datosReceptor) : null,
        fecha_evento: fecha,
        raw_json: JSON.parse(rawBody),
      });

    if (eventoError) {
      if (eventoError.code === '23505') {
        // Violación de UNIQUE constraint — evento duplicado, idempotencia OK
        console.log('[webhook/oca] ⏭️ Evento duplicado (ya procesado):', { nroEnvio, idEstado, fecha });
      } else {
        console.error('[webhook/oca] Error al insertar evento:', eventoError);
      }
    } else {
      console.log('[webhook/oca] ✅ Evento persistido:', { nroEnvio, idEstado });
    }

    // STEP 5: Actualizar estado_envio en la orden
    const { error: updateError } = await supabase
      .from('ordenes')
      .update({ estado_envio: estadoInterno })
      .eq('id', orden.id);

    if (updateError) {
      console.error('[webhook/oca] Error al actualizar estado_envio:', updateError);
    } else {
      console.log('[webhook/oca] ✅ Estado de orden actualizado:', { ordenId: orden.id, estadoEnvio: estadoInterno });
    }

    // STEP 6: Enviar email al cliente para ciertos estados
    const shouldNotify = [7, 10, 11].includes(idEstado); // sucursal, entregado, no_entregado
    if (shouldNotify && orden.email) {
      try {
        await sendShippingStatusEmail(orden.id, idEstado, sucursal, motivo);
        console.log('[webhook/oca] ✅ Email enviado al cliente:', { ordenId: orden.id, idEstado });
      } catch (emailErr) {
        console.error('[webhook/oca] Error al enviar email:', emailErr);
        // No interrumpimos el flujo si el email falla
      }
    }

  } catch (err) {
    console.error('[webhook/oca] Error en processWebhook:', err);
  }
}
