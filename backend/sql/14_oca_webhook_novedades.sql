-- ============================================================================
-- ARCHIVO: 14_oca_webhook_novedades.sql
-- PROPÓSITO: Agregar soporte para webhook de novedades de OCA
-- ============================================================================
--
-- Esto habilita el tracking en vivo de envíos:
-- - Tabla eventos_envio_oca para historial de cambios de estado
-- - Columna estado_envio en ordenes para el estado actual
-- - Índices para búsquedas rápidas
--
-- CÓMO EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Click en "+ New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run"
--
-- ============================================================================

-- ============================================================================
-- TABLA: ordenes — agregar columna estado_envio
-- ============================================================================
-- Estado actual del envío según OCA:
-- - null: Aún no se ha creado envío
-- - en_preparacion: Estados 1-6
-- - disponible_retiro_sucursal: Estado 7
-- - en_camino: Estados 8-9
-- - entregado: Estado 10
-- - no_entregado: Estado 11
-- - en_devolucion: Estado 12
-- ============================================================================

ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS estado_envio TEXT;

COMMENT ON COLUMN ordenes.estado_envio IS 'Estado actual del envío según OCA: en_preparacion, disponible_retiro_sucursal, en_camino, entregado, no_entregado, en_devolucion';

-- ============================================================================
-- TABLA: eventos_envio_oca
-- ============================================================================
-- Historial completo de cambios de estado enviados por el webhook de OCA.
-- Cada evento representa una notificación de OCA.
-- ============================================================================

CREATE TABLE IF NOT EXISTS eventos_envio_oca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,

    -- Identificadores del envío (para debugging y logging)
    nro_envio_oca TEXT NOT NULL,
    nro_doc_cliente TEXT,

    -- Estado del envío según OCA
    id_estado INTEGER NOT NULL,  -- código de estado de OCA (1-12)
    estado TEXT,                 -- nombre del estado
    motivo TEXT,                 -- motivo del cambio (si aplica)

    -- Datos de localización
    sucursal_info JSONB,         -- { id, nombre, domicilio, codigo_postal, localidad, provincia }
    datos_receptor JSONB,        -- { nombre, apellido, domicilio } (si fue entregado)

    -- Timestamp del evento
    fecha_evento TIMESTAMPTZ,    -- fecha del evento según OCA

    -- Metadata
    raw_json JSONB,              -- Payload completo del webhook para auditoría
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Constraint: Evitar duplicados por idempotencia
    UNIQUE(nro_envio_oca, id_estado, fecha_evento)
);

COMMENT ON TABLE eventos_envio_oca IS 'Historial de cambios de estado del envío enviados por webhook de OCA';
COMMENT ON COLUMN eventos_envio_oca.id_estado IS 'Código de estado OCA: 1-12';
COMMENT ON COLUMN eventos_envio_oca.raw_json IS 'Payload completo del webhook para auditoría y debugging';

-- ============================================================================
-- Índices para búsquedas y joins
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_eventos_envio_oca_orden_id ON eventos_envio_oca(orden_id);
CREATE INDEX IF NOT EXISTS idx_eventos_envio_oca_nro_envio ON eventos_envio_oca(nro_envio_oca);
CREATE INDEX IF NOT EXISTS idx_eventos_envio_oca_fecha ON eventos_envio_oca(fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_envio_oca_estado ON eventos_envio_oca(id_estado);

-- ============================================================================
-- ¡LISTO!
-- ============================================================================
-- Siguiente paso: Ejecutar el endpoint POST en src/app/api/webhooks/oca/route.ts
-- ============================================================================
