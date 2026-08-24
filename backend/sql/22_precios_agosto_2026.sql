-- ─────────────────────────────────────────────────────────────────────────────
-- 22 — Actualización de precios (2026-08-22)
--
-- Lista de Naza. Los precios del front (`public/js/start.js`) se actualizaron en
-- el mismo commit: si estos dos lados divergen, `npm run verificar:catalogo`
-- falla y frena el CI.
--
-- ⚠️ Los precios van en CENTAVOS: $290.000 = 29000000.
--
-- NO cambian:
--   · Las 4 INTERVENCIONES (1/1) — se mantienen en $150.000 y $130.000.
--   · REMERA LOGO GÜIDO STRASS — ya estaba en $65.000.
--
-- Nota: bermudas y musculosas siguen en `RESTRICTED_CATEGORIES` del front, o sea
-- que se les actualiza el precio pero todavía no se pueden comprar (decisión de
-- Naza, 2026-08-22). El precio queda listo para cuando se habiliten.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- PANTALONES / JEANS: $240.000 → $290.000 (los 3)
UPDATE productos SET precio_centavos = 29000000, updated_at = now()
WHERE categoria = 'PANTALONES / JEANS' AND precio_centavos = 24000000;

-- BERMUDA DOUBLE KNEE: $175.000 → $210.000
UPDATE productos SET precio_centavos = 21000000, updated_at = now()
WHERE nombre = 'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE';

-- BERMUDA PATCHWORK: $160.000 → $190.000
UPDATE productos SET precio_centavos = 19000000, updated_at = now()
WHERE nombre = 'BERMUDA DE DENIM SELVEDGE PATCHWORK';

-- REMERA GÜIDO OVERSIZED: $50.000 → $60.000
UPDATE productos SET precio_centavos = 6000000, updated_at = now()
WHERE nombre = 'REMERA GÜIDO OVERSIZED';

-- REMERA AFLIGIDA BAGGED TEE ("boxy"): $55.000 → $65.000
UPDATE productos SET precio_centavos = 6500000, updated_at = now()
WHERE nombre = 'REMERA AFLIGIDA BAGGED TEE';

-- REMERA MANGA LARGA TERMAL: $70.000 → $80.000
UPDATE productos SET precio_centavos = 8000000, updated_at = now()
WHERE nombre = 'REMERA MANGA LARGA TERMAL';

-- REMERA BABY TEE REGISTRADA (mujer): $45.000 → $50.000
UPDATE productos SET precio_centavos = 5000000, updated_at = now()
WHERE nombre = 'REMERA BABY TEE REGISTRADA';

-- MUSCULOSA DOBLE SIMBOLO OVERSIZED: $45.000 → $55.000
UPDATE productos SET precio_centavos = 5500000, updated_at = now()
WHERE nombre = 'MUSCULOSA DOBLE SIMBOLO OVERSIZED';

COMMIT;

-- Control: los 15 productos con su precio nuevo.
-- SELECT nombre, categoria, precio_centavos / 100 AS pesos
-- FROM productos ORDER BY categoria, precio_centavos;
