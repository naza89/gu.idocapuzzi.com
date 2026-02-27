-- ============================================================================
-- ARCHIVO: 07_oca_envios.sql
-- PROPÓSITO: Agregar columnas necesarias para integración OCA ePak
-- ============================================================================
-- 
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run"
--
-- ============================================================================

-- ============================================================================
-- TABLA: ordenes — columnas para OCA
-- ============================================================================
-- Campos para vincular cada orden con su envío OCA.
-- ============================================================================

ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS operativa_oca         INTEGER;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS id_sucursal_oca       INTEGER;  -- solo si retira en sucursal
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS id_orden_retiro_oca   INTEGER;  -- generado por OCA al crear envío
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nro_envio_oca         TEXT;     -- 19 dígitos, asignado por OCA
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS precio_envio          DECIMAL(10,2);
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS tipo_envio            TEXT;     -- 'puerta_puerta' | 'sucursal'

COMMENT ON COLUMN ordenes.operativa_oca IS 'ID de la operativa OCA usada para este envío';
COMMENT ON COLUMN ordenes.id_sucursal_oca IS 'ID de sucursal OCA de destino (solo para retiro en sucursal)';
COMMENT ON COLUMN ordenes.id_orden_retiro_oca IS 'ID de orden de retiro generado por OCA al crear el envío';
COMMENT ON COLUMN ordenes.nro_envio_oca IS 'Número de envío OCA (19 dígitos) para tracking';
COMMENT ON COLUMN ordenes.precio_envio IS 'Precio del envío cobrado al cliente (en pesos)';
COMMENT ON COLUMN ordenes.tipo_envio IS 'Tipo de envío: puerta_puerta o sucursal';

-- ============================================================================
-- TABLA: variantes_producto — campos para cálculo de envío
-- ============================================================================
-- Mientras no se carguen estos valores, calculators.ts usa estimados.
-- ============================================================================

ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS peso_kg  DECIMAL(5,2);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS alto_cm  DECIMAL(5,1);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS ancho_cm DECIMAL(5,1);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS largo_cm DECIMAL(5,1);

COMMENT ON COLUMN variantes_producto.peso_kg IS 'Peso de la prenda en kg (ej: 0.3)';
COMMENT ON COLUMN variantes_producto.alto_cm IS 'Alto de la prenda doblada en cm';
COMMENT ON COLUMN variantes_producto.ancho_cm IS 'Ancho de la prenda doblada en cm';
COMMENT ON COLUMN variantes_producto.largo_cm IS 'Largo de la prenda doblada en cm';

-- ============================================================================
-- TABLA: direcciones_envio — campos separados para OCA
-- ============================================================================
-- OCA requiere calle y número separados.
-- Estos campos se agregan sin eliminar el campo "direccion" existente
-- para compatibilidad con datos ya cargados.
-- ============================================================================

ALTER TABLE direcciones_envio ADD COLUMN IF NOT EXISTS calle    VARCHAR(200);
ALTER TABLE direcciones_envio ADD COLUMN IF NOT EXISTS numero   VARCHAR(20);
ALTER TABLE direcciones_envio ADD COLUMN IF NOT EXISTS piso     VARCHAR(20);
ALTER TABLE direcciones_envio ADD COLUMN IF NOT EXISTS depto    VARCHAR(20);

COMMENT ON COLUMN direcciones_envio.calle IS 'Nombre de la calle (separado del número para OCA)';
COMMENT ON COLUMN direcciones_envio.numero IS 'Número de la dirección (separado de la calle para OCA)';
COMMENT ON COLUMN direcciones_envio.piso IS 'Piso (opcional)';
COMMENT ON COLUMN direcciones_envio.depto IS 'Departamento (opcional)';

-- ============================================================================
-- Índice para búsquedas por tracking
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ordenes_nro_envio_oca ON ordenes(nro_envio_oca);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_orden_retiro ON ordenes(id_orden_retiro_oca);

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Siguiente paso: configurar las variables de entorno OCA en Vercel Dashboard.
-- ============================================================================
