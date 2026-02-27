export const OCA_CONFIG = {
    usuario: process.env.OCA_USUARIO!,
    clave: process.env.OCA_CLAVE!,
    cuit: process.env.OCA_CUIT!,
    nroCuenta: process.env.OCA_NUMERO_CUENTA!,
    // ID de la sucursal OCA donde se imponen (dejan) los paquetes
    // 1405 = CALVIN GROUP S.R.L., Av. Rivadavia 13720, Haedo
    imposicionOrigenId: parseInt(process.env.OCA_IMPOSICION_ORIGEN_ID || '1405'),
    sandbox: process.env.OCA_SANDBOX === 'true',

    get baseUrl() {
        return this.sandbox
            ? process.env.OCA_API_URL_TEST!
            : process.env.OCA_API_URL!;
    },

    get baseUrlAlt() {
        // GetCentroCostoPorOperativa usa un endpoint diferente
        return this.sandbox
            ? process.env.OCA_API_URL_TEST!
            : process.env.OCA_API_URL_ALT!;
    },

    operativas: {
        puertaPuerta: parseInt(process.env.OCA_OPERATIVA_PP || '0'),
        puertaSucursal: parseInt(process.env.OCA_OPERATIVA_PS || '0'),
    },

    origen: {
        calle: process.env.OCA_ORIGEN_CALLE!,
        nro: process.env.OCA_ORIGEN_NRO!,
        piso: process.env.OCA_ORIGEN_PISO || '',
        depto: process.env.OCA_ORIGEN_DEPTO || '',
        cp: process.env.OCA_ORIGEN_CP!,
        localidad: process.env.OCA_ORIGEN_LOCALIDAD!,
        provincia: process.env.OCA_ORIGEN_PROVINCIA!,
        contacto: process.env.OCA_ORIGEN_CONTACTO || '',
        email: process.env.OCA_ORIGEN_EMAIL!,
        telefono: process.env.OCA_ORIGEN_TELEFONO || '',
        franjaHoraria: parseInt(process.env.OCA_FRANJA_HORARIA || '1'),
    }
};
