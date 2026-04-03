-- Migración 13: Separar payment_request_id de payment_id en NAVE
-- payment_request_id = lo que devuelve POST crear-pago (NO sirve para verificar estado)
-- payment_id = el pago real, llega via webhook (SÍ sirve para GET /ranty-payments/payments/{id})

ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nave_payment_request_id TEXT;

COMMENT ON COLUMN ordenes.nave_payment_request_id IS 'ID de la solicitud de pago devuelto por POST /api/payment_request/ecommerce. NO es el payment_id real.';
COMMENT ON COLUMN ordenes.nave_payment_id IS 'ID real del pago en NAVE (recibido via webhook). Se usa para verificar estado via GET /ranty-payments/payments/{id}.';
