import { createHash, timingSafeEqual } from 'crypto';

/**
 * Comparación de strings en tiempo constante.
 *
 * Hashea ambos lados con sha256 antes de comparar: así los buffers siempre
 * tienen la misma longitud (32 bytes) y `timingSafeEqual` no tira RangeError
 * cuando los valores difieren en tamaño, sin filtrar la longitud del secreto.
 *
 * @returns true si `a` y `b` son iguales. false si alguno es null/undefined.
 */
export function safeEqualStr(a: string | null | undefined, b: string | null | undefined): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
}
