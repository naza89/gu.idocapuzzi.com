-- ============================================================================
-- ARCHIVO: 17_rls_lockdown_checkout.sql
-- PROPÓSITO: Cerrar el RLS de ordenes/clientes/direcciones/items.
-- ============================================================================
--
-- CONTEXTO:
-- Hasta ahora las políticas eran `USING (true)` / `WITH CHECK (true)` para que
-- el browser (anon key, pública) pudiera crear y leer órdenes, clientes y
-- direcciones. Eso permitía a cualquiera:
--   - marcar su propia orden como `pagado` sin pagar (UPDATE abierto);
--   - leer el padrón completo de clientes con email/teléfono/domicilio (SELECT abierto);
--   - reescribir la dirección de una orden ajena (UPDATE abierto).
--
-- Desde este cambio, TODA la escritura de checkout pasa por API routes con
-- service_role (POST /api/checkout/crear-orden, PATCH /api/ordenes/[id],
-- /api/cliente/*), que bypassean el RLS. El browser anónimo ya no necesita
-- escribir ni leer estas tablas directamente.
--
-- ⚠️ ORDEN DE DESPLIEGUE: desplegar PRIMERO el código nuevo (que ya no escribe
-- desde el browser) y recién DESPUÉS correr esta migración. Si se corre estando
-- todavía el código viejo en producción, el checkout viejo se rompe.
--
-- CÓMO EJECUTAR:
-- 1. Supabase Dashboard > SQL Editor > New query
-- 2. Pegar este archivo y Run
-- ============================================================================

-- ── Quitar políticas anónimas abiertas de INSERT/UPDATE/SELECT ──
-- (creación y actualización ahora son server-side con service_role)

-- clientes
DROP POLICY IF EXISTS "Crear cliente en checkout" ON clientes;
DROP POLICY IF EXISTS "Actualizar cliente en checkout" ON clientes;
DROP POLICY IF EXISTS "Cliente ve sus propios datos" ON clientes;

-- direcciones_envio
DROP POLICY IF EXISTS "Crear dirección en checkout" ON direcciones_envio;
DROP POLICY IF EXISTS "Actualizar dirección en checkout" ON direcciones_envio;
DROP POLICY IF EXISTS "Ver direcciones propias" ON direcciones_envio;

-- ordenes
DROP POLICY IF EXISTS "Crear orden en checkout" ON ordenes;
DROP POLICY IF EXISTS "Actualizar orden en checkout" ON ordenes;
DROP POLICY IF EXISTS "Ver órdenes propias" ON ordenes;

-- items_orden
DROP POLICY IF EXISTS "Crear items de orden" ON items_orden;
DROP POLICY IF EXISTS "Ver items de órdenes propias" ON items_orden;

-- ── Lectura autenticada (dashboard /cuenta) por email del JWT ──
-- ordenes e items ya tienen SELECT autenticado en la migración 10
-- ("usuarios ven sus propias ordenes" / "...propios items"). Agregamos el
-- equivalente para clientes y direcciones, que faltaba.

-- El browser autenticado lee su propia fila de clientes en _loadCuentaPreferencias.
CREATE POLICY "cliente ve sus propios datos (auth)"
ON clientes
FOR SELECT
USING (email = auth.email());

CREATE POLICY "cliente ve sus propias direcciones (auth)"
ON direcciones_envio
FOR SELECT
USING (
  cliente_id IN (SELECT id FROM clientes WHERE email = auth.email())
);

-- ============================================================================
-- NOTA: productos y variantes_producto mantienen su SELECT público (necesario
-- para el shop y el stock). No se tocan acá.
--
-- Verificación posterior sugerida (debería devolver sólo políticas con
-- condición basada en auth.email() o public SELECT de catálogo):
--
--   SELECT tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE tablename IN ('clientes','direcciones_envio','ordenes','items_orden')
--   ORDER BY tablename, cmd;
-- ============================================================================
