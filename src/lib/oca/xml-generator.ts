import { OCA_CONFIG } from './config';
import { CrearEnvioInput } from './types';

/**
 * Genera el XML ISO-8859-1 para IngresoORMultiplesRetiros.
 * OCA requiere un XML estructurado con cabecera, orígenes y envíos.
 */
export function generarXMLEnvio(input: CrearEnvioInput): string {
  const { destinatario: d, paquetes, operativa, nroRemito, centroCosto = 0 } = input;
  const o = OCA_CONFIG.origen;

  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // AAAAMMDD

  const paquetesXML = paquetes.map(p =>
    `<paquete alto="${p.alto}" ancho="${p.ancho}" largo="${p.largo}" ` +
    `peso="${p.peso}" valor="${p.valor}" cant="1" />`
  ).join('\n            ');

  return `<?xml version="1.0" encoding="iso-8859-1" standalone="yes"?>
<ROWS>
  <cabecera ver="2.0" nrocuenta="${OCA_CONFIG.nroCuenta}" />
  <origenes>
    <origen
      calle="${sanitizar(o.calle)}"
      nro="${o.nro}"
      piso="${o.piso}"
      depto="${o.depto}"
      cp="${o.cp}"
      localidad="${sanitizar(o.localidad)}"
      provincia="${sanitizar(o.provincia)}"
      contacto="${sanitizar(o.contacto)}"
      email="${o.email}"
      solicitante=""
      observaciones=""
      centrocosto="${centroCosto}"
      idfranjahoraria="${o.franjaHoraria}"
      idcentroimposicionorigen="${OCA_CONFIG.imposicionOrigenId}"
      fecha="${fecha}">
      <envios>
        <envio idoperativa="${operativa}" nroremito="${nroRemito}">
          <destinatario
            apellido="${sanitizar(d.apellido)}"
            nombre="${sanitizar(d.nombre)}"
            calle="${sanitizar(d.calle)}"
            nro="${d.nro}"
            piso="${d.piso || ''}"
            depto="${d.depto || ''}"
            localidad="${sanitizar(d.localidad)}"
            provincia="${sanitizar(d.provincia)}"
            cp="${d.cp}"
            telefono="${d.telefono || ''}"
            email="${d.email || ''}"
            idci="${d.idci || 0}"
            celular="${d.celular || ''}"
            observaciones="${sanitizar(d.observaciones || '')}" />
          <paquetes>
            ${paquetesXML}
          </paquetes>
        </envio>
      </envios>
    </origen>
  </origenes>
</ROWS>`;
}

/**
 * Escapar caracteres XML y eliminar acentos problemáticos para iso-8859-1.
 */
function sanitizar(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
