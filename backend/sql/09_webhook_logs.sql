-- ============================================================================
-- ARCHIVO: 09_webhook_logs.sql
-- PROPÓSITO: Crear tabla de auditoría para webhooks de pago (NAVE/Galicia)
-- ============================================================================
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run"
--
-- CUÁNDO EJECUTAR:
-- Antes de deployar a producción. Sin esta tabla, el endpoint
-- /api/webhooks/galicia falla silenciosamente al intentar loguear.
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,          -- 'galicia', 'nave', etc.
    event_type VARCHAR(100),              -- 'payment.approved', 'payment.rejected', etc.
    order_id TEXT,                         -- UUID de la orden en Supabase
    payload JSONB,                        -- Payload completo del webhook
    received_at TIMESTAMPTZ NOT NULL,     -- Timestamp de recepción
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE webhook_logs IS 'Log de auditoría para webhooks de pago recibidos';
COMMENT ON COLUMN webhook_logs.source IS 'Origen del webhook: galicia, nave';
COMMENT ON COLUMN webhook_logs.event_type IS 'Tipo de evento: payment.approved, payment.rejected, etc.';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload JSON completo recibido del webhook';

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at);

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Esta tabla es solo para auditoría/debugging.
-- El webhook funciona sin ella, pero los logs se pierden.
-- ============================================================================
