# INTEGRACIÓN OCA ePAK — GÜIDO CAPUZZI
## Plan Técnico v2.0

**Fecha:** Febrero 2026  
**Reemplaza:** `PLAN_INTEGRACION_OCA.md` (v1.0, Febrero 2026)  
**Estado del proyecto:** Next.js en Vercel, Supabase activo, credenciales OCA ePak de producción disponibles  
**Referencia de arquitectura:** `PLAN_MAESTRO_INTEGRACION.md`

---

## CONTEXTO Y CAMBIOS RESPECTO AL PLAN ANTERIOR

El plan v1.0 fue escrito asumiendo que no había cuenta ePak activa y que el backend todavía no existía. Ambas condiciones cambiaron:

- ✅ Ya somos clientes OCA con operativas activas
- ✅ La arquitectura es Next.js en Vercel (API Routes como proxy, no llamadas directas desde browser)
- ✅ Supabase está conectado

**Por qué el plan anterior no sirve como guía de implementación:**
La API de OCA devuelve XML sobre HTTP sin CORS headers. Llamarla directamente desde el browser genera error. Toda la comunicación con OCA debe ocurrir en el servidor — en nuestro caso, en las API Routes de Next.js (`/app/api/oca/`). El módulo `lib/oca/` contiene la lógica compartida, no `frontend/src/services/oca/` como proponía el plan anterior.

---

## DATOS DE CONFIGURACIÓN

### Credenciales (guardar en Vercel Dashboard — nunca en el código)

```bash
# Variables de entorno en Vercel
OCA_USUARIO=          # tu usuario ePak (email)
OCA_CLAVE=            # tu contraseña ePak
OCA_CUIT=             # tu CUIT con guiones (XX-XXXXXXXX-X)
OCA_NUMERO_CUENTA=    # tu número de cuenta (ej: 123456/001)
OCA_API_URL=http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx
OCA_API_URL_ALT=http://webservice.oca.com.ar/oep_tracking/Oep_Track.asmx
```

### Dirección de origen (completar con los datos reales de GÜIDO)

```bash
OCA_ORIGEN_CALLE=         # calle
OCA_ORIGEN_NRO=           # número
OCA_ORIGEN_PISO=          # piso (vacío si no aplica)
OCA_ORIGEN_DEPTO=         # depto (vacío si no aplica)
OCA_ORIGEN_CP=            # código postal (4 dígitos)
OCA_ORIGEN_LOCALIDAD=     # localidad
OCA_ORIGEN_PROVINCIA=     # provincia
OCA_ORIGEN_CONTACTO=      # nombre de contacto para OCA
OCA_ORIGEN_EMAIL=         # email de contacto
OCA_ORIGEN_TELEFONO=      # teléfono
OCA_FRANJA_HORARIA=1      # 1=8-17hs / 2=8-12hs / 3=14-17hs
```

### Operativas activas (completar con los IDs reales de tu cuenta)

```bash
OCA_OPERATIVA_PP=     # Puerta a Puerta
OCA_OPERATIVA_PS=     # Puerta a Sucursal (si está activa)
```

> **Nota:** Verificar las operativas activas en el panel ePak: https://www5.oca.com.ar/ocaepak

---

## AMBIENTE DE TEST (para desarrollo)

Si se necesita probar sin afectar la cuenta de producción:

```bash
OCA_API_URL_TEST=http://webservice.oca.com.ar/ePak_Tracking_TEST/
OCA_USUARIO_TEST=test@oca.com.ar
OCA_CLAVE_TEST=123456
OCA_CUIT_TEST=30-53625919-4
OCA_CUENTA_TEST=111757/001
OCA_OP_PP_TEST=64665
OCA_OP_PS_TEST=62342
```

Cambiar entre test y producción con una variable:
```bash
OCA_SANDBOX=false   # true para test, false para producción
```

---

## ARQUITECTURA

