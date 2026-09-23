Escaneo topológico completo del vault de Obsidian. Analizá la estructura, conexiones y salud general.

Corré `node scripts/mapa-vault.mjs`: devuelve en JSON las estadísticas, huérfanas, hubs, callejones sin salida y links rotos del vault `C:\Users\LAUTA\ObsidianVaults\GÜIDO\`. Esos números van tal cual al informe; tu parte es leer las notas que haga falta para detectar clusters y escribir las recomendaciones.

```
## Mapa del Vault — GÜIDO CAPUZZI

### Estadísticas generales
- Total de notas: X
- Total de links: X
- Densidad promedio: X links/nota

### Clusters (grupos de notas muy conectadas)
[Listar clusters detectados]

### Notas huérfanas (sin links entrantes)
[Notas que nadie referencia — posibles candidatas a conectar o eliminar]

### Notas hub (más referenciadas)
[Top 5 notas con más backlinks]

### Callejones sin salida (notas que no linkan a nada)
[Notas sin wikilinks salientes]

### Links rotos
[Wikilinks que apuntan a notas inexistentes]

### Recomendaciones
[Sugerencias para mejorar la estructura: notas a conectar, clusters a reforzar, etc.]
```
