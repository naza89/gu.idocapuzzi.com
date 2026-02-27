-- ============================================================================
-- ARCHIVO: 06_actualizar_productos_feb2026.sql
-- PROPÓSITO: Actualizar Baby Tee y Termal, agregar Jean Encerado
-- ============================================================================
--
-- CAMBIOS:
--   1. Baby Tee: Actualizar nombre (+REGISTRADA), precio ($45.000 → 4500000),
--      descripción y subcategoría
--   2. Termal: Actualizar precio ($70.000 → 7000000) y descripción
--   3. Jean Encerado: Insertar nuevo producto archivo 1/1
--
-- CÓMO EJECUTAR:
--   Supabase Dashboard > SQL Editor > + New query > Copiar y Run
--
-- ============================================================================


-- ============================================================================
-- 1. ACTUALIZAR REMERA BABY TEE
-- ============================================================================
-- Cambios: nombre → "REMERA BABY TEE REGISTRADA"
--          titulo → "REMERA BABY TEE<br>REGISTRADA"
--          precio → $45.000 (4500000 centavos)
--          descripción actualizada
-- ============================================================================

UPDATE productos
SET
    nombre = 'REMERA BABY TEE REGISTRADA',
    titulo = 'REMERA BABY TEE<br>REGISTRADA',
    precio_centavos = 4500000,
    descripcion = 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.',
    updated_at = now()
WHERE nombre = 'REMERA BABY TEE';


-- ============================================================================
-- 2. ACTUALIZAR REMERA MANGA LARGA TERMAL
-- ============================================================================
-- Cambios: precio → $70.000 (7000000 centavos)
--          descripción actualizada con detalles de waffle, thumb holes, etc.
-- ============================================================================

UPDATE productos
SET
    precio_centavos = 7000000,
    descripcion = 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.',
    updated_at = now()
WHERE nombre = 'REMERA MANGA LARGA TERMAL';


-- ============================================================================
-- 3. INSERTAR JEAN ENCERADO (ARCHIVO 1/1)
-- ============================================================================
-- Pieza única, no reponible
-- SKU: JEA-1/1-ENC-M
-- ============================================================================

WITH producto_encerado AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN INTERVENIDO "ENCERADO" BOOTCUT',
        'JEAN INTERVENIDO<br>"ENCERADO"<br>FIT BOOTCUT',
        'ARCHIVO',
        'JEAN LEVI''S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM CLÁSICO DE CORTE BOOTCUT. PINTADO Y ENCERADO A MANO. COSTURA INFERIOR ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE INTERVENCIONES. HECHO A MANO EN ARGENTINA.',
        15000000, -- $150.000
        ARRAY['assets/images/products/jean-archivo-2-front.png', 'assets/images/products/jean-archivo-2-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock, one_of_one)
SELECT
    p.id,
    'JEA-1/1-ENC-M',
    'Negro Encerado',
    '1/1',
    'M',
    1,
    true  -- Pieza única, no reponible
FROM producto_encerado p;


-- ============================================================================
-- 4. ACTUALIZAR PRECIOS: JEANS SELVEDGE → $240.000
-- ============================================================================

UPDATE productos
SET precio_centavos = 24000000, updated_at = now()
WHERE nombre LIKE 'JEAN SELVEDGE JAPONES%';


-- ============================================================================
-- 5. ACTUALIZAR PRECIOS: BERMUDA PATCHWORK → $160.000
-- ============================================================================

UPDATE productos
SET precio_centavos = 16000000, updated_at = now()
WHERE nombre = 'BERMUDA SELVEDGE PATCHWORK';


-- ============================================================================
-- 6. ACTUALIZAR PRECIOS: BERMUDA DOUBLE KNEE → $175.000
-- ============================================================================

UPDATE productos
SET precio_centavos = 17500000, updated_at = now()
WHERE nombre = 'BERMUDA SELVEDGE DOUBLE KNEE';


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT nombre, precio_centavos FROM productos ORDER BY nombre;
-- ============================================================================