```
CHECKOUT (browser)
      ↓
  fetch POST /api/oca/cotizar
      ↓
  Next.js API Route (server)
  /app/api/oca/cotizar/route.ts
      ↓  usa
  lib/oca/client.ts  →  OCA API (XML/HTTP)
      ↓
  parsea XML → retorna JSON al browser
```

**Regla:** El browser nunca habla con OCA directamente. Todo pasa por las API Routes.

---

## ESTRUCTURA DE ARCHIVOS

```
app/
└── api/
    └── oca/
        ├── cotizar/
        │   └── route.ts          # POST /api/oca/cotizar
        ├── sucursales/
        │   └── route.ts          # GET /api/oca/sucursales?cp=1414
        ├── centros-costo/
        │   └── route.ts          # GET /api/oca/centros-costo?operativa=XX
        ├── crear-envio/
        │   └── route.ts          # POST /api/oca/crear-envio
        ├── etiqueta/
        │   └── route.ts          # GET /api/oca/etiqueta?ordenId=XX
        ├── tracking/
        │   └── route.ts          # GET /api/oca/tracking?nroEnvio=XX
        └── anular/
            └── route.ts          # POST /api/oca/anular

lib/
└── oca/
    ├── config.ts                 # Lee variables de entorno
    ├── client.ts                 # Hace las llamadas HTTP a OCA
    ├── xml-generator.ts          # Construye XMLs para crear envío
    ├── xml-parser.ts             # Parsea respuestas XML a objetos JS
    ├── calculators.ts            # Calcula peso/volumen de un pedido
    ├── validations.ts            # Valida datos antes de llamar a OCA
    └── types.ts                  # TypeScript types
```

---

## MÓDULO `lib/oca/`

### `config.ts`

```typescript
export const OCA_CONFIG = {
  usuario:    process.env.OCA_USUARIO!,
  clave:      process.env.OCA_CLAVE!,
  cuit:       process.env.OCA_CUIT!,
  nroCuenta:  process.env.OCA_NUMERO_CUENTA!,
  sandbox:    process.env.OCA_SANDBOX === 'true',

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
    puertaPuerta:    parseInt(process.env.OCA_OPERATIVA_PP || '0'),
    puertaSucursal:  parseInt(process.env.OCA_OPERATIVA_PS || '0'),
  },

  origen: {
    calle:      process.env.OCA_ORIGEN_CALLE!,
    nro:        process.env.OCA_ORIGEN_NRO!,
    piso:       process.env.OCA_ORIGEN_PISO || '',
    depto:      process.env.OCA_ORIGEN_DEPTO || '',
    cp:         process.env.OCA_ORIGEN_CP!,
    localidad:  process.env.OCA_ORIGEN_LOCALIDAD!,
    provincia:  process.env.OCA_ORIGEN_PROVINCIA!,
    contacto:   process.env.OCA_ORIGEN_CONTACTO || '',
    email:      process.env.OCA_ORIGEN_EMAIL!,
    telefono:   process.env.OCA_ORIGEN_TELEFONO || '',
    franjaHoraria: parseInt(process.env.OCA_FRANJA_HORARIA || '1'),
  }
};
```

---

### `types.ts`

```typescript
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
  valor: number;   // valor declarado (0 si la operativa no tiene seguro)
}

export interface CrearEnvioInput {
  destinatario: DireccionDestino;
  paquetes: PaqueteInput[];
  operativa: number;
  nroRemito: string;        // número de orden de GÜIDO
  centroCosto?: number;
  confirmarRetiro: boolean; // true: despacha inmediatamente / false: queda en carrito ePak
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
```

---

### `client.ts`

