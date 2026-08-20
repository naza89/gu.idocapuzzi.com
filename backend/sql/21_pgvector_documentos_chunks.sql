-- ============================================================================
-- ARCHIVO: 21_pgvector_documentos_chunks.sql
-- PROPÓSITO: Infraestructura vectorial para el asistente de compra (FASE 2 RAG).
-- ============================================================================
--
-- CONTEXTO:
-- Primera piedra del asistente de compra con RAG sobre el catálogo. Esta
-- migración crea ÚNICAMENTE la tabla y sus índices. No la lee ni la escribe
-- nadie todavía: no hay ingest, no hay endpoint y no hay widget.
--
-- ⚠️ IMPACTO EN LA TIENDA: NINGUNO. Tabla nueva, aislada, con RLS cerrada. No
-- toca `productos`, `variantes_producto`, `ordenes` ni el camino de compra. Se
-- puede correr antes o después del go-live sin consecuencias — se escribió
-- ahora justamente porque es lo único de la FASE 2 que no arriesga nada.
--
-- ⚠️ LO QUE ESTA TABLA **NO** GUARDA: precios ni stock.
-- Ese es el guardrail central del asistente. El precio y el stock salen SIEMPRE
-- de una consulta determinista contra `productos.precio_centavos` y
-- `variantes_producto.stock` — nunca del texto recuperado, que queda viejo en
-- cuanto se cambia un precio. Acá van descripciones, calces y políticas.
--
-- DECISIÓN ABIERTA — DIMENSIÓN DEL EMBEDDING:
-- Está en 1536, que es lo que devuelven `text-embedding-3-small` de OpenAI y
-- `embed-multilingual-v3.0` de Cohere. Si se elige Voyage (`voyage-3` = 1024) o
-- `text-embedding-3-large` (3072), hay que cambiar el número ANTES de correr
-- esto: `vector(n)` es parte del tipo de la columna y cambiarlo después obliga a
-- reembeber todo. Con 24 productos reembeber es barato, pero mejor no hacerlo.
--
-- CÓMO EJECUTAR:
-- 1. Supabase Dashboard > SQL Editor > New query
-- 2. Pegar este archivo y Run
-- 3. Verificar con el bloque de comprobación del final
-- ============================================================================

-- ── 1. Extensión ─────────────────────────────────────────────────────────────
-- Supabase la trae disponible; se instala en el schema `extensions` para no
-- ensuciar `public` (es la convención que recomienda Supabase).
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


-- ── 2. Tabla de chunks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contenido
    contenido       TEXT NOT NULL,
    embedding       extensions.vector(1536),

    -- Metadata: es lo que hace que el asistente pueda CITAR. Sin esto es un
    -- chatbot más. Cada chunk sabe de dónde salió y a qué URL pública linkear.
    fuente          VARCHAR(100) NOT NULL,  -- 'catalogo' | 'politica' | 'talles'
    documento       VARCHAR(255) NOT NULL,  -- 'terminos-y-condiciones', 'remera-guido-negro', ...
    seccion         VARCHAR(255),           -- heading del que salió el chunk
    url_publica     TEXT,                   -- '/shop/remera-guido-negro' — el link de la citation
    sku             VARCHAR(50),            -- si el chunk habla de un producto puntual
    orden_chunk     INTEGER NOT NULL DEFAULT 0,

    -- Trazabilidad del ingest: permite reingestar sólo lo que cambió y borrar
    -- lo viejo de un documento sin tocar el resto.
    hash_contenido  VARCHAR(64) NOT NULL,
    modelo_embedding VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE (documento, orden_chunk)
);

COMMENT ON TABLE documentos_chunks IS
    'Corpus vectorial del asistente de compra (FASE 2 RAG). NO guarda precios ni stock: esos salen de una consulta determinista contra productos/variantes_producto.';
COMMENT ON COLUMN documentos_chunks.url_publica IS
    'URL a la que linkea la citation de la respuesta. Sin esto no hay citations.';
COMMENT ON COLUMN documentos_chunks.hash_contenido IS
    'sha256 del contenido del chunk. Permite reingestar sólo lo que cambió.';


