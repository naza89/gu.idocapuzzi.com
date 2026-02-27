-- ============================================================================
-- ARCHIVO: 04_verificacion.sql
-- PROPÓSITO: Queries para verificar que todo se insertó correctamente
-- ============================================================================
--
-- CÓMO USAR:
-- Después de ejecutar los scripts 01, 02 y 03, ejecutá estas queries
-- una por una para verificar que todo esté bien.
--
-- ============================================================================

-- ============================================================================
-- VERIFICACIÓN 1: Contar productos
-- ============================================================================
-- Esperado: 11 productos
-- ============================================================================

SELECT COUNT(*) as total_productos FROM productos;

-- ============================================================================
-- VERIFICACIÓN 2: Contar variantes
-- ============================================================================
-- Esperado: 76 variantes
-- ============================================================================

SELECT COUNT(*) as total_variantes FROM variantes_producto;

-- ============================================================================
-- VERIFICACIÓN 3: Stock total
-- ============================================================================
-- Esperado: ~591 unidades
-- ============================================================================

SELECT SUM(stock) as stock_total FROM variantes_producto;

-- ============================================================================
-- VERIFICACIÓN 4: Ver resumen por producto
-- ============================================================================
-- Muestra cada producto con cantidad de variantes y stock total
-- ============================================================================

SELECT 
    p.nombre,
    p.categoria,
    COUNT(v.id) as variantes,
    SUM(v.stock) as stock_total
FROM productos p
LEFT JOIN variantes_producto v ON p.id = v.producto_id
GROUP BY p.id, p.nombre, p.categoria
ORDER BY p.categoria, p.nombre;

-- ============================================================================
-- VERIFICACIÓN 5: Ver detalle de SKUs
-- ============================================================================
-- Lista completa de SKUs con stock
-- ============================================================================

SELECT 
    p.nombre,
    v.sku,
    v.color,
    v.talle,
    v.stock,
    v.one_of_one
FROM productos p
JOIN variantes_producto v ON p.id = v.producto_id
ORDER BY p.nombre, v.talle;

-- ============================================================================
-- VERIFICACIÓN 6: Verificar pieza 1/1
-- ============================================================================
-- Debe mostrar solo el Jean Suela Roja con one_of_one = true
-- ============================================================================

SELECT 
    p.nombre,
    v.sku,
    v.stock,
    v.one_of_one
FROM productos p
JOIN variantes_producto v ON p.id = v.producto_id
WHERE v.one_of_one = true;

-- ============================================================================
-- VERIFICACIÓN 7: Ver productos por categoría
-- ============================================================================

SELECT 
    categoria,
    COUNT(*) as productos
FROM productos
GROUP BY categoria
ORDER BY categoria;

-- ============================================================================
-- VERIFICACIÓN 8: Verificar RLS está habilitado
-- ============================================================================

SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('productos', 'variantes_producto', 'clientes', 'ordenes', 'items_orden');

-- ============================================================================
-- ¡VERIFICACIÓN COMPLETA!
-- ============================================================================
-- Si todas las queries dieron los resultados esperados, la base de datos
-- está correctamente configurada.
--
-- RESUMEN ESPERADO:
-- - 11 productos base
-- - 76 variantes (producto + color + talle)
-- - ~591 unidades en stock total
-- - 1 pieza única (one_of_one)
-- - RLS habilitado en todas las tablas
-- ============================================================================
