Sincronización completa del proyecto. Actualizá todos los registros con el resumen de lo que se hizo en esta sesión.

---

## 1. Handoff Notes (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Handoff Notes.md`)

Agregá una nueva entry al TOPE del archivo (debajo del header de política, antes de las sesiones existentes) con este formato:

```markdown
## [FECHA] — [Título de 4-6 palabras que describe lo principal]

**Estado:** [una línea: qué quedó, si hay algo deployado, si hay algo roto]
**Próximo paso inmediato:** [la única cosa más importante para hacer mañana]
**Bloqueado por:** [qué impide avanzar, o "nada" si está libre]
**Tocado:** [archivos/funciones clave, sin listar todo — solo lo que la próxima sesión necesita saber]

<details><summary>Detalle técnico</summary>

### Qué se hizo
[bullets con lo técnico: qué se implementó, qué se debuggeó, qué se decidió]

### Pendientes
- **Inmediato** (próxima sesión): [lista]
- **Esta semana**: [lista]
- **Diferido**: [lista — no perder pero no urgente]

### Contexto clave
[Solo lo que NO está en el código ni en el vault. Decisiones de diseño, workarounds, cosas que sorprenderían a alguien leyendo el código frío.]

### Archivos modificados
[lista de paths relevantes]

</details>
```

**Política de rotación** (aplicar si Handoff Notes supera ~250 líneas):
- Mover la sesión más vieja al archivo `Ejecución/Handoff Archive/YYYY-MM.md` del mes correspondiente
- Crear el archivo si no existe, con header: `# Handoff Archive — [Mes YYYY]\n\n> Sesiones archivadas desde Handoff Notes.\n\n---`

---

## 2. Plan Activo (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Ejecución\Plan Activo.md`)

- Marcá `[x]` las tareas completadas en esta sesión
- Si se desbloquearon nuevas tareas, movalas a "Desbloqueadas"
- Agregá tareas nuevas que hayan surgido
- Actualizá la fecha de "Última actualización" al tope

---

## 3. Bitácora del vault (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora.md`)

Agregá una entry con este formato:
```
## YYYY-MM-DD

### [Título descriptivo]
- **Problema encontrado:** ...
- **Solución adoptada:** ...
- **Archivo modificado:** ...
- **Pendiente:** ...
```
Usá wikilinks (`[[Supabase]]`, `[[OCA Integración]]`, etc.) para conceptos clave.

**Política de rotación de la Bitácora** (aplicar si `Bitácora.md` supera ~600 líneas):
- Mantené en `Bitácora.md` el **mes actual + el mes anterior**.
- Mové los meses más viejos a `Bitácora Archive/YYYY-MM.md` (creá la carpeta/archivo si no existe) con header:
  `# Bitácora Archive — YYYY-MM (GÜIDO)` + `> Entradas archivadas desde Bitácora.md.` + `---`.

---

## 4. Bitácora del repo (`docs/BITACORA.md`)

Copiá las mismas entries del vault pero sin wikilinks.

---

## 5. Memoria (`C:\Users\LAUTA\ObsidianVaults\GÜIDO\Memoria.md`)

Agregá una entry nueva:
```
## YYYY-MM-DD
[Resumen conversacional en primera persona, como si escribiera Naza]
[Qué se discutió, por qué se tomaron ciertas decisiones, qué se aprendió]

### Decisiones
- [decisión] — [razón]

### Preguntas y respuestas
- [pregunta] → [respuesta]

### Insights
- [algo no obvio que surgió]
```

---

## 6. Extras (de cerrar-dia, integrados)

**Action items sueltos:** Revisá si hay tareas mencionadas en la conversación o en notas modificadas hoy que no estén en Plan Activo. Si encontrás, agregalas.

**Wikilinks faltantes:** Si en la sesión se tocó un dominio técnico (OCA, NAVE, Meta, Supabase) y en las notas modificadas no hay wikilink a la nota correspondiente, sugerí agregarlo.

**Preview de mañana:** Al final del resumen de cierre, sugerí las 3 prioridades para la próxima sesión basándote en el Plan Activo actualizado.

---

## 7. Resumen de cierre

Mostrá esto al terminar:

```
## Sincronización completada — [fecha]

### Lo que se registró
[lista de lo hecho en esta sesión]

### Pendiente para la próxima
- Inmediato: [lista]
- Esta semana: [lista]

### Prioridades para mañana
1. [primera]
2. [segunda]
3. [tercera]

### Rotación de Handoff
[Si se rotó: "Sesión de [fecha] movida a Handoff Archive/YYYY-MM.md" — si no: "Sin rotación necesaria (X líneas)"]
```