-- ── 3. Índices ───────────────────────────────────────────────────────────────
-- HNSW con distancia coseno, que es lo que corresponde para embeddings
-- normalizados (OpenAI, Cohere y Voyage los devuelven normalizados).
--
-- m=16 / ef_construction=64 son los defaults de pgvector y están bien de sobra
-- para un corpus de este tamaño (decenas de documentos, cientos de chunks).
-- Subirlos sólo tiene sentido con órdenes de magnitud más de datos.
CREATE INDEX IF NOT EXISTS documentos_chunks_embedding_idx
    ON documentos_chunks
    USING hnsw (embedding extensions.vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Filtros del ingest y de las consultas acotadas ('sólo políticas', 'sólo este SKU').
CREATE INDEX IF NOT EXISTS documentos_chunks_documento_idx ON documentos_chunks (documento);
CREATE INDEX IF NOT EXISTS documentos_chunks_fuente_idx    ON documentos_chunks (fuente);
CREATE INDEX IF NOT EXISTS documentos_chunks_sku_idx       ON documentos_chunks (sku) WHERE sku IS NOT NULL;


-- ── 4. RLS: cerrada ──────────────────────────────────────────────────────────
-- Coherente con la migración 17. El asistente NO consulta desde el navegador:
-- todo pasa por una route handler con service_role (que bypassea el RLS), igual
-- que `crear-orden`. Habilitar RLS sin crear ninguna política deja la tabla
-- invisible para anon y authenticated, que es exactamente lo que queremos.
--
-- Es una ventaja de diseño, no un obstáculo: obliga a que toda la superficie del
-- asistente sea un solo endpoint auditable, con rate limiting en un solo lugar.
ALTER TABLE documentos_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de chunks" ON documentos_chunks;


-- ── 5. RPC de búsqueda ───────────────────────────────────────────────────────
-- La llama el endpoint del asistente con service_role. Devuelve los top-k por
-- similitud coseno, con la metadata necesaria para armar la citation.
--
-- SECURITY INVOKER (el default) a propósito: NO queremos que esta función sea un
-- agujero que saltee el RLS para quien la llame. Con service_role no hace falta.
CREATE OR REPLACE FUNCTION match_documentos(
    query_embedding extensions.vector(1536),
    match_count     INTEGER DEFAULT 5,
    filtro_fuente   VARCHAR DEFAULT NULL,
    umbral_similitud FLOAT   DEFAULT 0.0
)
RETURNS TABLE (
    id          UUID,
    contenido   TEXT,
    fuente      VARCHAR,
    documento   VARCHAR,
    seccion     VARCHAR,
    url_publica TEXT,
    sku         VARCHAR,
    similitud   FLOAT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id,
        c.contenido,
        c.fuente,
        c.documento,
        c.seccion,
        c.url_publica,
        c.sku,
        1 - (c.embedding OPERATOR(extensions.<=>) query_embedding) AS similitud
    FROM documentos_chunks c
    WHERE c.embedding IS NOT NULL
      AND (filtro_fuente IS NULL OR c.fuente = filtro_fuente)
      AND 1 - (c.embedding OPERATOR(extensions.<=>) query_embedding) >= umbral_similitud
    ORDER BY c.embedding OPERATOR(extensions.<=>) query_embedding
    LIMIT match_count;
$$;

COMMENT ON FUNCTION match_documentos IS
    'Top-k por similitud coseno sobre documentos_chunks. La llama /api/asistente con service_role.';

-- Nadie más que el servidor la puede ejecutar.
REVOKE ALL ON FUNCTION match_documentos FROM PUBLIC, anon, authenticated;


-- ── 6. Trigger de updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION documentos_chunks_touch()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documentos_chunks_updated_at ON documentos_chunks;
CREATE TRIGGER documentos_chunks_updated_at
    BEFORE UPDATE ON documentos_chunks
    FOR EACH ROW EXECUTE FUNCTION documentos_chunks_touch();


-- ============================================================================
-- VERIFICACIÓN — correr después y confirmar que devuelve lo esperado
-- ============================================================================
-- SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
--   → una fila
--
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'documentos_chunks';
--   → relrowsecurity = true
--
-- SELECT count(*) FROM pg_policies WHERE tablename = 'documentos_chunks';
--   → 0  (cerrada: sólo service_role entra)
--
-- SELECT indexname FROM pg_indexes WHERE tablename = 'documentos_chunks';
--   → el pkey, el UNIQUE, el hnsw y los tres btree
-- ============================================================================
