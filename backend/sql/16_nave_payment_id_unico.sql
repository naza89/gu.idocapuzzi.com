-- ============================================================================
-- ARCHIVO: 16_nave_payment_id_unico.sql
-- PROPÓSITO: Backstop en DB para el cruce pago↔orden del webhook de NAVE.
-- ============================================================================
--
-- Un payment_id de NAVE sólo puede quedar atado a UNA orden. El webhook ya
-- valida esto en código (src/app/api/webhooks/nave/route.ts, STEP 3), pero un
-- índice único lo garantiza incluso ante dos notificaciones concurrentes:
-- el segundo UPDATE que intente escribir el mismo nave_payment_id en otra orden
-- falla en la base. Corta el replay de un payment_id aprobado contra órdenes caras.
--
-- Es un índice PARCIAL (WHERE nave_payment_id IS NOT NULL) porque la mayoría de
-- las órdenes tienen nave_payment_id en NULL hasta que llega el webhook.
--
-- ⚠️ ANTES DE EJECUTAR: verificar que no haya duplicados de sandbox. Si esta
-- consulta devuelve filas, hay que limpiarlas antes (el índice único fallará):
--
--   SELECT nave_payment_id, count(*)
--   FROM ordenes
--   WHERE nave_payment_id IS NOT NULL
--   GROUP BY nave_payment_id
--   HAVING count(*) > 1;
--
-- CÓMO EJECUTAR:
-- 1. Supabase Dashboard > SQL Editor > New query
-- 2. Pegar este archivo y Run
-- ============================================================================

-- El índice no-único creado en 08_nave_payment.sql queda cubierto por este.
DROP INDEX IF EXISTS idx_ordenes_nave_payment_id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_ordenes_nave_payment_id
ON ordenes (nave_payment_id)
WHERE nave_payment_id IS NOT NULL;

COMMENT ON INDEX uniq_ordenes_nave_payment_id IS
'Un payment_id de NAVE queda atado a una sola orden (anti-replay del webhook).';
