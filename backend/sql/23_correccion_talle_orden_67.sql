-- ─────────────────────────────────────────────────────────────────────────────
-- 23 — Corrección de talle en la orden 67 (2026-08-26) — YA CORRIDA
--
-- Primera compra real de la tienda, el día de la apertura. La clienta eligió
-- talle L por error y confirmó por WhatsApp que quería M.
--
-- ⚠️ No alcanza con cambiar el texto del talle. El descuento de stock se hizo
-- sobre la variante L, así que hay que moverlo: devolver la unidad a L y
-- descontarla de M. Si sólo se cambia `items_orden.talle`, el inventario queda
-- mintiendo en las dos puntas.
--
-- Estado antes:  L=6  M=14
-- Estado después: L=7  M=13
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. El item apunta ahora a la variante M
UPDATE items_orden
SET talle = 'M',
    variante_id = '78b89af2-6809-4950-8fac-422613d64ae2'
WHERE id = 'd6010fb6-2cad-41d6-b092-8d814e6df3d2';

-- 2. Devolver la unidad al talle L (se había descontado de más)
UPDATE variantes_producto
SET stock = stock + 1, updated_at = now()
WHERE sku = 'REM-AFL-NEG-L';

-- 3. Descontar la unidad del talle M (el que realmente se vendió)
UPDATE variantes_producto
SET stock = stock - 1, updated_at = now()
WHERE sku = 'REM-AFL-NEG-M';

COMMIT;

-- Control:
-- SELECT vp.sku, vp.stock FROM variantes_producto vp
-- JOIN productos p ON p.id = vp.producto_id
-- WHERE p.nombre = 'REMERA AFLIGIDA BAGGED TEE' AND vp.color = 'Negro'
-- ORDER BY vp.talle;
