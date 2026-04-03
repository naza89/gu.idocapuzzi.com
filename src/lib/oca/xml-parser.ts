import { XMLParser } from 'fast-xml-parser';
import { CotizacionResult, CrearEnvioResult, TrackingResult, Sucursal } from './types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/**
 * Parsea la respuesta XML de Tarifar_Envio_Corporativo.
 */
export function parsearCotizacion(xml: string): CotizacionResult[] {
    const obj = parser.parse(xml);

    // OCA wraps data in DataSet > diffgr:diffgram > NewDataSet > Table
    const tarifas =
        obj?.DataSet?.['diffgr:diffgram']?.NewDataSet?.Table
        ?? obj?.NewDataSet?.Table;

    if (!tarifas) return [];

    const arr = Array.isArray(tarifas) ? tarifas : [tarifas];

    return arr.map((t: Record<string, unknown>) => ({
        // Total includes Precio + Adicional (seguro, etc.)
        precio: parseFloat(String(t.Total || t.Precio || t.precio || '0')),
        diasHabiles: parseInt(String(t.PlazoEntrega || t.plazoEntrega || '0')),
        tipoServicio: String(t.Ambito || t.Descripcion || t.descripcion || ''),
        operativa: parseInt(String(t.Operativa || t.operativa || '0')),
    }));
}

/**
 * Parsea la respuesta de IngresoORMultiplesRetiros.
 * Respuesta exitosa: devuelve el ID de la orden como número dentro de XML.
 * Respuesta de error: texto con descripción.
 */
export function parsearCrearEnvio(xml: string): CrearEnvioResult {
    const trimmed = xml.trim();

    // Format 1: Simple <int ...>NUMERO</int>
    const match = trimmed.match(/<int[^>]*>(\d+)<\/int>/);
    if (match) {
        return { success: true, idOrdenRetiro: parseInt(match[1]) };
    }

    // Format 2: DataSet > diffgr:diffgram > NewDataSet > Table (actual OCA response)
    try {
        const obj = parser.parse(trimmed);
        const table =
            obj?.DataSet?.['diffgr:diffgram']?.NewDataSet?.Table
            ?? obj?.NewDataSet?.Table;

        if (table) {
            const row = Array.isArray(table) ? table[0] : table;
            const id = row.IdOrdenRetiro ?? row.idOrdenRetiro ?? row.OrdenRetiro;
            if (id) {
                return { success: true, idOrdenRetiro: parseInt(String(id)) };
            }
        }
    } catch {
        // Fall through to error
    }

    // Format 3: Regex fallback — find first large number (likely IdOrdenRetiro)
    const numMatch = trimmed.match(/>(\d{6,})</);
    if (numMatch) {
        return { success: true, idOrdenRetiro: parseInt(numMatch[1]) };
    }

    // Respuesta de error: texto con descripción
    return { success: false, error: trimmed.replace(/<[^>]+>/g, '').trim() };
}

/**
 * Parsea la respuesta de Tracking_Pieza.
 */
export function parsearTracking(xml: string): TrackingResult | null {
    const obj = parser.parse(xml);
    const data = obj?.NewDataSet?.Table;

    if (!data) return null;

    const arr = Array.isArray(data) ? data : [data];

    return {
        nroEnvio: String(arr[0]?.NumeroEnvio || ''),
        estadoActual: String(arr[arr.length - 1]?.Estado || ''),
        eventos: arr.map((e: Record<string, unknown>) => ({
            fecha: String(e.Fecha || ''),
            estado: String(e.Estado || ''),
            sucursal: String(e.Sucursal || ''),
            descripcion: String(e.Descripcion || ''),
        })),
    };
}

/**
 * Parsea la respuesta de GetCentrosImposicionConServiciosByCP.
 * Devuelve solo las sucursales con servicio de entrega activo (IdTipoServicio = 2).
 *
 * Estructura real del XML:
 *   <CentrosDeImposicion>
 *     <Centro>
 *       <IdCentroImposicion>21</IdCentroImposicion>
 *       <Sucursal>SUCURSAL OCA: SAN JUSTO</Sucursal>
 *       <Servicios>
 *         <Servicio><IdTipoServicio>2</IdTipoServicio>...</Servicio>  ← entrega
 *       </Servicios>
 *     </Centro>
 *   </CentrosDeImposicion>
 */
export function parsearSucursales(xml: string): Sucursal[] {
    const p = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const obj = p.parse(xml);
    const centros = obj?.CentrosDeImposicion?.Centro;

    if (!centros) return [];

    const arr = Array.isArray(centros) ? centros : [centros];

    return arr
        .filter((c: Record<string, unknown>) => {
            // Verificar que tenga servicio de Entrega (IdTipoServicio = 2)
            const servicios = (c.Servicios as Record<string, unknown>)?.Servicio;
            if (!servicios) return false;
            const serviciosArr = Array.isArray(servicios) ? servicios : [servicios];
            return serviciosArr.some((s: Record<string, unknown>) => Number(s.IdTipoServicio) === 2);
        })
        .map((c: Record<string, unknown>) => ({
            id: Number(c.IdCentroImposicion),
            nombre: String(c.Sucursal || '').trim(),
            calle: String(c.Calle || '').trim(),
            nro: String(c.Numero || '').trim(),
            localidad: String(c.Localidad || '').trim(),
            provincia: String(c.Provincia || '').trim(),
            cp: String(c.CodigoPostal || '').trim(),
            horario: String(c.HorarioAtencion || '').trim(),
        }));
}
