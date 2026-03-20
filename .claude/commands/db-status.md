Consultá el estado de la base de datos Supabase del proyecto GÜIDO CAPUZZI (project_id: `zwzzrqjmnrlkltuijjjf`).

Ejecutá estas queries usando la herramienta MCP de Supabase (`execute_sql`) y mostrá los resultados en una tabla:

1. **Tablas y registros**: Contá los registros de cada tabla principal:
   ```sql
   SELECT 'productos' as tabla, count(*) as registros FROM productos
   UNION ALL SELECT 'variantes_producto', count(*) FROM variantes_producto
   UNION ALL SELECT 'clientes', count(*) FROM clientes
   UNION ALL SELECT 'direcciones_envio', count(*) FROM direcciones_envio
   UNION ALL SELECT 'ordenes', count(*) FROM ordenes
   UNION ALL SELECT 'items_orden', count(*) FROM items_orden
   UNION ALL SELECT 'webhook_logs', count(*) FROM webhook_logs
   ORDER BY tabla;
   ```

2. **Órdenes por estado**: Mostrá cuántas órdenes hay en cada estado:
   ```sql
   SELECT estado, count(*) as cantidad FROM ordenes GROUP BY estado ORDER BY cantidad DESC;
   ```

3. **Stock bajo** (variantes con menos de 3 unidades):
   ```sql
   SELECT p.nombre, vp.colorway, vp.talle, vp.stock
   FROM variantes_producto vp
   JOIN productos p ON p.id = vp.producto_id
   WHERE vp.stock < 3 AND p.activo = true
   ORDER BY vp.stock ASC, p.nombre
   LIMIT 15;
   ```

Mostrá todo en formato estructurado con headers claros.
