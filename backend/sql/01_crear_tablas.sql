-- ============================================================================
-- ARCHIVO: 01_crear_tablas.sql
-- PROPÓSITO: Crear la estructura de tablas para GÜIDO CAPUZZI
-- ============================================================================
-- 
-- CÓMO EJECUTAR ESTE ARCHIVO:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run" (botón verde) o presionar Ctrl+Enter
-- 5. Debería decir "Success. No rows returned" - esto está bien
--
-- ============================================================================

-- ============================================================================
-- TABLA: productos
-- ============================================================================
-- Esta tabla guarda la información BASE de cada producto.
-- Ejemplo: "Remera Logo Güido Oversized" es UN producto base,
-- aunque tenga variantes en negro, blanco, etc.
--
-- Campos importantes:
-- - id: Identificador único (UUID). Supabase lo genera automáticamente.
-- - precio_centavos: Guardamos el precio en centavos para evitar errores
--   de decimales. $50.000 se guarda como 5000000 (50000.00 * 100)
-- - imagenes: Array de URLs de las imágenes del producto
-- - activo: Si es false, el producto no se muestra en la tienda
-- ============================================================================

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    titulo VARCHAR(255),
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    descripcion TEXT,
    precio_centavos INTEGER NOT NULL,
    imagenes TEXT[],
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentario en la tabla para documentación
COMMENT ON TABLE productos IS 'Productos base de la tienda GÜIDO CAPUZZI';
COMMENT ON COLUMN productos.precio_centavos IS 'Precio en centavos. $50.000 = 5000000';

-- ============================================================================
-- TABLA: variantes_producto
-- ============================================================================
-- Cada producto puede tener múltiples variantes.
-- Una variante = Producto + Color + Talle
--
-- Ejemplo: La "Remera Logo Güido Oversized" tiene estas variantes:
-- - Negro logo blanco XS (SKU: REM-LOGO-NBL-XS)
-- - Negro logo blanco S  (SKU: REM-LOGO-NBL-S)
-- - Negro logo blanco M  (SKU: REM-LOGO-NBL-M)
-- - Negro logo rojo XS   (SKU: REM-LOGO-NRO-XS)
-- ... etc
--
-- El SKU es único y sigue el formato: TIPO-MODELO-COLOR-TALLE
--
-- one_of_one: Para piezas únicas de archivo (sin re-stock)
-- ============================================================================

CREATE TABLE IF NOT EXISTS variantes_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(100) NOT NULL,
    colorway VARCHAR(100),
    talle VARCHAR(10) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    one_of_one BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Restricción: No puede haber dos variantes iguales (mismo producto+colorway+talle)
    UNIQUE(producto_id, colorway, talle)
);

COMMENT ON TABLE variantes_producto IS 'Variantes de producto (combinación de color y talle) con stock';
COMMENT ON COLUMN variantes_producto.sku IS 'Código único: TIPO-MODELO-COLOR-TALLE';
COMMENT ON COLUMN variantes_producto.one_of_one IS 'Pieza única de archivo, no reponible';

-- ============================================================================
-- TABLA: clientes
-- ============================================================================
-- Información de los clientes que hacen compras.
-- El email es único - si un cliente vuelve a comprar, se usa el mismo registro.
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    telefono VARCHAR(50),
    newsletter BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE clientes IS 'Clientes registrados o que han hecho compras';

-- ============================================================================
-- TABLA: direcciones_envio
-- ============================================================================
-- Direcciones de envío de los clientes.
-- Un cliente puede tener múltiples direcciones guardadas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS direcciones_envio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    direccion VARCHAR(255) NOT NULL,
    departamento VARCHAR(100),
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    es_predeterminada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE direcciones_envio IS 'Direcciones de envío guardadas por cliente';

-- ============================================================================
-- TABLA: ordenes
-- ============================================================================
-- Registro central de cada orden/pedido.
--
-- Estados posibles:
-- - pendiente: Cliente completó Step 1 del checkout
-- - envio_calculado: Cliente seleccionó método de envío
-- - pago_pendiente: Redirigido a NAVE para pagar
-- - pagado: Pago confirmado exitosamente
-- - preparando: Equipo preparando el pedido
-- - enviado: Pedido despachado con tracking
-- - entregado: Confirmación de entrega
-- - cancelado: Orden cancelada/fallida
--
-- numero_orden: Número legible para el cliente (1001, 1002, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden SERIAL UNIQUE,
    cliente_id UUID REFERENCES clientes(id),
    direccion_envio_id UUID REFERENCES direcciones_envio(id),
    
    -- Estado de la orden
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    
    -- Montos (todo en centavos)
    subtotal_centavos INTEGER NOT NULL,
    costo_envio_centavos INTEGER DEFAULT 0,
    descuento_centavos INTEGER DEFAULT 0,
    total_centavos INTEGER NOT NULL,
    
    -- Metadata
    codigo_descuento VARCHAR(50),
    notas TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    pagado_at TIMESTAMPTZ,
    enviado_at TIMESTAMPTZ,
    entregado_at TIMESTAMPTZ
);

COMMENT ON TABLE ordenes IS 'Órdenes de compra de los clientes';
COMMENT ON COLUMN ordenes.numero_orden IS 'Número de orden legible para el cliente';
COMMENT ON COLUMN ordenes.estado IS 'Estado: pendiente, envio_calculado, pago_pendiente, pagado, preparando, enviado, entregado, cancelado';

-- ============================================================================
-- TABLA: items_orden
-- ============================================================================
-- Líneas de cada orden.
-- Guarda un "snapshot" del producto al momento de la compra,
-- así si después cambia el precio o nombre, la orden histórica no cambia.
-- ============================================================================

CREATE TABLE IF NOT EXISTS items_orden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES variantes_producto(id),
    
    -- Snapshot del producto (inmutable)
    nombre_producto VARCHAR(255) NOT NULL,
    color VARCHAR(100) NOT NULL,
    talle VARCHAR(10) NOT NULL,
    precio_unitario_centavos INTEGER NOT NULL,
    
    cantidad INTEGER NOT NULL DEFAULT 1,
    subtotal_centavos INTEGER NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE items_orden IS 'Items individuales dentro de cada orden';

-- ============================================================================
-- Índices para performance
-- ============================================================================
-- Los índices hacen que las búsquedas sean más rápidas.
-- Creamos índices en los campos que más vamos a buscar.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_sku ON variantes_producto(sku);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_items_orden_orden ON items_orden(orden_id);

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Si llegaste hasta acá sin errores, las tablas están creadas.
-- 
-- Siguiente paso: Ejecutar 02_politicas_rls.sql
-- ============================================================================
