export interface CotizacionInput {
    cpDestino: number;
    pesoKg: number;
    volumenM3: number;
    cantidadPaquetes: number;
    valorDeclarado: number;
    operativa: number;
}

export interface CotizacionResult {
    precio: number;
    diasHabiles: number;
    tipoServicio: string;
    operativa: number;
}

export interface DireccionDestino {
    apellido: string;
    nombre: string;
    calle: string;
    nro: string;
    piso?: string;
    depto?: string;
    localidad: string;
    provincia: string;
    cp: string;
    telefono?: string;
    celular?: string;
    email?: string;
    idci?: number;          // Solo para entrega en sucursal
    observaciones?: string;
}

export interface PaqueteInput {
    alto: number;    // cm
    ancho: number;   // cm
    largo: number;   // cm
    peso: number;    // kg
    valor: number;   // valor declarado (seguro activo → valor del pedido)
}

export interface CrearEnvioInput {
    destinatario: DireccionDestino;
    paquetes: PaqueteInput[];
    operativa: number;
    nroRemito: string;        // número de orden de GÜIDO
    centroCosto?: number;
    confirmarRetiro: boolean; // false → queda en carrito ePak para revisión
}

export interface CrearEnvioResult {
    success: boolean;
    idOrdenRetiro?: number;
    nroEnvio?: string;        // 19 dígitos
    error?: string;
}

export interface TrackingEvento {
    fecha: string;
    estado: string;
    sucursal?: string;
    descripcion?: string;
}

export interface TrackingResult {
    nroEnvio: string;
    estadoActual: string;
    eventos: TrackingEvento[];
}

export interface Sucursal {
    id: number;
    nombre: string;
    calle: string;
    nro: string;
    localidad: string;
    provincia: string;
    cp: string;
    horario: string;
}
