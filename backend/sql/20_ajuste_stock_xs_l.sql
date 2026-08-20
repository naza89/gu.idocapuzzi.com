-- ============================================================================
-- 20. AJUSTE DE STOCK — XS y L de la remera logo negra
-- ============================================================================
-- La migración 19 armó el stock de la strass restando 4 unidades de cada talle
-- de las dos variantes negras de la remera logo común. XS y L tenían exactamente
-- 4, así que quedaron en CERO y la logo negra dejó de venderse en esos talles.
--
-- Este script devuelve 2 unidades a cada uno de esos 4 talles, sacándolas del
-- stock de la strass en los mismos talles. Quedan 2 y 2 en vez de 0 y 4.
--
--   REMERA LOGO (negra)            STRASS
--   NBL XS  0 → 2                  LOGO BLANCO XS  4 → 2
--   NBL L   0 → 2                  LOGO BLANCO L   4 → 2
--   NRO XS  0 → 2                  LOGO ROJO   XS  4 → 2
--   NRO L   0 → 2                  LOGO ROJO   L   4 → 2
--
-- No mueve S ni M: esos talles ya tenían margen en las dos.
--
-- ⚠️ EJECUTADO el 2026-08-20. Se deja el archivo por trazabilidad del movimiento
-- de inventario; volver a correrlo movería otras 8 unidades.
-- ============================================================================

BEGIN;

-- Guarda: la strass tiene que poder ceder 2 en cada uno de esos talles.
DO $$
DECLARE insuficientes INTEGER;
BEGIN
    SELECT COUNT(*) INTO insuficientes
    FROM variantes_producto
    WHERE sku IN ('REM-STR-NRO-XS','REM-STR-NRO-L','REM-STR-NBL-XS','REM-STR-NBL-L')
      AND stock < 2;
    IF insuficientes > 0 THEN
        RAISE EXCEPTION 'Hay % variantes de strass con menos de 2 unidades; abortado', insuficientes;
    END IF;
END $$;

UPDATE variantes_producto SET stock = stock - 2
WHERE sku IN ('REM-STR-NRO-XS','REM-STR-NRO-L','REM-STR-NBL-XS','REM-STR-NBL-L');

UPDATE variantes_producto SET stock = stock + 2
WHERE sku IN ('REM-LOGO-NRO-XS','REM-LOGO-NRO-L','REM-LOGO-NBL-XS','REM-LOGO-NBL-L');

-- Verificación: ningún talle de estos dos productos puede quedar en cero.
DO $$
DECLARE en_cero INTEGER; negativos INTEGER;
BEGIN
    SELECT COUNT(*) INTO en_cero
    FROM variantes_producto v JOIN productos p ON p.id = v.producto_id
    WHERE p.nombre IN ('REMERA GÜIDO OVERSIZED','REMERA LOGO GÜIDO STRASS')
      AND v.colorway IN ('NEGRO LOGO ROJO','NEGRO LOGO BLANCO','LOGO ROJO','LOGO BLANCO')
      AND v.stock = 0;

    SELECT COUNT(*) INTO negativos FROM variantes_producto WHERE stock < 0;

    IF en_cero > 0 THEN RAISE EXCEPTION 'Quedaron % variantes en cero', en_cero; END IF;
    IF negativos > 0 THEN RAISE EXCEPTION 'Quedaron % con stock negativo', negativos; END IF;

    RAISE NOTICE 'OK: XS y L de la logo negra con 2 unidades, strass con 2 en esos talles.';
END $$;

COMMIT;
