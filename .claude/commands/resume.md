Inicio de sesión. Cargá el contexto completo y mostrá dónde quedamos.

---

## 1. Handoff Notes
Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Handoff Notes.md`
→ Mostrá: estado actual, próximo paso inmediato, bloqueadores.
→ Si hay `<details>`, revisalos solo si el próximo paso lo requiere — no los volquees enteros.

## 2. Plan Activo
Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`
→ Mostrá las tareas desbloqueadas (las que se pueden hacer ahora)
→ Mostrá top 3 bloqueadas con su motivo en una línea cada una

## 3. Última entry de Memoria
Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Memoria.md` — solo la última entry (`## YYYY-MM-DD` más reciente)
→ Mostrá decisiones y contexto conversacional relevante que no está en el código

## 4. Bitácora (últimas 3 entries)
Leé `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora.md` — solo las últimas 3 entries
→ Mostrá qué se cambió recientemente

## 5. Git log + estado del repo
```bash
git log --oneline -8
git status --short
```
→ Si hay archivos sin commitear, mencionarlos

## 6. Estado del deploy (Vercel MCP)
Usá `list_deployments` para el proyecto GÜIDO — mostrá el último:
- Estado (ready / error / building)
- Branch y commit desplegado
- Si hay error, mencionarlo explícitamente

## 7. Alertas automáticas (ejecutar si MCP Supabase disponible)
```sql
SELECT id, numero_orden, created_at, estado
FROM ordenes
WHERE estado = 'pago_pendiente'
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at ASC
LIMIT 5;
```
→ Si hay resultados: "⚠️ Hay órdenes en pago_pendiente desde hace más de 24h"
→ Si no hay resultados o MCP no disponible: omitir esta sección

---

## Formato de salida

```
## Retomando sesión — [fecha]

### Estado actual
[2-3 líneas: qué funciona, qué está en progreso, qué está roto]

### Próximo paso inmediato
[La única cosa más importante — de Handoff Notes]

### Tareas desbloqueadas
[Lista de lo que se puede hacer ahora]

### Repo
- Branch: X | Estado: clean / X archivos modificados
- Último commit: [hash] [mensaje]
- Deploy: ✅ ready / ❌ error — [detalles si hay error]

### Contexto conversacional (de Memoria)
[Decisiones recientes relevantes, en 3-5 líneas]

### ⚠️ Alertas
[Órdenes estancadas u otros problemas detectados — omitir si no hay nada]

### Recomendación
[Una sugerencia concreta de por dónde arrancar esta sesión]
```
