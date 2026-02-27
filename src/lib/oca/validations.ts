/**
 * Validaciones pre-llamada a OCA.
 * Previene llamadas inválidas que generarían errores confusos en la API de OCA.
 */

import { DireccionDestino } from './types';

export interface ValidationError {
    campo: string;
    mensaje: string;
}

/**
 * Valida un código postal argentino (4 dígitos numéricos).
 */
export function validarCP(cp: string | number): ValidationError | null {
    const cpStr = String(cp).trim();
    if (!/^\d{4}$/.test(cpStr)) {
        return { campo: 'cpDestino', mensaje: 'El código postal debe ser de 4 dígitos numéricos' };
    }
    return null;
}

/**
 * Valida los datos mínimos de peso y volumen para cotización.
 */
export function validarCotizacion(pesoKg: number, volumenM3: number): ValidationError[] {
    const errores: ValidationError[] = [];

    if (!pesoKg || pesoKg <= 0) {
        errores.push({ campo: 'pesoKg', mensaje: 'El peso debe ser mayor a 0' });
    }
    if (pesoKg > 50) {
        errores.push({ campo: 'pesoKg', mensaje: 'El peso no puede superar 50 kg' });
    }
    if (!volumenM3 || volumenM3 <= 0) {
        errores.push({ campo: 'volumenM3', mensaje: 'El volumen debe ser mayor a 0' });
    }

    return errores;
}

/**
 * Valida la dirección del destinatario para crear envío.
 */
export function validarDireccion(dir: DireccionDestino): ValidationError[] {
    const errores: ValidationError[] = [];
    const requeridos: { campo: keyof DireccionDestino; label: string }[] = [
        { campo: 'apellido', label: 'Apellido' },
        { campo: 'nombre', label: 'Nombre' },
        { campo: 'calle', label: 'Calle' },
        { campo: 'nro', label: 'Número' },
        { campo: 'localidad', label: 'Localidad' },
        { campo: 'provincia', label: 'Provincia' },
        { campo: 'cp', label: 'Código postal' },
    ];

    for (const { campo, label } of requeridos) {
        if (!dir[campo] || String(dir[campo]).trim() === '') {
            errores.push({ campo, mensaje: `${label} es requerido` });
        }
    }

    // Validar CP
    if (dir.cp) {
        const cpError = validarCP(dir.cp);
        if (cpError) errores.push(cpError);
    }

    return errores;
}

/**
 * Valida todos los datos necesarios para crear un envío.
 */
export function validarCrearEnvio(data: {
    destinatario: DireccionDestino;
    operativa: number;
    nroRemito: string;
}): ValidationError[] {
    const errores: ValidationError[] = [];

    // Validar dirección
    errores.push(...validarDireccion(data.destinatario));

    // Validar operativa
    if (!data.operativa || data.operativa <= 0) {
        errores.push({ campo: 'operativa', mensaje: 'Operativa OCA no válida' });
    }

    // Validar remito
    if (!data.nroRemito || data.nroRemito.trim() === '') {
        errores.push({ campo: 'nroRemito', mensaje: 'Número de remito es requerido' });
    }

    return errores;
}