```typescript
import { OCA_CONFIG } from './config';

// OCA usa GET con query params para la mayoría de endpoints
export async function ocaGet(
  endpoint: string,
  params: Record<string, string | number>,
  useAltUrl = false
): Promise<string> {
  const baseUrl = useAltUrl ? OCA_CONFIG.baseUrlAlt : OCA_CONFIG.baseUrl;
  const url = new URL(`${baseUrl}/${endpoint}`);

  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // Timeout manual con AbortController
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`OCA HTTP error: ${res.status}`);
  }

  return res.text(); // OCA siempre responde XML como texto
}

// IngresoORMultiplesRetiros usa POST con form data
export async function ocaPost(
  endpoint: string,
  params: Record<string, string>
): Promise<string> {
  const baseUrl = OCA_CONFIG.baseUrl;
  const url = `${baseUrl}/${endpoint}`;

  const body = new URLSearchParams(params);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`OCA HTTP error: ${res.status}`);
  }

  return res.text();
}
```

---

### `xml-generator.ts`

```typescript
import { OCA_CONFIG } from './config';
import { CrearEnvioInput } from './types';

export function generarXMLEnvio(input: CrearEnvioInput): string {
  const { destinatario: d, paquetes, operativa, nroRemito, centroCosto = 0 } = input;
  const o = OCA_CONFIG.origen;

  // OCA requiere encoding iso-8859-1 — los acentos deben mapearse
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
      calle="${o.calle}"
      nro="${o.nro}"
      piso="${o.piso}"
      depto="${o.depto}"
      cp="${o.cp}"
      localidad="${o.localidad}"
      provincia="${o.provincia}"
      contacto="${o.contacto}"
      email="${o.email}"
      solicitante=""
      observaciones=""
      centrocosto="${centroCosto}"
      idfranjahoraria="${o.franjaHoraria}"
      idcentroimposicionorigen="0"
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

// Escapar caracteres XML y eliminar acentos problemáticos para iso-8859-1
function sanitizar(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

### `xml-parser.ts`

```typescript
// Next.js corre en Node — usar el parser nativo o una lib liviana
// Opción recomendada: fast-xml-parser (sin dependencias pesadas)
// npm install fast-xml-parser

import { XMLParser } from 'fast-xml-parser';
import { CotizacionResult, CrearEnvioResult, TrackingResult } from './types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export function parsearCotizacion(xml: string): CotizacionResult[] {
  const obj = parser.parse(xml);
  const tarifas = obj?.NewDataSet?.Table;

  if (!tarifas) return [];

  const arr = Array.isArray(tarifas) ? tarifas : [tarifas];

  return arr.map((t: any) => ({
    precio:        parseFloat(t.Precio || t.precio || '0'),
    diasHabiles:   parseInt(t.PlazoEntrega || t.plazoEntrega || '0'),
    tipoServicio:  t.Descripcion || t.descripcion || '',
    operativa:     parseInt(t.Operativa || t.operativa || '0'),
  }));
}

export function parsearCrearEnvio(xml: string): CrearEnvioResult {
  // La respuesta es un número de orden (éxito) o un mensaje de error
  const trimmed = xml.trim();

  // Respuesta exitosa: devuelve el ID de la orden como string numérico dentro de XML
  const match = trimmed.match(/<int[^>]*>(\d+)<\/int>/);
  if (match) {
    return { success: true, idOrdenRetiro: parseInt(match[1]) };
  }

  // Respuesta de error: texto con descripción
  return { success: false, error: trimmed.replace(/<[^>]+>/g, '') };
}

export function parsearTracking(xml: string): TrackingResult | null {
  const obj = parser.parse(xml);
  const data = obj?.NewDataSet?.Table;

  if (!data) return null;

  const arr = Array.isArray(data) ? data : [data];

  return {
    nroEnvio:     String(arr[0]?.NumeroEnvio || ''),
    estadoActual: arr[arr.length - 1]?.Estado || '',
    eventos: arr.map((e: any) => ({
      fecha:       e.Fecha || '',
      estado:      e.Estado || '',
      sucursal:    e.Sucursal || '',
      descripcion: e.Descripcion || '',
    })),
  };
}
```

---

### `calculators.ts`

Las remeras de GÜIDO son prendas de indumentaria. Valores estimados por defecto hasta que se definan los datos reales de cada producto:

```typescript
// Dimensiones por defecto para una remera doblada
// Actualizar cuando se tengan medidas reales
const DIMENSIONES_REMERA = {
  alto:  3,   // cm
  ancho: 25,  // cm
  largo: 30,  // cm
  peso:  0.3, // kg
};

