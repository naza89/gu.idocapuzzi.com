-- ============================================================================
-- 18. FOTOS DE PRODUCCIÓN — productos.imagenes → WebP
-- ============================================================================
-- Apunta `productos.imagenes` a las fotos de la producción del 11/8/2026, que
-- reemplazaron a los PNG viejos en public/assets/images/products/.
--
-- POR QUÉ IMPORTA: `imagenes` no la usa el Shop ni la PDP (esos leen el catálogo
-- hardcodeado de public/js/start.js). La lee el backend para las miniaturas de
-- las órdenes:
--   · GET /api/ordenes/[id]        → página de confirmación post-pago
--   · GET /api/cliente/ordenes     → "Mis Pedidos" del dashboard
--   · public/js/start.js:2467 y :3212 → renderizan imagenes[0]
-- Si no se corre, la confirmación de compra sigue mostrando las fotos viejas
-- mientras el resto del sitio muestra las nuevas.
--
-- BUG QUE ARREGLA DE PASO: la Baby Tee apuntaba a
-- `remera-babytee-blanca-front.png` / `-back.png`, que NO existen en disco (el
-- archivo real se llamaba `remera-bbytee-blanca-front.png`, y el `-back` nunca
-- existió). O sea que hoy la miniatura de una orden de Baby Tee da 404.
--
-- ⚠️ ORDEN DE EJECUCIÓN: correr DESPUÉS de deployar el código, igual que las
-- migraciones 16 y 17. Si se corre antes, la base apunta a WebP que todavía no
-- están en el servidor y las miniaturas dan 404 hasta el deploy.
--
-- NOTA: `productos` tiene una fila por MODELO (14 filas), mientras que el front
-- tiene una entrada por COLORWAY (21). Por eso cada fila lleva las fotos del
-- colorway representativo — el mismo criterio que ya venía de la migración 03.
--
-- Orden: ejecutar entero en el SQL Editor de Supabase, en una sola transacción.
-- ============================================================================

BEGIN;

-- REMERAS -------------------------------------------------------------------
UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/remera-guido-negro-1.webp',
    'assets/images/products/remera-guido-negro-2.webp'
] WHERE nombre = 'REMERA GÜIDO OVERSIZED';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/remera-afligida-negro-1.webp',
    'assets/images/products/remera-afligida-negro-2.webp'
] WHERE nombre = 'REMERA AFLIGIDA BAGGED TEE';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/baby-tee-blanco-1.webp',
    'assets/images/products/baby-tee-blanco-2.webp'
] WHERE nombre = 'REMERA BABY TEE REGISTRADA';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/termal-blanco-1.webp',
    'assets/images/products/termal-blanco-2.webp'
] WHERE nombre = 'REMERA MANGA LARGA TERMAL';

-- TOPS / MUSCULOSAS ---------------------------------------------------------
UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/musculosa-negra-1.webp',
    'assets/images/products/musculosa-negra-2.webp'
] WHERE nombre = 'MUSCULOSA DOBLE SIMBOLO OVERSIZED';

-- PANTALONES / JEANS --------------------------------------------------------
UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-selvedge-suelto-indigo-1.webp',
    'assets/images/products/jean-selvedge-suelto-indigo-2.webp'
] WHERE nombre = 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-selvedge-regular-indigo-1.webp',
    'assets/images/products/jean-selvedge-regular-indigo-2.webp'
] WHERE nombre = 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-selvedge-regular-negro-1.webp',
    'assets/images/products/jean-selvedge-regular-negro-2.webp'
] WHERE nombre = 'JEAN DE DENIM SELVEDGE ITALIANO FIT REGULAR';

-- BERMUDAS / SHORTS ---------------------------------------------------------
UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/bermuda-double-knee-negro-1.webp',
    'assets/images/products/bermuda-double-knee-negro-2.webp'
] WHERE nombre = 'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/bermuda-patchwork-indigo-1.webp',
    'assets/images/products/bermuda-patchwork-indigo-2.webp'
] WHERE nombre = 'BERMUDA DE DENIM SELVEDGE PATCHWORK';

-- INTERVENCIONES (1/1) ------------------------------------------------------
UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-pintor-wildcat-1.webp',
    'assets/images/products/jean-pintor-wildcat-2.webp'
] WHERE nombre = 'JEAN PINTOR "WILDCAT"';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-pintor-faja-1.webp',
    'assets/images/products/jean-pintor-faja-2.webp'
] WHERE nombre = 'JEAN PINTOR "FAJA"';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/jean-encerado-1.webp',
    'assets/images/products/jean-encerado-2.webp'
] WHERE nombre = 'JEAN ENCERADO';

UPDATE productos SET imagenes = ARRAY[
    'assets/images/products/bermuda-camo-woodland-1.webp',
    'assets/images/products/bermuda-camo-woodland-2.webp'
] WHERE nombre = 'BERMUDA CAMO "WOODLAND"';

-- ----------------------------------------------------------------------------
-- Verificación: no debe quedar ningún .png y las 14 filas deben tener 2 fotos.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    con_png INTEGER;
    sin_dos INTEGER;
BEGIN
    SELECT COUNT(*) INTO con_png
    FROM productos WHERE activo = true AND array_to_string(imagenes, ',') LIKE '%.png%';

    SELECT COUNT(*) INTO sin_dos
    FROM productos WHERE activo = true AND COALESCE(array_length(imagenes, 1), 0) <> 2;

    IF con_png > 0 THEN
        RAISE EXCEPTION 'Quedaron % productos apuntando a .png', con_png;
    END IF;
    IF sin_dos > 0 THEN
        RAISE EXCEPTION 'Quedaron % productos sin exactamente 2 imágenes', sin_dos;
    END IF;

    RAISE NOTICE 'OK: los 14 productos activos apuntan a WebP nuevos.';
END $$;

COMMIT;
