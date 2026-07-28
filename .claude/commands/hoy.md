Revisión matutina. Generá un plan priorizado para el día.

---

## Archivos a leer

1. **Plan Activo** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`) — tareas desbloqueadas
2. **Handoff Notes** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Handoff Notes.md`) — estado y próximo paso inmediato
3. **Bitácora** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora.md`) — últimas 2 entries
4. **Ideas** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ideas.md`) — ideas recientes sin explorar
5. **Diario** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Diario\Notas.md`) — última entry de Naza (solo leer, no modificar)
6. **Git log** — `git log --oneline -5`

---

## Lógica especial (aplicar en silencio)

**Si es lunes o primer sesión de la semana:**
→ Ejecutar query Supabase (si MCP disponible) y agregar bloque "Negocio" al output:
```sql
SELECT COUNT(*) as productos_activos FROM productos WHERE activo = true;
SELECT SUM(stock) as stock_total FROM variantes_producto;
SELECT estado, COUNT(*) as cantidad FROM ordenes GROUP BY estado ORDER BY cantidad DESC;
SELECT p.nombre, vp.colorway, vp.talle, vp.stock
FROM variantes_producto vp JOIN productos p ON p.id = vp.producto_id
WHERE vp.stock < 5 AND p.activo = true ORDER BY vp.stock ASC LIMIT 10;
```

**Detectar tareas estancadas:**
→ Si el mismo bullet `[ ]` aparece en las últimas 3+ entries de Handoff Notes sin avance, marcarlo como "⚠️ estancada — ¿descartar o desbloquear?"

**Priorización automática:**
→ Tareas que desbloquean otras van primero
→ Tareas con "e2e", "test", "producción" tienen prioridad alta si el código ya está deployado
→ Tareas de marketing/Instagram son independientes del código — separarlas

---

## Formato de salida

```
## Buenos días

### Estado del proyecto
[2-3 líneas: qué funciona hoy, qué está pendiente de validar, qué está bloqueado]

### Prioridades para hoy
1. [Tarea más importante — por qué es la #1]
2. [Segunda — qué desbloquea]
3. [Tercera]

[Si hay más desbloqueadas relevantes, agregar 4 y 5]

### Tareas estancadas ⚠️
[Si hay bullets que llevan 3+ sesiones sin moverse — solo si aplica]

### Ideas sin explorar
[Si hay algo fresco en Ideas.md que valga la pena mencionar]

### Nota de Naza
[Si hay algo en Diario relevante para hoy — omitir si no hay]

### Negocio (lunes / primer sesión de semana)
[Solo si aplica — productos activos, stock, órdenes por estado, stock bajo]
```
