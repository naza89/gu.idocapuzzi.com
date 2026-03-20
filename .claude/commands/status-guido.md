Dashboard del negocio. Leé los siguientes archivos y mostrá un resumen ejecutivo:

1. **Index del vault**: Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\_Index.md`

2. **Datos de Supabase** (si MCP disponible):
   - Ejecutá: `SELECT COUNT(*) as total_productos FROM productos WHERE activo = true`
   - Ejecutá: `SELECT SUM(stock) as stock_total FROM variantes_producto`
   - Ejecutá: `SELECT estado, COUNT(*) as cantidad FROM ordenes GROUP BY estado`
   - Si MCP no está disponible, leé el snapshot de `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Operaciones\Inventario.md`

3. **Plan Activo**: Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`
   - Contá tareas completadas vs pendientes

4. **Git status**: `git log --oneline -5` y `git status`

Formato de salida:

```
## GÜIDO CAPUZZI — Dashboard

### Catálogo
- Productos activos: X
- Variantes: X
- Stock total: X unidades

### Órdenes
[Tabla por estado o "Sin órdenes aún"]

### Progreso del proyecto
- Tareas completadas: X/Y
- Próxima tarea: [primera desbloqueada]

### Repo
- Branch: X
- Último commit: X
- Estado: [clean/dirty]
```
