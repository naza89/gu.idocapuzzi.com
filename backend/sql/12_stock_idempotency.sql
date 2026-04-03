-- Migración 12: Flag de idempotencia para decremento de stock
-- Previene que webhook NAVE y GET fallback decrementen stock 2 veces
-- para la misma orden.

ALTER TABLE ordenes
ADD COLUMN IF NOT EXISTS stock_decremented BOOLEAN DEFAULT FALSE;

-- Agregar también email_sent para idempotencia de emails
ALTER TABLE ordenes
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Comentario
COMMENT ON COLUMN ordenes.stock_decremented IS 'Flag de idempotencia: true si el stock ya fue decrementado para esta orden';
COMMENT ON COLUMN ordenes.email_sent IS 'Flag de idempotencia: true si el email de confirmación ya fue enviado';
