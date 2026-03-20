Escaneo topológico completo del vault de Obsidian. Analizá la estructura, conexiones y salud general.

1. Listá todos los archivos `.md` en `C:\Users\LAUTA\ObsidianVaults\GÜIDO\`
2. Para cada archivo, extraé los `[[wikilinks]]` que contiene
3. Generá un análisis:

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