// Margen de embalaje
const EMBALAJE = {
  alto:  5,
  ancho: 5,
  largo: 5,
  peso:  0.1,
};

export interface ItemCarrito {
  cantidad: number;
  peso?:    number; // kg, si está definido en Supabase
  alto?:    number;
  ancho?:   number;
  largo?:   number;
}

export function calcularPaquete(items: ItemCarrito[]) {
  // Un paquete por pedido (GÜIDO envía pedidos individuales)
  let pesoTotal = EMBALAJE.peso;

  for (const item of items) {
    const pesoUnitario = item.peso ?? DIMENSIONES_REMERA.peso;
    pesoTotal += pesoUnitario * item.cantidad;
  }

  // Caja estimada para todas las prendas juntas
  const totalPrendas = items.reduce((acc, i) => acc + i.cantidad, 0);
  const alto  = DIMENSIONES_REMERA.alto  * totalPrendas + EMBALAJE.alto;
  const ancho = DIMENSIONES_REMERA.ancho + EMBALAJE.ancho;
  const largo = DIMENSIONES_REMERA.largo + EMBALAJE.largo;

  // Volumen en m³
  const volumenM3 = (alto / 100) * (ancho / 100) * (largo / 100);

  return {
    paquete: { alto, ancho, largo, peso: pesoTotal, valor: 0, cant: 1 } as const,
    pesoTotal,
    volumenM3,
    cantidadPaquetes: 1,
  };
}
```

> **Pendiente:** Definir el peso y dimensiones reales de cada producto y agregarlos como columnas en la tabla `variantes_producto` de Supabase (`peso_kg`, `alto_cm`, `ancho_cm`, `largo_cm`). Hasta que se definan, `calculators.ts` usa los valores estimados.

---

## API ROUTES

### `POST /api/oca/cotizar`

**Request body:**
```json
{
  "cpDestino": 1414,
  "pesoKg": 0.4,
  "volumenM3": 0.0002,
  "cantidadPaquetes": 1,
  "valorDeclarado": 50000
}
```

**Implementación:**
```typescript
// app/api/oca/cotizar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OCA_CONFIG } from '@/lib/oca/config';
import { ocaGet } from '@/lib/oca/client';
import { parsearCotizacion } from '@/lib/oca/xml-parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Cotizar con cada operativa activa
    const resultados = await Promise.all(
      Object.entries(OCA_CONFIG.operativas)
        .filter(([, id]) => id > 0)
        .map(async ([nombre, operativa]) => {
          const xml = await ocaGet('Tarifar_Envio_Corporativo', {
            Cuit:                  OCA_CONFIG.cuit,
            Operativa:             operativa,
            PesoTotal:             body.pesoKg,
            VolumenTotal:          body.volumenM3,
            CodigoPostalOrigen:    OCA_CONFIG.origen.cp,
            CodigoPostalDestino:   body.cpDestino,
            CantidadPaquetes:      body.cantidadPaquetes,
            ValorDeclarado:        body.valorDeclarado,
          });

          const cotizaciones = parsearCotizacion(xml);
          return cotizaciones.map(c => ({ ...c, nombre }));
        })
    );

    return NextResponse.json({
      success: true,
      opciones: resultados.flat(),
    });
  } catch (err: any) {
    console.error('[OCA cotizar]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

### `GET /api/oca/sucursales?cp=1414`

```typescript
// app/api/oca/sucursales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { XMLParser } from 'fast-xml-parser';

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get('cp');
  if (!cp) return NextResponse.json({ error: 'CP requerido' }, { status: 400 });

  try {
    const xml = await ocaGet(
      'GetCentrosImposicionConServiciosByCP',
      { CodigoPostal: cp }
    );

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const obj = parser.parse(xml);
    const centros = obj?.NewDataSet?.Table;

    if (!centros) return NextResponse.json({ success: true, sucursales: [] });

    const arr = Array.isArray(centros) ? centros : [centros];

    // Solo las que tienen servicio de entrega (para destino)
    const sucursales = arr
      .filter((c: any) => c.Entrega === 'True' || c.Entrega === true)
      .map((c: any) => ({
        id:        c.Idci,
        nombre:    c.Nombre,
        calle:     c.Calle,
        nro:       c.Numero,
        localidad: c.Localidad,
        provincia: c.Provincia,
        cp:        c.CodigoPostal,
        horario:   c.Horario,
      }));

    return NextResponse.json({ success: true, sucursales });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

### `POST /api/oca/crear-envio`

Este endpoint se llama **desde el backend**, no desde el checkout del usuario. Se invoca cuando el administrador confirma que el pedido está listo para despachar.

```typescript
// app/api/oca/crear-envio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OCA_CONFIG } from '@/lib/oca/config';
import { ocaPost } from '@/lib/oca/client';
import { generarXMLEnvio } from '@/lib/oca/xml-generator';
import { parsearCrearEnvio } from '@/lib/oca/xml-parser';
import { calcularPaquete } from '@/lib/oca/calculators';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { ordenId, confirmarRetiro = false } = await req.json();

    // 1. Obtener la orden completa de Supabase
    const { data: orden, error } = await supabase
      .from('ordenes')
      .select('*, items_orden(*), direccion_envio(*), clientes(*)')
      .eq('id', ordenId)
      .single();

    if (error || !orden) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
    }

    // 2. Calcular paquete
    const { paquete, pesoTotal, volumenM3 } = calcularPaquete(orden.items_orden);

    // 3. Construir XML
    const xml = generarXMLEnvio({
      destinatario: {
        apellido:   orden.clientes.apellido,
        nombre:     orden.clientes.nombre,
        calle:      orden.direccion_envio.calle,
        nro:        orden.direccion_envio.numero,
        piso:       orden.direccion_envio.piso || '',
        depto:      orden.direccion_envio.depto || '',
        localidad:  orden.direccion_envio.localidad,
        provincia:  orden.direccion_envio.provincia,
        cp:         orden.direccion_envio.codigo_postal,
        celular:    orden.clientes.telefono || '',
        email:      orden.clientes.email,
        idci:       orden.id_sucursal_oca || 0,
      },
      paquetes:        [paquete],
      operativa:       orden.operativa_oca,
      nroRemito:       String(orden.numero_orden),
      confirmarRetiro,
    });

    // 4. Llamar a OCA
    const xml_respuesta = await ocaPost('IngresoORMultiplesRetiros', {
      usr:             OCA_CONFIG.usuario,
      psw:             OCA_CONFIG.clave,
      XML_Datos:       xml,
      ConfirmarRetiro: confirmarRetiro ? 'true' : 'false',
      ArchivoCliente:  '',
      ArchivoProceso:  '',
    });

    const resultado = parsearCrearEnvio(xml_respuesta);

    if (!resultado.success) {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 400 });
    }

    // 5. Guardar en Supabase
    await supabase
      .from('ordenes')
      .update({
        id_orden_retiro_oca: resultado.idOrdenRetiro,
        estado: confirmarRetiro ? 'preparando' : 'pendiente_confirmacion',
      })
      .eq('id', ordenId);

    return NextResponse.json({ success: true, idOrdenRetiro: resultado.idOrdenRetiro });
  } catch (err: any) {
    console.error('[OCA crear-envio]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

### `GET /api/oca/etiqueta?ordenId=XX`

Las etiquetas tienen **tres formatos** según la necesidad:

| Formato | Endpoint | Cuándo usar |
|---------|----------|-------------|
| HTML    | `GetHtmlDeEtiquetasPorOrdenOrNumeroEnvio` | Vista previa en browser |
| PDF A4  | `GetPdfDeEtiquetasPorOrdenOrNumeroEnvio` | Impresión en impresora común |
| PDF 10x15 | `GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora` | Impresora de etiquetas |
| ZPL     | `ObtenerEtiquetasZPL` | Impresoras Zebra |

**Recomendación para GÜIDO:** PDF 10x15 para impresora de etiquetas, o PDF A4 si se imprime en hoja común. ZPL solo si se tiene impresora Zebra.

```typescript
// app/api/oca/etiqueta/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';

export async function GET(req: NextRequest) {
  const ordenId  = req.nextUrl.searchParams.get('ordenId');
  const formato  = req.nextUrl.searchParams.get('formato') || 'pdf'; // html | pdf | etiquetadora

  if (!ordenId) return NextResponse.json({ error: 'ordenId requerido' }, { status: 400 });

  const endpointMap: Record<string, string> = {
    html:         'GetHtmlDeEtiquetasPorOrdenOrNumeroEnvio',
    pdf:          'GetPdfDeEtiquetasPorOrdenOrNumeroEnvio',
    etiquetadora: 'GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora',
    zpl:          'ObtenerEtiquetasZPL',
  };

  const endpoint = endpointMap[formato] || endpointMap.pdf;

  try {
    const respuesta = await ocaGet(endpoint, { idOrdenRetiro: ordenId });

    // PDF viene en Base64 dentro del XML — extraer el contenido
    if (formato === 'pdf' || formato === 'etiquetadora') {
      const match = respuesta.match(/<[^>]+>([A-Za-z0-9+/=\s]+)<\/[^>]+>/);
      if (match) {
        const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="etiqueta-${ordenId}.pdf"`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, contenido: respuesta });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

