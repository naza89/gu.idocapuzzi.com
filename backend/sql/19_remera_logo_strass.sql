-- ============================================================================
-- 19. PRODUCTO NUEVO — REMERA LOGO GÜIDO STRASS
-- ============================================================================
-- Variante de la REMERA GÜIDO OVERSIZED con strass aplicado a mano. $65.000.
-- Dos colorways sobre tela negra: LOGO ROJO y LOGO BLANCO.
--
-- EL STOCK SALE DE LA REMERA LOGO COMÚN. Naza las hace a pedido, así que no hay
-- un conteo propio: se toman 4 unidades de cada talle de las dos variantes de
-- tela negra (16 por colorway) y esas pasan a ser el stock de la strass.
--
--   NEGRO LOGO ROJO   → LOGO ROJO      NEGRO LOGO BLANCO → LOGO BLANCO
--   XS  4 → 0                          XS  4 → 0
--   S   9 → 5                          S   9 → 5
--   M   8 → 4                          M   9 → 5
--   L   4 → 0                          L   4 → 0
--
-- ⚠️ OJO: XS y L de las dos variantes negras quedan en CERO. La remera logo
-- negra deja de estar disponible en esos dos talles. Es consecuencia directa de
-- restar 4 donde había exactamente 4; si no era la intención, ajustar antes de
-- correr esto.
--
-- Los SKU siguen el patrón TIPO-MODELO-COLOR-TALLE: REM-STR-NRO-XS, etc.
-- El segmento de color se mantiene igual al de la logo común (NRO/NBL) porque
-- la tela es la misma; lo que cambia es el modelo (LOGO → STR).
--
-- Orden: ejecutar entero en el SQL Editor de Supabase, en una sola transacción.
-- Se puede correr antes o después del deploy: si el front todavía no conoce el
-- producto, simplemente no lo muestra.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Guarda: que haya al menos 4 unidades en cada talle de origen.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    faltantes INTEGER;
BEGIN
    SELECT COUNT(*) INTO faltantes
    FROM variantes_producto v
    JOIN productos p ON p.id = v.producto_id
    WHERE p.nombre = 'REMERA GÜIDO OVERSIZED'
      AND v.colorway IN ('NEGRO LOGO ROJO', 'NEGRO LOGO BLANCO')
      AND v.stock < 4;

    IF faltantes > 0 THEN
        RAISE EXCEPTION 'Hay % variantes de origen con menos de 4 unidades; abortado', faltantes;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Producto
-- ----------------------------------------------------------------------------
-- `productos` no tiene UNIQUE en nombre, asi que ON CONFLICT no serviria de nada:
-- correr el script dos veces crearia un producto duplicado. El guard es explicito.
INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
SELECT
    'REMERA LOGO GÜIDO STRASS',
    'REMERA LOGO GÜIDO STRASS',
    'REMERAS',
    'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO CON STRASS APLICADO A MANO, PIEZA POR PIEZA. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.',
    6500000,
    ARRAY[
        'assets/images/products/remera-guido-strass-rojo-1.webp',
        'assets/images/products/remera-guido-strass-rojo-2.webp'
    ],
    true
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'REMERA LOGO GÜIDO STRASS'
);

-- ----------------------------------------------------------------------------
-- 3. Variantes: 4 talles x 2 colorways, 4 unidades cada una.
-- ----------------------------------------------------------------------------
-- `color` es NOT NULL y es el campo por el que filtra el Shop. Las dos son
-- remeras negras, igual que las variantes de origen, asi que va 'Negro' en ambas;
-- lo que distingue los colorways es `colorway`.
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT p.id, v.sku, 'Negro', v.colorway, v.talle, 4
FROM productos p
CROSS JOIN (VALUES
    ('REM-STR-NRO-XS', 'LOGO ROJO',   'XS'),
    ('REM-STR-NRO-S',  'LOGO ROJO',   'S'),
    ('REM-STR-NRO-M',  'LOGO ROJO',   'M'),
    ('REM-STR-NRO-L',  'LOGO ROJO',   'L'),
    ('REM-STR-NBL-XS', 'LOGO BLANCO', 'XS'),
    ('REM-STR-NBL-S',  'LOGO BLANCO', 'S'),
    ('REM-STR-NBL-M',  'LOGO BLANCO', 'M'),
    ('REM-STR-NBL-L',  'LOGO BLANCO', 'L')
) AS v(sku, colorway, talle)
WHERE p.nombre = 'REMERA LOGO GÜIDO STRASS'
ON CONFLICT (sku) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Descontar esas 32 unidades del origen (16 por colorway).
-- ----------------------------------------------------------------------------
UPDATE variantes_producto v
SET stock = v.stock - 4
FROM productos p
WHERE p.id = v.producto_id
  AND p.nombre = 'REMERA GÜIDO OVERSIZED'
  AND v.colorway IN ('NEGRO LOGO ROJO', 'NEGRO LOGO BLANCO');

-- ----------------------------------------------------------------------------
-- 5. Verificación
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    nuevas INTEGER;
    negativos INTEGER;
BEGIN
    SELECT COUNT(*) INTO nuevas
    FROM variantes_producto v JOIN productos p ON p.id = v.producto_id
    WHERE p.nombre = 'REMERA LOGO GÜIDO STRASS';

    SELECT COUNT(*) INTO negativos FROM variantes_producto WHERE stock < 0;

    IF nuevas <> 8 THEN
        RAISE EXCEPTION 'Esperaba 8 variantes de strass, hay %', nuevas;
    END IF;
    IF negativos > 0 THEN
        RAISE EXCEPTION 'Quedaron % variantes con stock negativo', negativos;
    END IF;

    RAISE NOTICE 'OK: 8 variantes de strass con 4 unidades cada una, origen descontado.';
END $$;

COMMIT;
