---
description: Crea el próximo archivo de migración SQL en backend/sql/ con número correlativo
---

Encontrá el número más alto actualmente en `backend/sql/` (archivos con formato `NN_nombre.sql`).
Creá el siguiente archivo con número `NN+1` y el nombre que te pasé.

## Template obligatorio

```sql
-- Migración NN_[nombre].sql
-- Descripción: [qué hace esta migración]
-- Fecha: [hoy YYYY-MM-DD]
-- Proyecto Supabase: zwzzrqjmnrlkltuijjjf
-- EJECUTAR EN: Supabase SQL Editor (no se ejecuta automáticamente)
-- ROLLBACK: [cómo revertirla si hace falta]

-- ============================================================

[SQL acá]
```

## Reglas

- Precios siempre en `integer` (centavos), nunca `decimal` ni `float`
- UUIDs para todos los IDs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`
- RLS: si creás una tabla nueva, agregar `ALTER TABLE nombre ENABLE ROW LEVEL SECURITY;` y al menos una policy
- No tocar migraciones ya ejecutadas — solo agregar nuevas

## Después de crear

Mostrá la ruta completa del archivo creado y recordá:
> ⚠️ Esta migración hay que ejecutarla manualmente en el SQL Editor de Supabase antes de usarla en código.
