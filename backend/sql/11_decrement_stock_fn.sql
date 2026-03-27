-- ============================================================================
-- ARCHIVO: 11_decrement_stock_fn.sql
-- PROPÓSITO: Función PostgreSQL para decrementar stock de forma atómica
-- CUÁNDO EJECUTAR: Antes de deployar la Fase 2 del webhook NAVE
--
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Verificación post-ejecución:
--   SELECT stock FROM variantes_producto WHERE id = '<uuid-variante>';
--   SELECT decrement_stock('<uuid-variante>', 1);
--   SELECT stock FROM variantes_producto WHERE id = '<uuid-variante>';
--   -- El stock debe haber bajado 1
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_stock(
    p_variante_id UUID,
    p_cantidad     INT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE variantes_producto
    SET    stock      = stock - p_cantidad,
           updated_at = now()
    WHERE  id = p_variante_id;
END;
$$;

COMMENT ON FUNCTION decrement_stock(UUID, INT)
    IS 'Decrementa el stock de una variante de forma atómica. Llamada desde el webhook NAVE al confirmar un pago (APPROVED). El stock puede quedar en negativo (aceptable para MVP).';
