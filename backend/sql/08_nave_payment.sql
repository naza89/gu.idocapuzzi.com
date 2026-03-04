-- ============================================================================
-- ARCHIVO: 08_nave_payment.sql
-- PROPÓSITO: Agregar columnas de tracking de pagos NAVE (Banco Galicia)
--            a la tabla ordenes
-- ============================================================================
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run"
--
-- CUÁNDO EJECUTAR:
-- Antes de deployar los endpoints POST /api/nave/crear-pago
-- y POST /api/webhooks/nave. Sin estas columnas el webhook
-- no tiene dónde escribir el resultado del pago.
--
-- ============================================================================

-- ============================================================================
-- TABLA: ordenes — columnas para NAVE payment tracking
-- ============================================================================

ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nave_payment_id  TEXT;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nave_status      VARCHAR(30);
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nave_monto_ars   DECIMAL(12,2);

COMMENT ON COLUMN ordenes.nave_payment_id IS 'ID del pago en NAVE (payment_request_id de Ranty). Se guarda al crear la intención de pago.';
COMMENT ON COLUMN ordenes.nave_status     IS 'Estado NAVE: PENDING, APPROVED, REJECTED, CANCELLED, REFUNDED, PURCHASE_REVERSED, CHARGEBACK_REVIEW, CHARGED_BACK';
COMMENT ON COLUMN ordenes.nave_monto_ars  IS 'Monto cobrado por NAVE en ARS (para conciliación). Se guarda cuando el webhook confirma el pago.';

-- ============================================================================
-- Índice para búsquedas rápidas desde el webhook
-- ============================================================================
-- El webhook llega con external_payment_id (= UUID de la orden en Supabase).
-- Este índice acelera el UPDATE al recibir la notificación de NAVE.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ordenes_nave_payment_id ON ordenes(nave_payment_id);

-- ============================================================================
-- Actualización del comentario de estados en la columna "estado"
-- ============================================================================
-- Ciclo de vida completo:
--   pendiente → envio_calculado → pago_pendiente → pagado
--   → preparando → enviado → entregado | cancelado
-- ============================================================================

COMMENT ON COLUMN ordenes.estado IS 'Ciclo de vida: pendiente → envio_calculado → pago_pendiente → pagado → preparando → enviado → entregado | cancelado';

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Próximo paso: implementar los endpoints en Next.js:
--   src/app/api/nave/crear-pago/route.ts
--   src/app/api/webhooks/nave/route.ts
-- ============================================================================
