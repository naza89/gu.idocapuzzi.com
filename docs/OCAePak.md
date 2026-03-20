# Documentación API OCA e-Pak

**Fuente:** [OCA Developers - e-Pak](https://developers.oca.com.ar/epak.html)

En este espacio vas a tener disponible documentación con las respuestas de los métodos, son en formato XML. Para obtener el WSDL (contrato) de cada uno de los Web Services basta con agregar “?wsdl” al final de la URL de los mismos, de la siguiente manera: http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx?wsdl.

---

## Tabla de Contenidos

1. [Pasos Básicos de Gestión de Envíos](#pasos-básicos-de-gestión-de-envíos)
2. [Cotizar Envío](#cotizar-envío)
3. [Obtener Sucursales](#obtener-sucursales)
4. [Obtener Centros de Costo](#obtener-centros-de-costo)
5. [Crear Envío](#crear-envío)
6. [Crear Envío e-Pak Salud](#crear-envío-e-pak-salud)
7. [Obtener Etiquetas](#obtener-etiquetas)
8. [Anular Envío](#anular-envío)
9. [Obtener Último Estado de un Envío](#obtener-último-estado-de-un-envío)
10. [Obtener Historial Completo de un Envío](#obtener-historial-completo-de-un-envío)
11. [Obtener Listado de Envíos Creados](#obtener-listado-de-envíos-creados)
12. [Datos para Pruebas](#datos-para-pruebas)

---

## Pasos Básicos de Gestión de Envíos

### Flujo de Trabajo Recomendado

1. **Crear usuario e-Pak** – Para utilizar los web services es necesario contar con un usuario de la aplicación e-Pak: https://www5.oca.com.ar/ocaepak

2. **Cotizar envío** *(Opcional)* – Permite conocer el valor de un envío antes de crearlo.

3. **Obtener sucursales** *(Opcional)* – Consulta necesaria para conocer las sucursales habilitadas como punto de origen o destino.

4. **Obtener centros de costo** *(Opcional)* – Retorna el Centro de Costo que identifica la dirección de rendición de devoluciones.

5. **Crear envío** – Generación del envío.

6. **Obtener etiquetas** – Descarga de etiquetas para el envío creado.

---

## Cotizar Envío

### Descripción
Retorna el costo del envío y los tiempos de entrega.

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/Tarifar_Envio_Corporativo
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
|-----------|------|-------------|-------------|---------|
| `Cuit` | STRING | Sí | CUIT registrado en OCA (debe incluir guiones) | `30-12345678-9` |
| `Operativa` | INT | Sí | Tipo de servicio a cotizar | - |
| `PesoTotal` | DECIMAL | Sí | Peso total del envío en kilogramos | `0.5` |
| `VolumenTotal` | DECIMAL | Sí | Volumen total del envío en metros cúbicos | `0.5` |
| `CodigoPostalOrigen` | INT | Sí | Código postal de origen | - |
| `CodigoPostalDestino` | INT | Sí | Código postal de destino | - |
| `CantidadPaquetes` | INT | Sí | Cantidad de paquetes que componen el envío | - |
| `ValorDeclarado` | INT | Sí | Valor monetario del envío | `150` |

---

## Obtener Sucursales

### Descripción
Retorna todas las sucursales (Centros de Imposición y Agentes Oficiales) que atienden un código postal dado, junto con los servicios que brindan.

**Importante:**
- Solo las sucursales con servicio de **Admisión de Paquetes** pueden ser origen de envíos
- Solo las sucursales con servicio de **Entrega de Paquetes** pueden ser destino de envíos

### Endpoint
```
http://webservice.oca.com.ar/epak_tracking/Oep_TrackEPak.asmx/GetCentrosImposicionConServiciosByCP
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `CodigoPostal` | INT | Sí | Código postal a consultar |

---

## Obtener Centros de Costo

### Descripción
Retorna los centros de costo asignados a la operativa indicada.

### Endpoint
```
http://webservice.oca.com.ar/oep_tracking/Oep_Track.asmx/GetCentroCostoPorOperativa
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
|-----------|------|-------------|-------------|---------|
| `CUIT` | STRING | Sí | CUIT del cliente con guiones | `32-23521458-1` |
| `Operativa` | INT | Sí | Número de operativa | - |

---

## Crear Envío

### Descripción
Recibe la información necesaria para la creación de una Orden de Retiro/Admisión.

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/IngresoORMultiplesRetiros
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `usr` | STRING | Sí | Usuario de e-Pak |
| `psw` | STRING | Sí | Password de acceso a e-Pak |
| `XML_Datos` | STRING | Sí | XML con los datos de retiro, entrega y características de los paquetes |
| `ConfirmarRetiro` | BOOLEAN | Sí | `True`: confirmación instantánea / `False`: queda en carrito de e-Pak |
| `ArchivoCliente` | - | - | De uso interno, no completar |
| `ArchivoProceso` | - | - | De uso interno, no completar |

### Ejemplo de XML

```xml
<?xml version="1.0" encoding="iso-8859-1" standalone="yes"?>
<ROWS>
  <cabecera ver="2.0" nrocuenta="111757/001" />
  <origenes>
    <origen calle="La Rioja" nro="300" piso="" depto="" cp="1215"
      localidad="CAPITAL FEDERAL" provincia="CAPITAL FEDERAL" contacto=""
      email="test@oca.com.ar" solicitante="" observaciones="" centrocosto="0"
      idfranjahoraria="1" idcentroimposicionorigen="0" fecha="20151015">
      <envios>
        <envio idoperativa="252014" nroremito="Envio1" >
          <destinatario apellido="Fernandez" nombre="Martin" calle="BALCARCE" nro="50"
            piso="" depto="" localidad="CAPITAL FEDERAL" provincia="CAPITAL FEDERAL"
            cp="1214" telefono="49569622" email="test@oca.com.ar" idci="0"
            celular="1121877788" observaciones="Prueba" />
          <paquetes>
            <paquete alto="10" ancho="10" largo="10" peso="1" valor="10" cant="1" />
          </paquetes>
        </envio>
      </envios>
    </origen>
  </origenes>
</ROWS>
```

### Estructura XML - Cabecera

| Campo | Longitud | Obligatorio | Descripción |
|-------|----------|-------------|-------------|
| `ver` | 3 | Sí | Versión del XML (valor fijo: `"2.0"`) |
| `nrocuenta` | 10 | Sí | Número de cuenta habilitado en OCA |

### Estructura XML - Origen

| Campo | Longitud | Obligatorio | Descripción |
|-------|----------|-------------|-------------|
| `calle` | 30 | Sí | Calle del origen |
| `nro` | 5 | Sí | Número de calle |
| `piso` | 2 | No | Piso (opcional) |
| `depto` | 4 | No | Departamento (opcional) |
| `cp` | 4 | Sí | Código postal |
| `localidad` | 30 | Sí | Localidad |
| `provincia` | 30 | Sí | Provincia |
| `contacto` | 30 | No | Persona de contacto (opcional) |
| `email` | 100 | Condicional | Obligatorio solo para Orden de Retiro |
| `solicitante` | 30 | No | Nombre del solicitante (opcional) |
| `observaciones` | 100 | Condicional | Obligatorio solo para Orden de Retiro |
| `centrocosto` | 10 | Sí | Número de centro de costo (obtenido con `GetCentroCostoPorOperativa`) |
| `idfranjahoraria` | 1 | Sí | Franja horaria: `1` = 8 a 17hs / `2` = 8 a 12hs / `3` = 14 a 17hs |
| `idcentroimposicionorigen` | 3 | Condicional | Obligatorio solo para Admisión en Sucursal (ID Centro Imposición OCA) |
| `fecha` | 10 | Sí | Fecha en formato `AAAAMMDD` (ej: `20151015`) |

### Estructura XML - Envíos

| Campo | Longitud | Obligatorio | Descripción |
|-------|----------|-------------|-------------|
| `idoperativa` | 6 | Sí | Operativa del cliente |
| `nroremito` | 30 | Sí | Número de remito del cliente |

### Estructura XML - Destinatario

| Campo | Longitud | Obligatorio | Descripción |
|-------|----------|-------------|-------------|
| `apellido` | 30 | Sí | Apellido del destinatario |
| `nombre` | 30 | Sí | Nombre del destinatario |
| `calle` | 30 | Sí | Calle de destino |
| `nro` | 5 | Sí | Número de calle |
| `piso` | 6 | No | Piso (opcional) |
| `depto` | 4 | No | Departamento (opcional) |
| `localidad` | 30 | Sí | Localidad |
| `provincia` | 30 | Sí | Provincia |
| `cp` | 4 | Sí | Código postal |
| `telefono` | 30 | No | Teléfono (opcional) |
| `email` | 100 | No | Email (opcional) |
| `idci` | 3 | Condicional | Obligatorio solo para entrega en Sucursal (ID Centro Imposición OCA) |
| `celular` | 15 | No | Celular (si se envía, el sistema envía SMS cuando llega a sucursal destino) |
| `observaciones` | 100 | No | Observaciones (opcional) |

### Estructura XML - Paquetes

| Campo | Longitud | Obligatorio | Descripción | Unidad |
|-------|----------|-------------|-------------|--------|
| `alto` | 9.2 | Sí | Alto del paquete (decimales con punto) | cm |
| `ancho` | 9.2 | Sí | Ancho del paquete (decimales con punto) | cm |
| `largo` | 9.2 | Sí | Largo del paquete (decimales con punto) | cm |
| `peso` | 9.2 | Sí | Peso del paquete (decimales con punto) | kg |
| `valor` | 9.2 | Condicional | Obligatorio solo para operativas con Seguro OCA, sino enviar `0` | - |
| `cant` | 10 | Sí | Cantidad (valor fijo: `"1"`) | - |

---

## Crear Envío e-Pak Salud

### Descripción
Recibe la información necesaria para la creación de una Orden de Retiro de e-Pak Salud.

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/IngresoORMultiplesRetiros
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros
Idénticos a "Crear envío".

### Ejemplo de XML

```xml
<?xml version="1.0" encoding="iso-8859-1" standalone="yes"?>
<ROWS>
  <cabecera ver="2.0" nrocuenta="111757/001" />
  <origenes>
    <origen calle="La Rioja" nro="300" piso="" depto="" cp="1215"
      localidad="CAPITAL FEDERAL" provincia="CAPITAL FEDERAL" contacto=""
      email="test@oca.com.ar" solicitante="" observaciones="" centrocosto="0"
      idfranjahoraria="1" idcentroimposicionorigen="0" fecha="20151015">
      <envios>
        <envio idoperativa="252014" nroremito="Envio1" cantidadremitos="2" >
          <destinatario apellido="Fernandez" nombre="Martin" calle="BALCARCE" nro="50"
            piso="" depto="" localidad="CAPITAL FEDERAL" provincia="CAPITAL FEDERAL"
            cp="1214" telefono="49569622" email="test@oca.com.ar" idci="0"
            celular="1121877788" observaciones="Prueba" />
          <paquetes>
            <paquete alto="10" ancho="10" largo="10" peso="1" valor="10" cant="1" />
          </paquetes>
        </envio>
      </envios>
    </origen>
  </origenes>
</ROWS>
```

### Estructura XML - Envíos (campo adicional)

| Campo | Longitud | Obligatorio | Descripción |
|-------|----------|-------------|-------------|
| `cantidadremitos` | 3 | Sí | Cantidad de remitos que acompañarán al envío |

---

## Obtener Etiquetas

### 1. Etiquetas HTML

#### Descripción
Retorna un HTML que representa una etiqueta con los datos del envío.

**Comportamiento:**
- Si se indica `idOrdenRetiro` sin `nroEnvio`: devuelve todas las etiquetas de la orden
- Si se indica `nroEnvio`: devuelve solo la etiqueta del envío específico

#### Endpoints

**Tamaño A4:**
```
http://webservice.oca.com.ar/epak_tracking/Oep_Trackepak.asmx/GetHtmlDeEtiquetasPorOrdenOrNumeroEnvio
```

**Tamaño 10x15 cm:**
```
http://webservice.oca.com.ar/epak_tracking/Oep_Trackepak.asmx/GetHtmlDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora
```

#### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `idOrdenRetiro` | INT | Condicional | Número de Orden de Retiro/Admisión (obligatorio si no se indica `nroEnvio`) |
| `nroEnvio` | STRING | Condicional | Número de Envío de 19 dígitos (obligatorio si no se indica `idOrdenRetiro`) |

---

### 2. Etiquetas PDF

#### Descripción
Retorna el binario en Base64 de un PDF que representa una etiqueta. Mismos criterios de parámetros que en HTML.

#### Endpoints

**Tamaño A4:**
```
http://webservice.oca.com.ar/epak_tracking/Oep_Trackepak.asmx/GetPdfDeEtiquetasPorOrdenOrNumeroEnvio
```

**Tamaño 10x15 cm:**
```
http://webservice.oca.com.ar/epak_tracking/Oep_Trackepak.asmx/GetPdfDeEtiquetasPorOrdenOrNumeroEnvioParaEtiquetadora
```

#### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `idOrdenRetiro` | INT | No | Número de Orden de Retiro/Admisión |
| `nroEnvio` | STRING | No | Número de Envío de 19 dígitos |
| `logisticaInversa` | STRING | No | Indica si el envío es de Logística Inversa (`true` / `false`) |

---

### 3. Etiquetas ZPL

#### Descripción
Obtiene las etiquetas en formato ZPL para impresoras Zebra (tamaño 10 x 15 cm).

#### Endpoint
```
http://webservice.oca.com.ar/epak_tracking/Oep_Trackepak.asmx/ObtenerEtiquetasZPL
```

#### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `ordenRetiro` | INT | No | Número de Orden de Retiro/Admisión |
| `numeroEnvio` | STRING | No | Número de Envío de 19 dígitos |
| `numeroBulto` | INT | No | Número de Bulto |

---

## Anular Envío

### Descripción
Permite anular una Orden de Retiro/Admisión.

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/AnularOrdenGenerada
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `usr` | STRING | Sí | Usuario de e-Pak |
| `psw` | STRING | Sí | Password de acceso a e-Pak |
| `idOrdenRetiro` | STRING | Sí | Identificador de la Orden a anular |

### Mensajes de Respuesta

| Código | Mensaje |
|--------|---------|
| `100` | Anulación exitosa |
| `110` | Usuario inválido |
| `120` | La Orden no fue generada por el usuario indicado |
| `130` | La Orden no puede ser anulada porque se encuentra en un estado incorrecto |

---

## Obtener Último Estado de un Envío

### Descripción
Retorna el último estado alcanzado por un envío junto con otros datos.

**Comportamiento:**
- Si se consulta por envío: retorna el estado de ese envío específico
- Si se consulta por Orden de Retiro: retorna el estado de todos los envíos de la orden

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/GetEnvioEstadoActual
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `numeroEnvio` | STRING | Sí | Número de Envío |
| `ordenRetiro` | INT | No | Número de Orden de Retiro |

---

## Obtener Historial Completo de un Envío

### Descripción
Retorna el tracking del envío (historial de estados).

**Importante:**
- Si se indica `Pieza`: no es necesario indicar `NroDocumentoCliente` ni `CUIT`
- Si NO se indica `Pieza`: `NroDocumentoCliente` y `CUIT` son obligatorios

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/Tracking_Pieza
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
|-----------|------|-------------|-------------|---------|
| `NroDocumentoCliente` | STRING | Condicional | Número de documento interno del cliente | - |
| `CUIT` | STRING | Condicional | CUIT del cliente con guiones | `32-25445889-2` |
| `Pieza` | STRING | Condicional | Número de Envío de 19 dígitos | - |

---

## Obtener Listado de Envíos Creados

### Descripción
Retorna todos los envíos generados para un rango de tiempo determinado.

### Endpoint
```
http://webservice.oca.com.ar/ePak_tracking/Oep_TrackEPak.asmx/List_Envios
```

### Métodos Soportados
GET / POST / SOAP / SOAP 1.2

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
|-----------|------|-------------|-------------|---------|
| `CUIT` | STRING | No | CUIT del cliente con guiones | `32-25445889-2` |
| `FechaDesde` | STRING | No | Fecha desde (formato `DD-MM-AAAA`) | `15-02-2015` |
| `FechaHasta` | STRING | No | Fecha hasta (formato `DD-MM-AAAA`) | `25-02-2015` |

---

## Datos para Pruebas

### URLs de Ambiente de Testing

```
http://webservice.oca.com.ar/ePak_Tracking_TEST/
http://webservice.oca.com.ar/OEP_Tracking_TEST/
```

### Credenciales de Prueba

| Parámetro | Valor |
|-----------|-------|
| **Usuario** | `test@oca.com.ar` |
| **Clave** | `123456` |
| **Número de Cuenta** | `111757/001` |
| **CUIT** | `30-53625919-4` |

### Operativas de Prueba

| Tipo de Operativa | ID |
|-------------------|-----|
| Puerta a Puerta | `64665` |
| Puerta a Sucursal | `62342` |
| Sucursal a Puerta | `94584` |
| Sucursal a Sucursal | `78254` |
| Logística Inversa Puerta a Puerta | `260708` |
| Logística Inversa Sucursal a Puerta | `260709` |

---

## Notas Adicionales

### Formatos de Datos Importantes

- **CUIT**: Siempre debe incluir guiones (formato: `XX-XXXXXXXX-X`)
- **Fechas XML**: Formato `AAAAMMDD` sin separadores
- **Fechas consultas**: Formato `DD-MM-AAAA` con guiones
- **Número de Envío**: 19 dígitos
- **Decimales**: Usar punto como separador decimal

### Consideraciones de Uso

- Para ambientes de producción, usar las URLs sin el sufijo `_TEST`
- El parámetro `ConfirmarRetiro` en `True` genera el envío inmediatamente
- Con `ConfirmarRetiro` en `False`, el envío queda pendiente en el carrito de e-Pak
- Las etiquetas pueden obtenerse en 3 formatos: HTML, PDF y ZPL según la necesidad de impresión