### `GET /api/oca/tracking?nroEnvio=XX`

```typescript
// app/api/oca/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ocaGet } from '@/lib/oca/client';
import { parsearTracking } from '@/lib/oca/xml-parser';

export async function GET(req: NextRequest) {
  const nroEnvio = req.nextUrl.searchParams.get('nroEnvio');
  if (!nroEnvio) return NextResponse.json({ error: 'nroEnvio requerido' }, { status: 400 });

  try {
    const xml = await ocaGet('Tracking_Pieza', { Pieza: nroEnvio });
    const tracking = parsearTracking(xml);

    return NextResponse.json({ success: true, tracking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
```

---

## TABLAS SUPABASE — CAMPOS NECESARIOS

### Tabla `ordenes` — columnas a agregar si no existen

```sql
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS operativa_oca         INTEGER;
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS id_sucursal_oca       INTEGER;  -- solo si retira en sucursal
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS id_orden_retiro_oca   INTEGER;  -- generado por OCA al crear envío
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS nro_envio_oca         TEXT;     -- 19 dígitos
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS precio_envio          DECIMAL(10,2);
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS tipo_envio            TEXT;     -- 'puerta_puerta' | 'sucursal'
```

### Tabla `variantes_producto` — campos para cálculo de envío

```sql
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS peso_kg  DECIMAL(5,2);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS alto_cm  DECIMAL(5,1);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS ancho_cm DECIMAL(5,1);
ALTER TABLE variantes_producto ADD COLUMN IF NOT EXISTS largo_cm DECIMAL(5,1);
```

