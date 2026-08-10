-- ============================================================================
-- 15. CATÁLOGO — INTERVENCIONES AGOSTO 2026
-- ============================================================================
-- Alinea Supabase con el catálogo de public/js/start.js tras la sesión 2026-08-07.
--
-- IMPORTANTE: obtenerStock() y obtenerVariantesStock() (public/js/supabase-config.js)
-- buscan el producto por `nombre` exacto. Si el front dice "JEAN PINTOR \"WILDCAT\""
-- y la DB sigue diciendo "JEAN INTERVENIDO \"SUELA ROJA\" BOOTCUT", el lookup de
-- stock devuelve null en silencio. Por eso este script es prerequisito de cualquier
-- test del flujo de compra de estas piezas.
--
-- ⚠️ NO EJECUTAR TODAVÍA: los stocks de las 2 piezas nuevas están en 1 (pieza única)
-- pero el resto del inventario lo confirma Naza con la tabla de stock actual.
--
-- Orden: ejecutar entero en el SQL Editor de Supabase, en una sola transacción.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. RENOMBRAR LAS 2 INTERVENCIONES EXISTENTES
-- ----------------------------------------------------------------------------
-- "Intervenido" sale del nombre; ambas pasan a la línea PINTOR.
-- La categoría pasa de 'ARCHIVO' a 'INTERVENCIONES' (rename hecho en el front
-- en la sesión 2026-07-10 para no colisionar con la página /archivo).

UPDATE productos
SET nombre    = 'JEAN PINTOR "WILDCAT"',
    titulo    = 'JEAN PINTOR<br>"WILDCAT"<br>FIT BOOTCUT',
    categoria = 'INTERVENCIONES',
    updated_at = now()
WHERE nombre = 'JEAN INTERVENIDO "SUELA ROJA" BOOTCUT';

UPDATE productos
SET nombre    = 'JEAN PINTOR "FAJA"',
    titulo    = 'JEAN PINTOR<br>"FAJA"<br>FIT BOOTCUT',
    categoria = 'INTERVENCIONES',
    updated_at = now()
WHERE nombre = 'JEAN INTERVENIDO "ENCERADO" BOOTCUT';

-- El colorway del Faja deja de llamarse "Negro Encerado" para no chocar con la
-- pieza encerada real que se inserta más abajo.
UPDATE variantes_producto
SET color = 'Negro Pintado', updated_at = now()
WHERE sku = 'JEA-1/1-ENC-M';

