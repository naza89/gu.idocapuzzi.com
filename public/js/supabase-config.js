// =============================================================================
// SUPABASE CLIENT - GÜIDO CAPUZZI
// =============================================================================
// Este archivo configura la conexión con Supabase.
//
// ¿QUÉ HACE?
// - Crea un cliente de Supabase que se usa desde el frontend
// - Usa la "anon key" (clave pública, segura para el navegador)
// - Todas las operaciones están restringidas por las políticas RLS
//
// ¿CÓMO SE USA?
// Desde cualquier otro archivo JS, accedés al cliente con:
//   window.supabaseClient
//
// Ejemplo:
//   const { data } = await window.supabaseClient.from('productos').select('*');
// =============================================================================

// Configuración del proyecto Supabase
const SUPABASE_URL = 'https://zwzzrqjmnrlkltuijjjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3enpycWptbnJsa2x0dWlqampmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDczMDcsImV4cCI6MjA4NjIyMzMwN30.t-53wFNuLCU--Bg8328u2KdnaehzHXDmUnW86YJRiDM';

// Crear el cliente de Supabase
// supabase es una variable global inyectada por el CDN de Supabase
const { createClient } = supabase;
window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('[Supabase] Cliente inicializado correctamente');

// =============================================================================
// FUNCIONES HELPER - STOCK
// =============================================================================

/**
 * Obtener stock disponible para un producto + colorway + talle específico.
 * 
 * CÓMO FUNCIONA:
 * Busca en la tabla variantes_producto filtrando por el producto_id
 * que corresponde al colorway y talle seleccionados.
 *
 * @param {string} nombreProducto - Nombre base del producto en Supabase
 * @param {string} colorway - El colorway (ej: "NEGRO LOGO BLANCO")  
 * @param {string} talle - El talle (ej: "M")
 * @returns {Promise<number>} Stock disponible, o -1 si no se pudo consultar
 */
async function obtenerStock(nombreProducto, colorway, talle) {
    try {
        // Primero buscamos el producto base por nombre
        const { data: productos, error: errProd } = await window.supabaseClient
            .from('productos')
            .select('id')
            .eq('nombre', nombreProducto)
            .limit(1);

        if (errProd || !productos || productos.length === 0) {
            console.warn('[Stock] Producto no encontrado:', nombreProducto);
            return -1;
        }

        const productoId = productos[0].id;

        // Luego buscamos la variante específica
        const { data: variantes, error: errVar } = await window.supabaseClient
            .from('variantes_producto')
            .select('stock')
            .eq('producto_id', productoId)
            .eq('colorway', colorway)
            .eq('talle', talle)
            .limit(1);

        if (errVar || !variantes || variantes.length === 0) {
            console.warn('[Stock] Variante no encontrada:', colorway, talle);
            return -1;
        }

        return variantes[0].stock;
    } catch (e) {
        console.error('[Stock] Error al consultar stock:', e);
        return -1;
    }
}

/**
 * Obtener todas las variantes (con stock) para un producto.
 * Útil para mostrar qué talles están disponibles en la PDP.
 *
 * @param {string} nombreProducto - Nombre base del producto
 * @param {string} colorway - El colorway 
 * @returns {Promise<Array>} Array de { talle, stock, sku }
 */
async function obtenerVariantesStock(nombreProducto, colorway) {
    try {
        const { data: productos } = await window.supabaseClient
            .from('productos')
            .select('id')
            .eq('nombre', nombreProducto)
            .limit(1);

        if (!productos || productos.length === 0) return [];

        const { data: variantes } = await window.supabaseClient
            .from('variantes_producto')
            .select('talle, stock, sku, one_of_one')
            .eq('producto_id', productos[0].id)
            .eq('colorway', colorway)
            .order('talle');

        return variantes || [];
    } catch (e) {
        console.error('[Stock] Error al consultar variantes:', e);
        return [];
    }
}

// Exponer funciones globalmente
window.obtenerStock = obtenerStock;
window.obtenerVariantesStock = obtenerVariantesStock;