> Mientras no se carguen estos valores, `calculators.ts` usa los estimados por defecto.

---

## FLUJO COMPLETO EN EL CHECKOUT

```
PASO 2 DEL CHECKOUT: Selección de envío

1. Usuario ingresa código postal
2. Frontend llama a POST /api/oca/cotizar
   → Retorna: [{ nombre: 'puertaPuerta', precio: 2500, diasHabiles: 3 }, ...]
3. Se ofrecen las opciones disponibles
   → Puerta a Puerta — $2.500 (3 días hábiles)
   → [Retiro en sucursal — $1.800 (3 días hábiles)] ← solo si operativa activa
4. Si elige sucursal: llamar GET /api/oca/sucursales?cp=XXXX
   → Lista de sucursales para elegir
5. Usuario confirma opción → se guarda en la orden:
   - operativa_oca
   - id_sucursal_oca (si aplica)
   - precio_envio
   - tipo_envio

DESPUÉS DEL PAGO (webhook Galicia confirma):
6. Estado de orden → 'pagado'
7. Admin confirma preparación → llama POST /api/oca/crear-envio
   - confirmarRetiro: false → queda en carrito ePak para revisión
   - confirmarRetiro: true → despacha automáticamente
8. Se guarda id_orden_retiro_oca en Supabase
9. Admin descarga etiqueta → GET /api/oca/etiqueta?ordenId=XX
10. Se imprime y se despacha el paquete

TRACKING:
11. Cliente puede ver estado → GET /api/oca/tracking?nroEnvio=XX
    (el nro_envio_oca se obtiene del panel ePak o de List_Envios)
```

