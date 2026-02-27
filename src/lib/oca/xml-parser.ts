import { XMLParser } from 'fast-xml-parser';
import { CotizacionResult, CrearEnvioResult, TrackingResult, Sucursal } from './types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

/**
 * Parsea la respuesta XML de Tarifar_Envio_Corporativo.
 */
export function parsearCotizacion(xml: string): CotizacionResult[] {
    const obj = parser.parse(xml);
    const tarifas = obj?.NewDataSet?.Table;

    if (!tarifas) return [];

    const arr = Array.isArray(tarifas) ? tarifas : [tarifas];

    return arr.map((t: Record<string, unknown>) => ({
        precio: parseFloat(String(t.Precio || t.precio || '0')),
        diasHabiles: parseInt(String(t.PlazoEntrega || t.plazoEntrega || '0')),
        tipoServicio: String(t.Descripcion || t.descripcion || ''),
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

    // Respuesta exitosa: <int ...>NUMERO</int>
    const match = trimmed.match(/<int[^>]*>(\d+)<\/int>/);
    if (match) {
        return { success: true, idOrdenRetiro: parseInt(match[1]) };
    }

    // Respuesta de error: texto con descripción
    return { success: false, error: trimmed.replace(/<[^>]+>/g, '') };
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
 * Devuelve solo las sucursales con servicio de entrega activo.
 */
export function parsearSucursales(xml: string): Sucursal[] {
    const parserNoAttr = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const obj = parserNoAttr.parse(xml);
    const centros = obj?.NewDataSet?.Table;

    if (!centros) return [];

    const arr = Array.isArray(centros) ? centros : [centros];

    return arr
        .filter((c: Record<string, unknown>) => c.Entrega === 'True' || c.Entrega === true)
        .map((c: Record<string, unknown>) => ({
            id: Number(c.Idci),
            nombre: String(c.Nombre || ''),
            calle: String(c.Calle || ''),
            nro: String(c.Numero || ''),
            localidad: String(c.Localidad || ''),
            provincia: String(c.Provincia || ''),
            cp: String(c.CodigoPostal || ''),
            horario: String(c.Horario || ''),
        }));
}
