Inicio de sesión. Leé los siguientes archivos y mostrá un resumen de dónde quedamos:

1. **Handoff Notes** del vault Obsidian:
   - Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Handoff Notes.md`
   - Mostrá qué se hizo en la última sesión, qué quedó pendiente, y el contexto importante

2. **Plan Activo** del vault:
   - Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`
   - Mostrá las tareas desbloqueadas (las que se pueden hacer ahora)
   - Mostrá las bloqueadas y por qué están bloqueadas

3. **Bitácora** del vault:
   - Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora\Página Web.md`
   - Mostrá las últimas 3-5 entradas

4. **Git log**:
   - Ejecutá `git log --oneline -10`
   - Mostrá los últimos commits

Formato de salida:

```
## Retomando sesión

### Última sesión
[Resumen de Handoff Notes]

### Tareas desbloqueadas
[Lista de tareas que se pueden hacer ahora]

### Últimos cambios
[Git log + bitácora reciente]

### Recomendación
[Sugerencia de por dónde arrancar]
```
