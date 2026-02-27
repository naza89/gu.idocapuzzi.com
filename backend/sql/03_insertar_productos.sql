-- ============================================================================
-- ARCHIVO: 03_insertar_productos.sql
-- PROPÓSITO: Insertar productos base y variantes con stock inicial
-- ============================================================================
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO este archivo
-- 4. Click en "Run"
--
-- IMPORTANTE: Ejecutar DESPUÉS de 01_crear_tablas.sql y 02_politicas_rls.sql
--
-- ============================================================================
-- CÓMO FUNCIONA EL INSERT:
--
-- Usamos "INSERT INTO tabla (columnas) VALUES (valores)" para agregar filas.
-- 
-- Para productos: Insertamos cada producto base y obtenemos su UUID.
-- Para variantes: Usamos ese UUID para relacionar la variante con el producto.
--
-- Usamos CTEs (Common Table Expressions) con "WITH ... AS" para hacer
-- todo en una sola transacción y mantener las referencias.
-- ============================================================================


-- ============================================================================
-- 1. REMERA LOGO GÜIDO OVERSIZED
-- ============================================================================
-- Total: 100 unidades
-- Variantes: Negro/blanco, Negro/rojo, Blanco/negro (33 c/u + 1 muestra)
-- Distribución por talle: XS:5, S:10, M:12, L:6
-- SKU: REM-LOGO-{COLOR}-{TALLE}
-- ============================================================================

