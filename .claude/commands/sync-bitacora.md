Sincronizá la Bitácora entre el repo y el vault Obsidian.

1. Leé ambos archivos:
   - Repo: `docs/BITACORA.md`
   - Vault: `C:\Users\LAUTA\ObsidianVaults\GÜIDO\Bitácora\Página Web.md`

2. Compará las entradas por fecha (`## YYYY-MM-DD`):
   - Si hay entradas en el repo que no están en el vault → copialas al vault (agregando wikilinks a conceptos como NAVE, OCA, Supabase, Inventario)
   - Si hay entradas en el vault que no están en el repo → copialas al repo (removiendo wikilinks)

3. Mostrá un diff de lo que se sincronizó:

```
## Sincronización de Bitácora

### Repo → Vault
[Entradas copiadas, o "Ya sincronizado"]

### Vault → Repo
[Entradas copiadas, o "Ya sincronizado"]
```

4. Confirma antes de escribir los cambios.
