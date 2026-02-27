-- ============================================================================
-- ARCHIVO: 05_agregar_update_policies.sql
-- PROPÓSITO: Agregar políticas UPDATE faltantes para checkout
-- ============================================================================
--
-- PROBLEMA:
-- Las políticas RLS originales solo permiten INSERT y SELECT.
-- El checkout necesita UPDATE para:
--   1. Actualizar datos del cliente si ya existe (mismo email)
--   2. Actualizar dirección al volver de Step 2 a Step 1
--   3. Actualizar la orden con nueva dirección o datos de envío
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run"
--
-- ============================================================================

-- Permitir actualizar clientes (upsert por email en checkout)
CREATE POLICY "Actualizar cliente en checkout"
ON clientes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Permitir actualizar direcciones de envío (re-edición en checkout)
CREATE POLICY "Actualizar dirección en checkout"
ON direcciones_envio
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Permitir actualizar órdenes (agregar envío, cambiar estado, etc.)
CREATE POLICY "Actualizar orden en checkout"
ON ordenes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Después de ejecutar esto, el flujo de volver a Información y
-- re-continuar a Envíos debería funcionar sin errores.
-- ============================================================================