-- ----------------------------------------------------------------------------
-- 2. JEAN ENCERADO (nuevo, 1/1)
-- ----------------------------------------------------------------------------
WITH nuevo AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'JEAN ENCERADO',
        'JEAN<br>ENCERADO<br>FIT BOOTCUT',
        'INTERVENCIONES',
        'JEAN LEVI''S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM CLÁSICO DE CORTE BOOTCUT, RECUBIERTO A MANO CON UNA MEZCLA DE PARAFINA Y CERA DE ABEJAS APLICADA EN CALIENTE. EL ENCERADO SELLA EL TEJIDO, LE DA CUERPO Y UN BRILLO OPACO QUE SE VA QUEBRANDO CON EL USO. COSTURA INFERIOR ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE INTERVENCIONES. HECHO A MANO EN ARGENTINA.',
        15000000, -- $150.000
        ARRAY['assets/images/products/jean-archivo-3-front.png', 'assets/images/products/jean-archivo-3-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock, one_of_one)
SELECT n.id, 'JEA-1/1-WAX-M', 'Verde Encerado', '1/1', 'M', 1, true
FROM nuevo n;

-- ----------------------------------------------------------------------------
-- 3. BERMUDA CAMO "WOODLAND" (nueva, 1/1)
-- ----------------------------------------------------------------------------
WITH nueva AS (
    INSERT INTO productos (nombre, titulo, categoria, descripcion, precio_centavos, imagenes, activo)
    VALUES (
        'BERMUDA CAMO "WOODLAND"',
        'BERMUDA CAMO<br>"WOODLAND"',
        'INTERVENCIONES',
        'PANTALÓN CARGO MILITAR EN CAMUFLADO WOODLAND INTERVENIDO A MANO. PIEZA 1/1. CORTADO A LA ALTURA DE LA BERMUDA Y ABIERTO CON PANELES AGREGADOS SOBRE LA ENTREPIERNA, QUE LLEVAN EL CALCE A UNA SILUETA MUCHO MÁS ANCHA. BAJO DESHILACHADO SIN DOBLADILLO. BOLSILLOS CARGO ORIGINALES. AVÍOS Y ETIQUETAS DE LA MARCA. HECHA A MANO EN ARGENTINA.',
        13000000, -- $130.000
        ARRAY['assets/images/products/bermuda-archivo-front.png', 'assets/images/products/bermuda-archivo-back.png'],
        true
    )
    RETURNING id
)
INSERT INTO variantes_producto (producto_id, sku, color, colorway, talle, stock, one_of_one)
SELECT n.id, 'BER-1/1-CAM-M', 'Camo', '1/1', 'M', 1, true
FROM nueva n;

-- ----------------------------------------------------------------------------
-- 4. PRECIOS DE LAS INTERVENCIONES
-- ----------------------------------------------------------------------------
UPDATE productos SET precio_centavos = 15000000, updated_at = now()
WHERE nombre IN ('JEAN PINTOR "WILDCAT"', 'JEAN PINTOR "FAJA"', 'JEAN ENCERADO');

UPDATE productos SET precio_centavos = 13000000, updated_at = now()
WHERE nombre = 'BERMUDA CAMO "WOODLAND"';

-- ----------------------------------------------------------------------------
-- 5. BAJA DE LA BABY TEE NAVY
-- ----------------------------------------------------------------------------
-- No entró en esta producción. Se borran las variantes NAVY del producto
-- "REMERA BABY TEE REGISTRADA" (el producto sigue vivo con BLANCO y NEGRO).
--
-- Si alguna variante NAVY ya fue vendida, items_orden.variante_id la referencia
-- y el DELETE va a fallar por FK — en ese caso, comentar el DELETE y usar el
-- UPDATE de stock 0 de abajo para sacarla de circulación sin romper el historial.

DELETE FROM variantes_producto
WHERE colorway = 'NAVY'
  AND producto_id = (SELECT id FROM productos WHERE nombre = 'REMERA BABY TEE REGISTRADA');

-- Alternativa no destructiva (usar SOLO si el DELETE falla por foreign key):
-- UPDATE variantes_producto SET stock = 0, updated_at = now()
-- WHERE colorway = 'NAVY'
--   AND producto_id = (SELECT id FROM productos WHERE nombre = 'REMERA BABY TEE REGISTRADA');

COMMIT;

-- ============================================================================
-- VERIFICACIÓN (correr después del COMMIT)
-- ============================================================================
-- Los 4 nombres tienen que coincidir EXACTO con el array `products` de start.js.
--
-- SELECT p.nombre, p.categoria, p.precio_centavos, v.sku, v.color, v.colorway, v.talle, v.stock
-- FROM productos p
-- JOIN variantes_producto v ON v.producto_id = p.id
-- WHERE p.categoria = 'INTERVENCIONES'
-- ORDER BY p.nombre;
--
-- SELECT p.nombre, v.colorway, v.talle, v.stock
-- FROM productos p JOIN variantes_producto v ON v.producto_id = p.id
-- WHERE p.nombre = 'REMERA BABY TEE REGISTRADA' ORDER BY v.colorway, v.talle;
--
-- ⚠️ PENDIENTE APARTE (no lo resuelve este script):
-- checkout-logic.js:297 busca variante_id por (colorway, talle) solamente. Las 4
-- intervenciones comparten colorway '1/1', así que ahora hay 4 filas compitiendo
-- por el mismo match en vez de 2. Hay que pasar el lookup a SKU antes de testear
-- una compra de estas piezas. (Fase 0 del plan de rediseño.)
-- ============================================================================