WITH producto_remera_logo AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'REMERA LOGO GÜIDO OVERSIZED',
        'REMERA GÜIDO<br>OVERSIZED',
        'REMERAS',
        'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.',
        5000000, -- $50.000
        ARRAY['assets/images/products/remera-güido-negra-front.png', 'assets/images/products/remera-güido-negra-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_remera_logo p
CROSS JOIN (VALUES
    -- Negro logo blanco (NBL) - ~33 unidades
    ('REM-LOGO-NBL-XS', 'Negro', 'NEGRO LOGO BLANCO', 'XS', 5),
    ('REM-LOGO-NBL-S',  'Negro', 'NEGRO LOGO BLANCO', 'S',  10),
    ('REM-LOGO-NBL-M',  'Negro', 'NEGRO LOGO BLANCO', 'M',  12),
    ('REM-LOGO-NBL-L',  'Negro', 'NEGRO LOGO BLANCO', 'L',  6),
    -- Negro logo rojo (NRO) - ~33 unidades
    ('REM-LOGO-NRO-XS', 'Negro', 'NEGRO LOGO ROJO', 'XS', 5),
    ('REM-LOGO-NRO-S',  'Negro', 'NEGRO LOGO ROJO', 'S',  10),
    ('REM-LOGO-NRO-M',  'Negro', 'NEGRO LOGO ROJO', 'M',  12),
    ('REM-LOGO-NRO-L',  'Negro', 'NEGRO LOGO ROJO', 'L',  6),
    -- Blanco logo negro (BNE) - ~33 unidades
    ('REM-LOGO-BNE-XS', 'Blanco', 'BLANCO LOGO NEGRO', 'XS', 5),
    ('REM-LOGO-BNE-S',  'Blanco', 'BLANCO LOGO NEGRO', 'S',  10),
    ('REM-LOGO-BNE-M',  'Blanco', 'BLANCO LOGO NEGRO', 'M',  12),
    ('REM-LOGO-BNE-L',  'Blanco', 'BLANCO LOGO NEGRO', 'L',  6)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 2. REMERA AFLIGIDA BOXY
-- ============================================================================
-- Total: 100 unidades
-- Variantes: Negra, Blanca, Navy (33 c/u + 1 muestra)
-- Distribución por talle: XS:5, S:10, M:12, L:6
-- SKU: REM-AFL-{COLOR}-{TALLE}
-- ============================================================================

WITH producto_remera_afligida AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'REMERA AFLIGIDA BOXY',
        'REMERA AFLIGIDA<br>BOXY',
        'REMERAS',
        'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.',
        5500000, -- $55.000
        ARRAY['assets/images/products/remera-afligida-negra-front.png', 'assets/images/products/remera-afligida-negra-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_remera_afligida p
CROSS JOIN (VALUES
    -- Negra (NEG)
    ('REM-AFL-NEG-XS', 'Negro', 'NEGRO', 'XS', 5),
    ('REM-AFL-NEG-S',  'Negro', 'NEGRO', 'S',  10),
    ('REM-AFL-NEG-M',  'Negro', 'NEGRO', 'M',  12),
    ('REM-AFL-NEG-L',  'Negro', 'NEGRO', 'L',  6),
    -- Blanca (BLA)
    ('REM-AFL-BLA-XS', 'Blanco', 'BLANCO', 'XS', 5),
    ('REM-AFL-BLA-S',  'Blanco', 'BLANCO', 'S',  10),
    ('REM-AFL-BLA-M',  'Blanco', 'BLANCO', 'M',  12),
    ('REM-AFL-BLA-L',  'Blanco', 'BLANCO', 'L',  6),
    -- Navy (NAV)
    ('REM-AFL-NAV-XS', 'Navy', 'NAVY', 'XS', 5),
    ('REM-AFL-NAV-S',  'Navy', 'NAVY', 'S',  10),
    ('REM-AFL-NAV-M',  'Navy', 'NAVY', 'M',  12),
    ('REM-AFL-NAV-L',  'Navy', 'NAVY', 'L',  6)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 3. MUSCULOSA DOBLE SÍMBOLO
-- ============================================================================
-- Total: 100 unidades
-- Variantes: Negro (50), Blanco (50)
-- Distribución por talle: XS:10, S:15, M:15, L:10
-- SKU: MUS-DSB-{COLOR}-{TALLE}
-- ============================================================================

WITH producto_musculosa AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'MUSCULOSA DOBLE SÍMBOLO OVERSIZED',
        'MUSCULOSA DOBLE SÍMBOLO<br>OVERSIZED',
        'TOPS / MUSCULOSAS',
        'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.',
        4500000, -- $45.000
        ARRAY['assets/images/products/musculosa-doble-simbolo-negra-front.png', 'assets/images/products/musculosa-doble-simbolo-negra-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_musculosa p
CROSS JOIN (VALUES
    -- Negro (50 unidades)
    ('MUS-DSB-NEG-XS', 'Negro', 'NEGRO', 'XS', 10),
    ('MUS-DSB-NEG-S',  'Negro', 'NEGRO', 'S',  15),
    ('MUS-DSB-NEG-M',  'Negro', 'NEGRO', 'M',  15),
    ('MUS-DSB-NEG-L',  'Negro', 'NEGRO', 'L',  10),
    -- Blanco (50 unidades)
    ('MUS-DSB-BLA-XS', 'Blanco', 'BLANCO', 'XS', 10),
    ('MUS-DSB-BLA-S',  'Blanco', 'BLANCO', 'S',  15),
    ('MUS-DSB-BLA-M',  'Blanco', 'BLANCO', 'M',  15),
    ('MUS-DSB-BLA-L',  'Blanco', 'BLANCO', 'L',  10)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 4. REMERA BABY TEE MUJER
-- ============================================================================
-- Total: 100 unidades
-- Variantes: Blanca, Negra, Navy (~33 c/u)
-- Distribución MUJER: XS:12, S:12, M:7, L:2
-- SKU: REM-BBY-{COLOR}-{TALLE}
-- ============================================================================

WITH producto_babytee AS (
    INSERT INTO productos (nombre, titulo, categoria, subcategoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'REMERA BABY TEE',
        'REMERA BABY TEE',
        'REMERAS',
        'MUJER',
        'REMERA BABY TEE AJUSTADA, 100% ALGODÓN. CORTE FEMENINO CON MANGA CORTA Y CUELLO REDONDO. ESTAMPA EN SERIGRAFÍA. HECHA EN ARGENTINA.',
        4800000, -- $48.000
        ARRAY['assets/images/products/remera-babytee-blanca-front.png', 'assets/images/products/remera-babytee-blanca-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_babytee p
CROSS JOIN (VALUES
    -- Blanca (33 unidades)
    ('REM-BBY-BLA-XS', 'Blanco', 'BLANCO', 'XS', 12),
    ('REM-BBY-BLA-S',  'Blanco', 'BLANCO', 'S',  12),
    ('REM-BBY-BLA-M',  'Blanco', 'BLANCO', 'M',  7),
    ('REM-BBY-BLA-L',  'Blanco', 'BLANCO', 'L',  2),
    -- Negra (33 unidades)
    ('REM-BBY-NEG-XS', 'Negro', 'NEGRO', 'XS', 12),
    ('REM-BBY-NEG-S',  'Negro', 'NEGRO', 'S',  12),
    ('REM-BBY-NEG-M',  'Negro', 'NEGRO', 'M',  7),
    ('REM-BBY-NEG-L',  'Negro', 'NEGRO', 'L',  2),
    -- Navy (33 unidades)
    ('REM-BBY-NAV-XS', 'Navy', 'NAVY', 'XS', 12),
    ('REM-BBY-NAV-S',  'Navy', 'NAVY', 'S',  12),
    ('REM-BBY-NAV-M',  'Navy', 'NAVY', 'M',  7),
    ('REM-BBY-NAV-L',  'Navy', 'NAVY', 'L',  2)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 5. REMERA MANGA LARGA TERMAL
-- ============================================================================
-- Total: 100 unidades
-- Variantes: Blanco (50), Negro (50)
-- Distribución: XS:8, S:14, M:16, L:12
-- SKU: REM-TRM-{COLOR}-{TALLE}
-- ============================================================================

WITH producto_termal AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'REMERA MANGA LARGA TERMAL',
        'REMERA MANGA LARGA<br>TERMAL',
        'REMERAS',
        'REMERA DE MANGA LARGA EN TELA TERMAL, 100% ALGODÓN. TEXTURA WAFFLE. CALCE REGULAR. HECHA EN ARGENTINA.',
        5800000, -- $58.000
        ARRAY['assets/images/products/remera-termal-blanca-front.png', 'assets/images/products/remera-termal-blanca-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_termal p
CROSS JOIN (VALUES
    -- Blanco (50 unidades)
    ('REM-TRM-BLA-XS', 'Blanco', 'BLANCO', 'XS', 8),
    ('REM-TRM-BLA-S',  'Blanco', 'BLANCO', 'S',  14),
    ('REM-TRM-BLA-M',  'Blanco', 'BLANCO', 'M',  16),
    ('REM-TRM-BLA-L',  'Blanco', 'BLANCO', 'L',  12),
    -- Negro (50 unidades)
    ('REM-TRM-NEG-XS', 'Negro', 'NEGRO', 'XS', 8),
    ('REM-TRM-NEG-S',  'Negro', 'NEGRO', 'S',  14),
    ('REM-TRM-NEG-M',  'Negro', 'NEGRO', 'M',  16),
    ('REM-TRM-NEG-L',  'Negro', 'NEGRO', 'L',  12)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 6.1 JEAN INDIGO (REGULAR + SUELTO)
-- ============================================================================
-- Total: 34 unidades
-- Regular: 24 | Suelto: 10
-- Regular: XS:4, S:8, M:8, L:4
-- Suelto:  XS:2, S:3, M:3, L:2
-- SKU: JEA-IND-REG-{TALLE} / JEA-IND-SUE-{TALLE}
-- ============================================================================

-- Jean Indigo Regular
WITH producto_jean_indigo_reg AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN SELVEDGE JAPONES FIT REGULAR',
        'JEAN SELVEDGE<br>JAPONES',
        'PANTALONES / JEANS',
        'DENIM JAPONES 14OZ. CORTE REGULAR. SELVEDGE AUTÉNTICO. HECHO EN ARGENTINA.',
        8500000, -- $85.000
        ARRAY['assets/images/products/jean-indigo-bootcut-front.png', 'assets/images/products/jean-indigo-bootcut-back.png', 'assets/images/products/jean-indigo-fold.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_jean_indigo_reg p
CROSS JOIN (VALUES
    ('JEA-IND-REG-XS', 'Índigo', 'ÍNDIGO', 'XS', 4),
    ('JEA-IND-REG-S',  'Índigo', 'ÍNDIGO', 'S',  8),
    ('JEA-IND-REG-M',  'Índigo', 'ÍNDIGO', 'M',  8),
    ('JEA-IND-REG-L',  'Índigo', 'ÍNDIGO', 'L',  4)
) AS v(sku, color, colorway, talle, stock);

-- Jean Indigo Suelto
WITH producto_jean_indigo_sue AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN SELVEDGE JAPONES FIT SUELTO',
        'JEAN SELVEDGE<br>JAPONES SUELTO',
        'PANTALONES / JEANS',
        'DENIM JAPONES 14OZ. CORTE SUELTO/BAGGY. SELVEDGE AUTÉNTICO. HECHO EN ARGENTINA.',
        8500000, -- $85.000
        ARRAY['assets/images/products/jean-indigo-suelto-front.png', 'assets/images/products/jean-indigo-suelto-back.png', 'assets/images/products/jean-indigo-fold.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_jean_indigo_sue p
CROSS JOIN (VALUES
    ('JEA-IND-SUE-XS', 'Índigo', 'ÍNDIGO', 'XS', 2),
    ('JEA-IND-SUE-S',  'Índigo', 'ÍNDIGO', 'S',  3),
    ('JEA-IND-SUE-M',  'Índigo', 'ÍNDIGO', 'M',  3),
    ('JEA-IND-SUE-L',  'Índigo', 'ÍNDIGO', 'L',  2)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 6.2 JEAN NEGRO (solo Regular)
-- ============================================================================
-- Total: 10 unidades (todos regular)
-- Distribución: XS:2, S:3, M:3, L:2
-- SKU: JEA-NEG-REG-{TALLE}
-- ============================================================================

WITH producto_jean_negro AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN SELVEDGE JAPONES NEGRO FIT REGULAR',
        'JEAN SELVEDGE<br>JAPONES',
        'PANTALONES / JEANS',
        'DENIM JAPONES 14OZ NEGRO. CORTE REGULAR. SELVEDGE AUTÉNTICO. HECHO EN ARGENTINA.',
        8500000, -- $85.000
        ARRAY['assets/images/products/jean-negro-bootcut-font.png', 'assets/images/products/jean-negro-bootcut-back.png', 'assets/images/products/jean-negro-fold.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_jean_negro p
CROSS JOIN (VALUES
    ('JEA-NEG-REG-XS', 'Negro', 'NEGRO', 'XS', 2),
    ('JEA-NEG-REG-S',  'Negro', 'NEGRO', 'S',  3),
    ('JEA-NEG-REG-M',  'Negro', 'NEGRO', 'M',  3),
    ('JEA-NEG-REG-L',  'Negro', 'NEGRO', 'L',  2)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 7.1 BERMUDA PATCHWORK
-- ============================================================================
-- Total: 10 unidades
-- Distribución: XS:1, S:3, M:4, L:2
-- SKU: BER-PAT-MIX-{TALLE}
-- ============================================================================

WITH producto_bermuda_patch AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'BERMUDA SELVEDGE PATCHWORK',
        'BERMUDA SELVEDGE<br>PATCHWORK',
        'BERMUDAS / SHORTS',
        'BERMUDA CONSTRUCCIÓN PATCHWORK. COMBINACIÓN ÍNDIGO Y NEGRO. SELVEDGE AUTÉNTICO. HECHA EN ARGENTINA.',
        7500000, -- $75.000
        ARRAY['assets/images/products/bermuda-patchwork-front.png', 'assets/images/products/bermuda-patchwork-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_bermuda_patch p
CROSS JOIN (VALUES
    ('BER-PAT-MIX-XS', 'Índigo/Negro', 'ÍNDIGO/NEGRO', 'XS', 1),
    ('BER-PAT-MIX-S',  'Índigo/Negro', 'ÍNDIGO/NEGRO', 'S',  3),
    ('BER-PAT-MIX-M',  'Índigo/Negro', 'ÍNDIGO/NEGRO', 'M',  4),
    ('BER-PAT-MIX-L',  'Índigo/Negro', 'ÍNDIGO/NEGRO', 'L',  2)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 7.2 BERMUDA DOUBLE KNEE
-- ============================================================================
-- Total: 36 unidades
-- Distribución: XS:4, S:12, M:12, L:8
-- SKU: BER-DK-NEG-{TALLE}
-- ============================================================================

WITH producto_bermuda_dk AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'BERMUDA SELVEDGE DOUBLE KNEE',
        'BERMUDA SELVEDGE<br>DOUBLE KNEE',
        'BERMUDAS / SHORTS',
        'BERMUDA WORKWEAR ESTILO. REFUERZO DOUBLE KNEE. SELVEDGE AUTÉNTICO. HECHA EN ARGENTINA.',
        7000000, -- $70.000
        ARRAY['assets/images/products/bermuda-DK-front.png', 'assets/images/products/bermuda-DK-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock)
SELECT 
    p.id,
    v.sku,
    v.color,
    v.colorway,
    v.talle,
    v.stock
FROM producto_bermuda_dk p
CROSS JOIN (VALUES
    ('BER-DK-NEG-XS', 'Negro', 'NEGRO', 'XS', 4),
    ('BER-DK-NEG-S',  'Negro', 'NEGRO', 'S',  12),
    ('BER-DK-NEG-M',  'Negro', 'NEGRO', 'M',  12),
    ('BER-DK-NEG-L',  'Negro', 'NEGRO', 'L',  8)
) AS v(sku, color, colorway, talle, stock);


-- ============================================================================
-- 8.1 JEAN "SUELA ROJA" - PIEZA 1/1 ARCHIVO
-- ============================================================================
-- Total: 1 unidad (ÚNICA, no reponible)
-- Talle: M
-- Flag one_of_one: true
-- SKU: JEA-1/1-SUR-M
-- ============================================================================

WITH producto_suela_roja AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN INTERVENIDO "SUELA ROJA" BOOTCUT',
        'JEAN INTERVENIDO<br>"SUELA ROJA"<br>FIT BOOTCUT',
        'ARCHIVO',
        'JEAN LEVI''S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM CLÁSICO CON LAVADO NATURAL Y CORTE BOOTCUT. EL COLOR BUSCA REINTERPRETAR EL LEGADO DE LA SUELA ROJA, FUNDIENDO EL CELESTE CLÁSICO EN UN ROJO VIBRANTE. COSTURA INFERIOR ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE INTERVENCIONES. HECHO A MANO EN ARGENTINA.',
        15000000, -- $150.000
        ARRAY['assets/images/products/jean-archivo-1-front.png', 'assets/images/products/jean-archivo-1-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock, one_of_one)
SELECT 
    p.id,
    'JEA-1/1-SUR-M',
    'Azul Lavado',
    '1/1',
    'M',
    1,
    true  -- Pieza única, no reponible
FROM producto_suela_roja p;


-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Todos los productos y variantes están insertados.
--
-- VERIFICACIÓN:
-- Para verificar que todo se insertó correctamente, ejecutá estas queries:
--
-- Ver total de productos:
-- SELECT COUNT(*) FROM productos;
-- (Debería dar 11)
--
-- Ver total de variantes:
-- SELECT COUNT(*) FROM variantes_producto;
-- (Debería dar 76)
--
-- Ver stock total:
-- SELECT SUM(stock) FROM variantes_producto;
-- (Debería dar ~591)
--
-- Ver productos con sus variantes:
-- SELECT p.nombre, v.sku, v.color, v.talle, v.stock 
-- FROM productos p 
-- JOIN variantes_producto v ON p.id = v.producto_id
-- ORDER BY p.nombre, v.talle;
--
-- ============================================================================
