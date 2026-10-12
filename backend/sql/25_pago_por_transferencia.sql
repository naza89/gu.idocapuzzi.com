-- Migración 25_pago_por_transferencia.sql
-- Descripción: método de pago de la orden (NAVE o transferencia) + índice para listar
--              las transferencias que esperan comprobante.
-- Fecha: 2026-10-12
-- Proyecto Supabase: zwzzrqjmnrlkltuijjjf
-- EJECUTAR EN: Supabase SQL Editor (no se ejecuta automáticamente)
-- ORDEN: ⚠️ CORRER ANTES DEL DEPLOY DEL CÓDIGO. Al revés de la coreografía habitual:
--        el GET de /api/ordenes/[id] pasa a leer `metodo_pago`, y sin la columna el
--        select falla → la página de confirmación de TODAS las compras (también las de
--        tarjeta) da 404. La columna es nullable y el código viejo no la lee, así que
--        correrla primero no rompe nada.
-- ROLLBACK:
--   DROP INDEX IF EXISTS idx_ordenes_esperando_transferencia;
--   ALTER TABLE ordenes DROP COLUMN IF EXISTS metodo_pago;
--
-- POR QUÉ
--   El checkout suma el pago por transferencia con 15% de descuento: la orden queda en
--   `esperando_transferencia` hasta que el equipo recibe el comprobante y la confirma
--   desde WIDO (POST /api/ordenes/[id]/confirmar-transferencia).
--
--   `metodo_pago` es TEXT libre, igual que `estado` y `tipo_envio`: el contrato son los
--   literales de `src/lib/pagos.ts` ('nave' | 'transferencia'). Las órdenes viejas quedan
--   en NULL, que se lee como NAVE (era el único método).
--
--   El descuento no necesita columna nueva: ya existen `descuento_centavos` y
--   `codigo_descuento` (este último queda en 'TRANSFERENCIA').
-- ============================================================

BEGIN;

ALTER TABLE ordenes
    ADD COLUMN IF NOT EXISTS metodo_pago TEXT;

COMMENT ON COLUMN ordenes.metodo_pago IS
    'nave | transferencia (src/lib/pagos.ts). NULL en órdenes anteriores a la migración 25 = NAVE.';

-- WIDO lista las transferencias pendientes por fecha. Índice parcial: son pocas filas.
CREATE INDEX IF NOT EXISTS idx_ordenes_esperando_transferencia
    ON ordenes (created_at)
    WHERE estado = 'esperando_transferencia';

COMMIT;

-- Verificación:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'ordenes' AND column_name = 'metodo_pago';
