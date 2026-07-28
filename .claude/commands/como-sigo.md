Top 5 pasos priorizados para continuar el proyecto GÜIDO CAPUZZI.
Sin introducción, sin relleno — solo los pasos y el razonamiento.

---

## Archivos a leer

1. **Plan Activo** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`) — tareas desbloqueadas, bloqueadas, y el grafo de dependencias al final
2. **Handoff Notes** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Handoff Notes.md`) — próximo paso inmediato y bloqueadores
3. **Bitácora** (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora.md`) — última entry

---

## Lógica de priorización (aplicar en silencio)

1. **Desbloqueo:** priorizar tareas que abren el mayor árbol de dependencias. Revisá el grafo al final del Plan Activo.
2. **ROI de desbloqueo:** la tarea que desbloquea más cosas va primero, incluso si parece chica (ej: un test e2e puede desbloquear Bot Telegram + validación de cronograma).
3. **Momentum:** si la sesión anterior dejó algo a medias con contexto cargado, continuarlo tiene costo bajo.
4. **Independientes:** tareas de marketing/Meta son independientes del código — separarlas visualmente.
5. **Bloqueados reales:** si algo lleva 3+ sessions en "pendiente" sin avance, no es prioridad — es fricción. Señalarlo.

---

## Formato de salida

```
## ¿Por dónde sigo?

**1. [Nombre de la tarea]**
→ Por qué ahora: [una línea]
→ Qué desbloquea: [una línea]

**2. [Nombre de la tarea]**
→ Por qué ahora: [una línea]
→ Qué desbloquea: [una línea]

**3. [Nombre de la tarea]**
→ Por qué ahora: [una línea]
→ Qué desbloquea: [una línea]

**4. [Nombre de la tarea]**
→ Por qué ahora: [una línea]
→ Qué desbloquea: [una línea]

**5. [Nombre de la tarea]**
→ Por qué ahora: [una línea]
→ Qué desbloquea: [una línea]

---
**Máximo ROI ahora:** [la 1 tarea que si la resolvés esta semana tiene el mayor impacto en cadena]

**Bloqueado hasta:** [lista de lo que NO se puede hacer ahora y por qué — máximo 3 líneas]

**Fricción detectada:** [si hay tareas estancadas 3+ sesiones, nombrarlas — ¿descartar o desbloquear?]
```
