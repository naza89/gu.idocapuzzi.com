/**
 * Calcula peso y volumen del paquete para un pedido.
 * 
 * Dimensiones por defecto para una prenda de GÜIDO doblada.
 * Actualizar cuando se tengan medidas reales por producto
 * (columnas peso_kg, alto_cm, ancho_cm, largo_cm en variantes_producto).
 */

// Dimensiones por defecto para una remera/prenda doblada
const DIMENSIONES_REMERA = {
    alto: 3,   // cm
    ancho: 25,  // cm
    largo: 30,  // cm
    peso: 0.3, // kg
};

// Margen de embalaje
const EMBALAJE = {
    alto: 5,
    ancho: 5,
    largo: 5,
    peso: 0.1,
};

export interface ItemCarrito {
    cantidad: number;
    peso?: number; // kg, si está definido en Supabase
    alto?: number;
    ancho?: number;
    largo?: number;
}

/**
 * Calcula las dimensiones y peso del paquete para un pedido.
 * GÜIDO envía un paquete por pedido.
 */
export function calcularPaquete(items: ItemCarrito[]) {
    let pesoTotal = EMBALAJE.peso;

    for (const item of items) {
        const pesoUnitario = item.peso ?? DIMENSIONES_REMERA.peso;
        pesoTotal += pesoUnitario * item.cantidad;
    }

    // Caja estimada para todas las prendas juntas
    const totalPrendas = items.reduce((acc, i) => acc + i.cantidad, 0);
    const alto = DIMENSIONES_REMERA.alto * totalPrendas + EMBALAJE.alto;
    const ancho = DIMENSIONES_REMERA.ancho + EMBALAJE.ancho;
    const largo = DIMENSIONES_REMERA.largo + EMBALAJE.largo;

    // Volumen en m³
    const volumenM3 = (alto / 100) * (ancho / 100) * (largo / 100);

    return {
        paquete: { alto, ancho, largo, peso: pesoTotal, valor: 0 } as const,
        pesoTotal,
        volumenM3,
        cantidadPaquetes: 1,
    };
}
