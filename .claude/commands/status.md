Ejecutá los siguientes pasos y mostrá un resumen de estado del proyecto:

1. **Git status**: Ejecutá `git status` y `git log --oneline -5` para mostrar el branch actual, archivos modificados/sin trackear, y los últimos 5 commits.

2. **Dev server**: Verificá si el dev server está corriendo ejecutando `curl -s http://localhost:3000/api/health 2>/dev/null || echo "Dev server NO está corriendo"`.

3. **Último error conocido**: Buscá en los archivos recientes o en la terminal si hay errores reportados. Si no hay info, indicá "Sin errores recientes reportados".

4. **Siguiente tarea prioritaria**: Leé el archivo `docs/GAPS_AND_TODOS.md` y mostrá la primera tarea de Prioridad ALTA que no esté completada.

Mostrá todo en formato estructurado con headers claros.
