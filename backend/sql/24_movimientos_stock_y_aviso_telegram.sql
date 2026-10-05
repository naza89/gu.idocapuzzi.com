-- Migración 24_movimientos_stock_y_aviso_telegram.sql
-- Descripción: registro de movimientos manuales de stock (ventas en mano, reposiciones,
--              devoluciones, correcciones) + función atómica `ajustar_stock` que usa el
--              agente de Telegram, + flag de idempotencia del aviso de compra a Telegram.
-- Fecha: 2026-10-05
-- Proyecto Supabase: zwzzrqjmnrlkltuijjjf
-- EJECUTAR EN: Supabase SQL Editor (no se ejecuta automáticamente)
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS ajustar_stock(TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID);
--   DROP TABLE IF EXISTS movimientos_stock;
--   ALTER TABLE ordenes DROP COLUMN IF EXISTS notificado_telegram;
--   (el stock que ya se movió NO vuelve solo: revertir movimiento por movimiento antes)
--
-- POR QUÉ
--   Hay ventas que se hacen en mano y no pasan por la web, así que nada las descuenta.
--   El agente de GÜIDO (Hermes + Telegram) descuenta esas ventas, pero no con un UPDATE
--   suelto: cada cambio queda registrado con quién, cuándo, por qué y cuánto había antes.
--   Sin ese registro, un número de stock que "no cierra" es imposible de reconstruir.
--
--   Las ventas web siguen bajando el stock con `decrement_stock` (migración 11) y no se
--   registran acá: su rastro ya es la orden y sus items_orden.
-- ============================================================

BEGIN;

-- ── 1. Registro de movimientos ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id UUID NOT NULL REFERENCES variantes_producto(id) ON DELETE RESTRICT,
    sku VARCHAR(50) NOT NULL,
    delta INTEGER NOT NULL CHECK (delta <> 0),
    stock_antes INTEGER NOT NULL,
    stock_despues INTEGER NOT NULL CHECK (stock_despues >= 0),
    motivo TEXT NOT NULL CHECK (motivo IN ('venta_manual', 'reposicion', 'devolucion', 'correccion')),
    nota TEXT,
    origen TEXT NOT NULL DEFAULT 'telegram' CHECK (origen IN ('telegram', 'sql', 'admin')),
    -- Quién lo pidió (nombre o id de Telegram). Texto libre: no hay tabla de usuarios internos.
    actor TEXT,
    -- Si este movimiento deshace otro, apunta al original. Un movimiento se deshace una sola vez.
    revierte_a UUID REFERENCES movimientos_stock(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (stock_despues = stock_antes + delta)
);

CREATE UNIQUE INDEX IF NOT EXISTS movimientos_stock_revierte_a_unico
    ON movimientos_stock (revierte_a) WHERE revierte_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS movimientos_stock_created_at_idx
    ON movimientos_stock (created_at DESC);
CREATE INDEX IF NOT EXISTS movimientos_stock_variante_idx
    ON movimientos_stock (variante_id, created_at DESC);

COMMENT ON TABLE movimientos_stock IS
    'Movimientos manuales de stock (venta en mano, reposición, devolución, corrección). Las ventas web no se registran acá: su rastro es la orden.';

-- RLS prendido y SIN policies, a propósito: la tabla es solo de servidor (service_role,
-- que bypassea RLS). Una policy para anon/authenticated la expondría al browser con la
-- anon key pública. Es la excepción documentada a la regla "al menos una policy".
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

-- ── 2. Función atómica ───────────────────────────────────────────────────────
-- Bloquea la fila de la variante (FOR UPDATE), rechaza dejar stock negativo, aplica el
-- delta y registra el movimiento, todo en la misma transacción. Si dos pedidos llegan a
-- la vez, el segundo espera al primero y ve el stock ya actualizado.

CREATE OR REPLACE FUNCTION ajustar_stock(
    p_sku        TEXT,
    p_delta      INT,
    p_motivo     TEXT,
    p_nota       TEXT DEFAULT NULL,
    p_origen     TEXT DEFAULT 'telegram',
    p_actor      TEXT DEFAULT NULL,
    p_revierte_a UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_variante_id UUID;
    v_antes       INT;
    v_mov_id      UUID;
BEGIN
    IF p_delta IS NULL OR p_delta = 0 THEN
        RAISE EXCEPTION 'El ajuste tiene que mover al menos una unidad (delta = %)', p_delta;
    END IF;

    SELECT v.id, v.stock INTO v_variante_id, v_antes
    FROM variantes_producto v
    WHERE v.sku = p_sku
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la variante con SKU %', p_sku;
    END IF;

    IF v_antes + p_delta < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente en %: hay %, se pidió restar %', p_sku, v_antes, -p_delta;
    END IF;

    UPDATE variantes_producto
    SET stock = v_antes + p_delta, updated_at = NOW()
    WHERE id = v_variante_id;

    INSERT INTO movimientos_stock
        (variante_id, sku, delta, stock_antes, stock_despues, motivo, nota, origen, actor, revierte_a)
    VALUES
        (v_variante_id, p_sku, p_delta, v_antes, v_antes + p_delta, p_motivo, p_nota, p_origen, p_actor, p_revierte_a)
    RETURNING id INTO v_mov_id;

    RETURN jsonb_build_object(
        'movimiento_id', v_mov_id,
        'sku', p_sku,
        'stock_antes', v_antes,
        'stock_despues', v_antes + p_delta
    );
END;
$$;

COMMENT ON FUNCTION ajustar_stock(TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID) IS
    'Ajuste manual de stock con registro en movimientos_stock. Nunca deja stock negativo. Solo service_role.';

-- Solo el servidor. Sin esto, cualquiera con la anon key (que está en el front) podría
-- llamarla por /rest/v1/rpc. (decrement_stock quedó invocable por anon, pero sin policy de
-- UPDATE sobre variantes_producto no toca ninguna fila; acá no dependemos de eso.)
REVOKE ALL ON FUNCTION ajustar_stock(TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ajustar_stock(TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

-- ── 3. Idempotencia del aviso de compra a Telegram ───────────────────────────
-- Mismo patrón que stock_decremented / email_sent: el primer UPDATE ... WHERE flag=false
-- que gana manda el aviso. Si el envío falla, el código lo vuelve a false para que el
-- próximo camino (webhook, GET de la confirmación o el cron) lo reintente.

ALTER TABLE ordenes
ADD COLUMN IF NOT EXISTS notificado_telegram BOOLEAN DEFAULT FALSE;

-- Las órdenes que ya existen NO se avisan: la red de seguridad del GET corre sobre
-- cualquier orden pagada, y sin esto llegaría un aviso por cada compra histórica.
UPDATE ordenes SET notificado_telegram = TRUE WHERE notificado_telegram IS DISTINCT FROM TRUE;

COMMENT ON COLUMN ordenes.notificado_telegram IS
    'Flag de idempotencia: true si el aviso de compra a Telegram ya salió (o la orden es anterior al bot).';

COMMIT;
