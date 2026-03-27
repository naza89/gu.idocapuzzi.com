-- Migración 10: políticas RLS para dashboard del usuario
-- Permite que usuarios autenticados lean sus propias órdenes e items
-- Matchea por email del JWT contra el email en la tabla clientes

CREATE POLICY "usuarios ven sus propias ordenes"
ON ordenes
FOR SELECT
USING (
  cliente_id IN (
    SELECT id FROM clientes WHERE email = auth.email()
  )
);

CREATE POLICY "usuarios ven sus propios items"
ON items_orden
FOR SELECT
USING (
  orden_id IN (
    SELECT id FROM ordenes WHERE cliente_id IN (
      SELECT id FROM clientes WHERE email = auth.email()
    )
  )
);
