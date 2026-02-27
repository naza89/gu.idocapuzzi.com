-- ============================================================================
-- ARCHIVO: 02_politicas_rls.sql
-- PROPÓSITO: Configurar Row Level Security (RLS) para las tablas
-- ============================================================================
--
-- ¿QUÉ ES RLS?
-- Row Level Security son reglas que definen quién puede leer/escribir cada fila.
-- Aunque alguien tenga la anon key (que es pública), solo puede hacer
-- lo que las políticas permitan.
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO este archivo
-- 4. Click en "Run"
--
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================
-- Por defecto, si RLS está habilitado y no hay políticas,
-- nadie puede leer ni escribir nada (excepto con service_role key).
-- ============================================================================

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA: productos
-- ============================================================================
-- Los productos activos son públicos para lectura.
-- Solo el admin (service_role) puede crear/modificar productos.
-- ============================================================================

-- Cualquiera puede leer productos activos
CREATE POLICY "Productos activos son públicos"
ON productos
FOR SELECT
USING (activo = true);

-- ============================================================================
-- POLÍTICAS PARA: variantes_producto
-- ============================================================================
-- Las variantes son públicas para lectura.
-- Esto es necesario para mostrar stock disponible.
-- ============================================================================

-- Cualquiera puede leer variantes
CREATE POLICY "Variantes son públicas"
ON variantes_producto
FOR SELECT
USING (true);

-- ============================================================================
-- POLÍTICAS PARA: clientes
-- ============================================================================
-- Los clientes pueden ver solo sus propios datos.
-- Cualquiera puede crear un cliente (checkout anónimo).
-- ============================================================================

-- Crear cliente desde checkout (anónimo)
CREATE POLICY "Crear cliente en checkout"
ON clientes
FOR INSERT
WITH CHECK (true);

-- Ver solo datos propios (requiere autenticación Supabase Auth)
-- Por ahora dejamos esta política básica; se refinará con Auth
CREATE POLICY "Cliente ve sus propios datos"
ON clientes
FOR SELECT
USING (true);  -- Temporal: se ajustará cuando implementemos Auth

-- ============================================================================
-- POLÍTICAS PARA: direcciones_envio
-- ============================================================================

-- Crear dirección en checkout
CREATE POLICY "Crear dirección en checkout"
ON direcciones_envio
FOR INSERT
WITH CHECK (true);

-- Ver direcciones propias
CREATE POLICY "Ver direcciones propias"
ON direcciones_envio
FOR SELECT
USING (true);  -- Temporal: se ajustará cuando implementemos Auth

-- ============================================================================
-- POLÍTICAS PARA: ordenes
-- ============================================================================

-- Cualquiera puede crear una orden (checkout anónimo)
CREATE POLICY "Crear orden en checkout"
ON ordenes
FOR INSERT
WITH CHECK (true);

-- Ver órdenes propias
CREATE POLICY "Ver órdenes propias"
ON ordenes
FOR SELECT
USING (true);  -- Temporal: se ajustará cuando implementemos Auth

-- ============================================================================
-- POLÍTICAS PARA: items_orden
-- ============================================================================

-- Crear items al crear orden
CREATE POLICY "Crear items de orden"
ON items_orden
FOR INSERT
WITH CHECK (true);

-- Ver items de órdenes propias
CREATE POLICY "Ver items de órdenes propias"
ON items_orden
FOR SELECT
USING (true);  -- Temporal: se ajustará cuando implementemos Auth

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Las políticas básicas están configuradas.
-- 
-- NOTA IMPORTANTE:
-- Estas políticas son permisivas para el MVP. Cuando implementemos
-- Supabase Auth, las ajustaremos para que cada cliente solo pueda
-- ver sus propios datos usando auth.uid().
--
-- Siguiente paso: Ejecutar 03_insertar_productos.sql
-- ============================================================================