---

## DECISIONES OPERATIVAS A CONFIRMAR

Antes de implementar, definir:

1. **¿Puerta a Puerta solamente, o también Retiro en Sucursal?**
   Impacta qué operativas se activan y si se muestra el selector de sucursales en el checkout.

2. **¿`ConfirmarRetiro: true` o `false`?**
   - `true`: OCA confirma el retiro automáticamente al crear el envío. OCA pasa a buscar el paquete según la franja horaria definida.
   - `false`: El envío queda en el carrito de ePak. Hay que confirmarlo manualmente desde el panel antes del despacho.
   Para un volumen bajo, `false` es más controlado — se puede revisar antes de confirmar.

3. **¿Cuándo se llama a `crear-envio`?**
   - Al confirmar el pago (automático)
   - Al marcar el pedido como "preparado" desde el panel admin (manual)
   Se recomienda manual hasta estabilizar el flujo.

4. **Franja horaria de retiro:** La variable `OCA_FRANJA_HORARIA` define cuándo pasa OCA a retirar el paquete (1=8-17hs, 2=8-12hs, 3=14-17hs).

5. **Seguro OCA:** Si la operativa incluye seguro, el campo `valor` en el paquete debe ser el valor declarado del pedido. Si no incluye seguro, enviar `0`.

---

## INSTRUCCIONES PARA EL AGENTE (ANTIGRAVITY)

Al iniciar la sesión de integración OCA:

1. **Leer este documento** completo antes de escribir una línea de código
2. **Verificar el estado actual** del proyecto — qué tablas de Supabase ya existen, qué campos de órdenes ya están definidos
3. **Crear los archivos** en el orden: `types.ts` → `config.ts` → `client.ts` → `xml-generator.ts` → `xml-parser.ts` → `calculators.ts` → API Routes
4. **Instalar dependencia:** `npm install fast-xml-parser` (liviana, sin overhead)
5. **No llamar a OCA directamente desde el frontend** — siempre a través de `/api/oca/*`
6. **Testear primero con credenciales TEST** (ver sección "Ambiente de Test"), luego cambiar `OCA_SANDBOX=false` para producción
7. **Variables de entorno:** configurar en Vercel Dashboard, no en `.env.local` que va a repo

### Push inicial requerido
Antes de empezar con OCA, verificar que los archivos modificados en sesiones anteriores (animaciones, lógica de checkout) hayan sido commiteados y pusheados a GitHub para que Vercel esté actualizado.

### Mails de confirmación
Con el deploy en Vercel y un dominio real, los mails de Supabase Auth (confirmación de cuenta, recuperación de contraseña) funcionan correctamente. En localhost están bloqueados por restricciones del servidor SMTP de Supabase. Verificar en producción antes de integrar OCA.

---

## DEPENDENCIAS A INSTALAR

```bash
npm install fast-xml-parser
```

No se requieren otras dependencias. OCA no tiene SDK oficial para Node.js — la integración es directamente sobre HTTP.

---

*Documento preparado — Febrero 2026 · v2.0*  
*Reemplaza: PLAN_INTEGRACION_OCA.md v1.0*
