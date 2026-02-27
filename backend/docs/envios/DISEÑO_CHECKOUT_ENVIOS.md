# Diseño del Paso 2: Envío - GÜIDO CAPUZZI

**Fecha**: 11 de Febrero 2026  
**Versión**: 2.0

---

## 📋 Objetivo

Diseñar e implementar el **Paso 2: Envío** del checkout, manteniendo **coherencia total** con el estilo, estructura y dimensiones del **Paso 1: Información**.

---

## Estructura del RESUMEN

Primero aparece el titulo de la sección, RESUMEN, y debajo hay una caja con dos textos:

Contacto  (dejar espacio) EMAIL que va en la pagina anterior   Cambiar
---
Ubicación (mismo espacio) Calle, Numero, Ciudad, CP de la pagina anterior   Cambiar   

Los botones 'Cambiar' (tamaño de fuente mas chico) redireccionan al usuario a la página anterior (Información) para cambiar algún dato.


## 🎯 Estructura de Opciones de Envío (MÉTODO DE ENVIO)

El checkout debe mostrar **2 opciones** en todo momento:

1. **Envío a domicilio**
2. **Retiro en sucursal**

---

## 🎨 Especificaciones Visuales Exactas

### **Paleta de Colores**

```css
--texto-principal: #202020;      /* Títulos y texto importante */
--texto-secundario: #8a8a8a;     /* Subtítulos y descripciones */
--texto-inactivo: rgba(32, 32, 32, 0.1);   /* "Elegir sucursal" no clickeado */
--texto-medio: rgba(32, 32, 32, 0.5);      /* Sucursales no seleccionadas */
--borde-box: #202020;             /* Borde de las cajas */
--fondo-box: #ffffff;             /* Fondo de las cajas */
```

### **Tipografía**

Usar las **mismas fuentes y tamaños** que en Paso 1: Información

- **Título de opción**: (ejemplo: "Retiro en sucursal") - mismo tamaño que "Email" o "Nombre"
- **Precio**: Alineado a la derecha, mismo peso que los títulos
- **Subtexto**: (ejemplo: "2 a 4 días hábiles") - mismo tamaño que placeholders
- **Link de acción**: (ejemplo: "Elegir sucursal >") - mismo tamaño que subtextos

### **Dimensiones**

- **Padding del box**: Igual que los inputs del Paso 1
- **Border-radius**: Igual que los inputs del Paso 1
- **Border-width**: 2px (coherente con diseño existente)
- **Espaciado entre opciones**: Mismo que entre campos del Paso 1

---

## 📐 Estado Visual - Opción "Envío a domicilio"

```
┌─────────────────────────────────────────────────────────┐
│  ○  Envío a domicilio                      $8.000,00    │
│     3 a 5 días hábiles                                  │
└─────────────────────────────────────────────────────────┘
```

## 📐 Estados Visuales - Opción "Retiro en sucursal"

### **Estado 1: Sin seleccionar**

```
┌─────────────────────────────────────────────────────────┐
│  ○  Retiro en sucursal                      $5.500,00   │
│     2 a 4 días hábiles                                  │
│     Elegir sucursal  >                                  │
└─────────────────────────────────────────────────────────┘
```

**Características:**
- Radio button: `○` (vacío)
- "Retiro en sucursal": color `#202020`
- "$5,500,00": color `#202020`, alineado a la derecha
- "2 a 4 días hábiles": color `#8a8a8a`
- "Elegir sucursal >": color `rgba(32, 32, 32, 0.1)` (casi invisible)
- Borde del box: `1px solid #e5e5e5` (gris claro, no activo)

---

### **Estado 2: Seleccionado (pero sin elegir sucursal)**

```
┌─────────────────────────────────────────────────────────┐
│  ●  Retiro en sucursal                      $5,500,00   │
│     2 a 4 días hábiles                                  │
│     Elegir sucursal  >                                  │
└─────────────────────────────────────────────────────────┘
```

**Cambios respecto a Estado 1:**
- Radio button: `●` (lleno)
- "Elegir sucursal >": color `#202020` (visible y clickeable)
- Borde del box: `2px solid #202020` (negro, activo)

---

### **Estado 3: Selector de sucursales expandido**

```
┌─────────────────────────────────────────────────────────────────┐
│  ●  Retiro en sucursal                              $5,500,00   │
│     2 a 4 días hábiles                                          │
│     Sucursales cerca de tu domicilio:                           │
│                                                                 │
│     ●  OCA Microcentro, Florida 520, CABA                       │
│     ○  OCA Retiro, Av. Córdoba 950, CABA                        │
│     ○  OCA Constitución, Av. Brasil 280, CABA                   │
└─────────────────────────────────────────────────────────────────┘
```

**Características:**
- "Sucursales cerca de tu domicilio:": color `#202020`, aparece donde estaba "Elegir sucursal >"
- Lista de sucursales con radio buttons propios
- Primera sucursal: `●` (seleccionada por defecto), color `#202020`
- Otras sucursales: `○` (no seleccionadas), color `rgba(32, 32, 32, 0.5)`
- **Transición suave**: `max-height` animado, `ease-in-out 0.3s`

---

## 🔄 Flujo de Interacción Completo

### **Secuencia de Estados**

```
Usuario entra al Paso 2
         ↓
Ve ambas opciones sin seleccionar
         ↓
Clickea radio de "Retiro en sucursal"
         ↓
Estado cambia: radio lleno, "Elegir sucursal" visible
         ↓
Clickea "Elegir sucursal >"
         ↓
Se expande lista de 3 sucursales
         ↓
Primera sucursal viene pre-seleccionada
         ↓
Usuario puede elegir otra
         ↓
Botón "CONTINUAR A PAGAR" se habilita
```

---

## 💻 Implementación - HTML Estructura

```html
<div class="metodo-envio-section">
  <h2 class="section-title">MÉTODO DE ENVÍO</h2>
  
  <!-- Opción 1: Envío a domicilio -->
  <div class="opcion-envio" data-tipo="domicilio">
    <input 
      type="radio" 
      name="metodo-envio" 
      id="envio-domicilio" 
      value="domicilio"
    />
    <label for="envio-domicilio" class="opcion-label">
      <div class="opcion-header">
        <span class="opcion-nombre">Envío a domicilio</span>
        <span class="opcion-precio">$8,000,00</span>
      </div>
      <div class="opcion-detalle">
        <span class="opcion-plazo">3 a 5 días hábiles</span>
      </div>
    </label>
  </div>
  
  <!-- Opción 2: Retiro en sucursal -->
  <div class="opcion-envio opcion-expandible" data-tipo="sucursal">
    <input 
      type="radio" 
      name="metodo-envio" 
      id="envio-sucursal" 
      value="sucursal"
    />
    <label for="envio-sucursal" class="opcion-label">
      <div class="opcion-header">
        <span class="opcion-nombre">Retiro en sucursal</span>
        <span class="opcion-precio">$5,500,00</span>
      </div>
      <div class="opcion-detalle">
        <span class="opcion-plazo">2 a 4 días hábiles</span>
      </div>
    </label>
    
    <!-- Trigger para expandir (solo visible cuando está seleccionado) -->
    <button 
      type="button" 
      class="btn-elegir-sucursal" 
      onclick="expandirSucursales()"
      style="display: none;"
    >
      Elegir sucursal  >
    </button>
    
    <!-- Contenedor de sucursales (expandible) -->
    <div class="selector-sucursales" style="max-height: 0; overflow: hidden;">
      <p class="sucursales-titulo">Sucursales cerca de tu domicilio:</p>
      
      <div class="lista-sucursales">
        <!-- Sucursales se cargan dinámicamente aquí -->
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 Implementación - CSS Exacto

```css
/* ===== ESTRUCTURA BASE ===== */

.metodo-envio-section {
  /* Usar mismo ancho/padding que section de Información */
  max-width: 640px; /* Ajustar según tu diseño */
  margin: 0 auto;
}

.section-title {
  /* Mismo estilo que "RESUMEN" o títulos de Paso 1 */
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
  color: #202020;
}

/* ===== CAJAS DE OPCIONES ===== */

.opcion-envio {
  position: relative;
  border: 1px solid #e5e5e5;
  border-radius: 8px; /* Ajustar según border-radius de inputs */
  padding: 20px 24px; /* Mismo padding que inputs */
  margin-bottom: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Estado: opción seleccionada */
.opcion-envio:has(input[type="radio"]:checked) {
  border: 2px solid #202020;
  padding: 19px 23px; /* Compensar el borde extra */
}

/* Ocultar radio button nativo */
.opcion-envio input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Radio button custom */
.opcion-label {
  display: block;
  cursor: pointer;
  position: relative;
  padding-left: 32px; /* Espacio para el círculo */
}

.opcion-label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  width: 20px;
  height: 20px;
  border: 2px solid #202020;
  border-radius: 50%;
  background: #ffffff;
  transition: all 0.2s ease;
}

/* Radio button - estado checked */
input[type="radio"]:checked + .opcion-label::before {
  background: #202020;
  box-shadow: inset 0 0 0 3px #ffffff;
}

/* ===== CONTENIDO DE LA OPCIÓN ===== */

.opcion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.opcion-nombre {
  font-size: 16px; /* Mismo que labels de inputs */
  font-weight: 500;
  color: #202020;
}

.opcion-precio {
  font-size: 16px;
  font-weight: 600;
  color: #202020;
}

.opcion-detalle {
  display: block;
}

.opcion-plazo {
  font-size: 14px; /* Mismo que placeholders */
  color: #8a8a8a;
}

/* ===== BOTÓN "ELEGIR SUCURSAL" ===== */

.btn-elegir-sucursal {
  display: none; /* Oculto por defecto */
  background: none;
  border: none;
  padding: 0;
  margin-top: 8px;
  font-size: 14px;
  color: rgba(32, 32, 32, 0.1); /* Casi invisible inicialmente */
  cursor: default;
  transition: color 0.2s ease;
}

/* Mostrar cuando la opción está seleccionada */
.opcion-envio:has(input[type="radio"]:checked) .btn-elegir-sucursal {
  display: block;
  color: #202020; /* Visible y clickeable */
  cursor: pointer;
}

.btn-elegir-sucursal:hover {
  text-decoration: underline;
}

/* ===== SELECTOR DE SUCURSALES ===== */

.selector-sucursales {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.selector-sucursales.expandido {
  max-height: 500px; /* Suficiente para 3 sucursales */
}

.sucursales-titulo {
  font-size: 14px;
  font-weight: 500;
  color: #202020;
  margin: 16px 0 12px 0;
}

/* ===== LISTA DE SUCURSALES ===== */

.lista-sucursales {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sucursal-item {
  position: relative;
  padding-left: 32px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(32, 32, 32, 0.5); /* 50% opacidad por defecto */
  transition: color 0.2s ease;
}

.sucursal-item:has(input[type="radio"]:checked) {
  color: #202020; /* 100% opacidad cuando está seleccionada */
}

.sucursal-item input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Radio button de sucursal */
.sucursal-item label {
  cursor: pointer;
  position: relative;
  display: block;
  padding: 8px 0;
}

.sucursal-item label::before {
  content: '';
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  background: #ffffff;
}

.sucursal-item input[type="radio"]:checked + label::before {
  background: currentColor;
  box-shadow: inset 0 0 0 3px #ffffff;
}

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {
  .opcion-envio {
    padding: 16px 20px;
  }
  
  .opcion-nombre,
  .opcion-precio {
    font-size: 14px;
  }
  
  .opcion-plazo {
    font-size: 13px;
  }
}
```

---

## ⚙️ Implementación - JavaScript

```javascript
// ===== GESTIÓN DE SELECCIÓN DE OPCIONES =====

document.addEventListener('DOMContentLoaded', () => {
  const radioButtons = document.querySelectorAll('input[name="metodo-envio"]');
  
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const opcionSeleccionada = e.target.value;
      
      // Si seleccionó "sucursal", mostrar botón de elegir
      if (opcionSeleccionada === 'sucursal') {
        const btnElegir = document.querySelector('.btn-elegir-sucursal');
        btnElegir.style.display = 'block';
      }
    });
  });
});

// ===== EXPANDIR SELECTOR DE SUCURSALES =====

async function expandirSucursales() {
  const selector = document.querySelector('.selector-sucursales');
  const btnElegir = document.querySelector('.btn-elegir-sucursal');
  
  // Ocultar botón "Elegir sucursal"
  btnElegir.style.display = 'none';
  
  // Expandir lista con animación
  selector.classList.add('expandido');
  
  // Cargar sucursales si aún no están cargadas
  if (!selector.dataset.cargado) {
    await cargarSucursalesCercanas();
    selector.dataset.cargado = 'true';
  }
}

// ===== CARGAR SUCURSALES DESDE API OCA =====

async function cargarSucursalesCercanas() {
  const listaSucursales = document.querySelector('.lista-sucursales');
  
  // Mostrar estado de carga
  listaSucursales.innerHTML = '<p style="color: #8a8a8a; font-size: 14px;">Buscando sucursales...</p>';
  
  try {
    // 1. Obtener CP del Paso 1 (guardado en la orden)
    const codigoPostal = obtenerCodigoPostalCliente();
    
    // 2. Llamar a API para obtener sucursales
    const sucursales = await obtenerSucursales(codigoPostal);
    
    // 3. Tomar las 3 más cercanas
    const tresMasCercanas = sucursales.slice(0, 3);
    
    // 4. Renderizar sucursales
    listaSucursales.innerHTML = tresMasCercanas.map((suc, index) => `
      <div class="sucursal-item">
        <input 
          type="radio" 
          name="sucursal" 
          id="sucursal-${suc.id}" 
          value="${suc.id}"
          ${index === 0 ? 'checked' : ''}
          data-nombre="${suc.nombre}"
          data-direccion="${suc.direccion}"
        />
        <label for="sucursal-${suc.id}">
          ${suc.nombre}, ${suc.direccion}, ${suc.localidad}
        </label>
      </div>
    `).join('');
    
    // 5. Habilitar botón de continuar (primera sucursal viene pre-seleccionada)
    habilitarBotonContinuar();
    
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
    listaSucursales.innerHTML = `
      <p style="color: #dc2626; font-size: 14px;">
        No se pudieron cargar las sucursales. 
        <button 
          onclick="cargarSucursalesCercanas()" 
          style="text-decoration: underline; background: none; border: none; color: #202020; cursor: pointer;"
        >
          Reintentar
        </button>
      </p>
    `;
  }
}

// ===== OBTENER CP DEL CLIENTE (desde Paso 1) =====

function obtenerCodigoPostalCliente() {
  // Opción A: Desde localStorage/sessionStorage
  const ordenActual = JSON.parse(sessionStorage.getItem('ordenActual'));
  return ordenActual?.direccion_envio?.codigo_postal;
  
  // Opción B: Desde input del paso anterior (si aún está en DOM)
  // return document.getElementById('codigo-postal')?.value;
}

// ===== LLAMADA A API OCA =====

async function obtenerSucursales(codigoPostal) {
  const response = await fetch('/api/oca/sucursales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codigoPostal: codigoPostal
    })
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener sucursales');
  }
  
  const data = await response.json();
  return data.sucursales;
}

// ===== HABILITAR BOTÓN CONTINUAR =====

function habilitarBotonContinuar() {
  const btnContinuar = document.querySelector('.btn-continuar-pago');
  if (btnContinuar) {
    btnContinuar.disabled = false;
  }
}
```

---

## 🔄 Flujo de Datos con API OCA

### **Diagrama de Flujo**

```
PASO 1: INFORMACIÓN
    │
    ├─ Usuario completa datos
    ├─ Email, Nombre, Apellido
    ├─ Dirección, Ciudad, Provincia
    └─ CÓDIGO POSTAL ◄─────────────────┐
         │                              │
         ▼                              │
    Datos guardados en Supabase        │
    (tabla: ordenes, direcciones_envio)│
         │                              │
         ▼                              │
PASO 2: ENVÍO                          │
    │                                   │
    ├─ Se muestra "Envío a domicilio"  │
    └─ Se muestra "Retiro en sucursal" │
         │                              │
         ▼                              │
    Usuario selecciona "Retiro en sucursal"
         │                              │
         ▼                              │
    Click en "Elegir sucursal >"       │
         │                              │
         ▼                              │
    JavaScript obtiene CP guardado ────┘
         │
         ▼
    Llamada a API OCA:
    GET /GetCentrosImposicionConServiciosByCP
    Parámetros: { CodigoPostal: 1215 }
         │
         ▼
    API retorna TODAS las sucursales del CP
         │
         ▼
    Frontend filtra:
    1. Solo sucursales con servicio de "Entrega"
    2. Calcula distancia desde dirección del cliente
    3. Ordena por distancia (más cerca primero)
    4. Toma las 3 primeras
         │
         ▼
    Renderiza las 3 sucursales
    Primera viene pre-seleccionada
         │
         ▼
    Usuario confirma o elige otra
         │
         ▼
    Datos de sucursal guardados en orden:
    - sucursal_retiro_id
    - sucursal_retiro_nombre
    - sucursal_retiro_direccion
         │
         ▼
    Botón "CONTINUAR A PAGAR" habilitado
```

### **Datos que se guardan en la orden**

```javascript
// Estructura de datos a guardar en Supabase

const datosEnvio = {
  orden_id: ordenActualId,
  metodo_envio: 'sucursal', // o 'domicilio'
  operativa_oca: 62342, // Puerta a Sucursal
  costo_envio_centavos: 550000, // $5,500.00
  plazo_entrega_min: 2,
  plazo_entrega_max: 4,
  
  // Solo si eligió sucursal:
  sucursal_retiro_id: 'CI001',
  sucursal_retiro_nombre: 'OCA Microcentro',
  sucursal_retiro_direccion: 'Florida 520, CABA',
  sucursal_retiro_cp: '1005',
  
  estado: 'envio_calculado'
};

// Actualizar orden
await supabase
  .from('ordenes')
  .update(datosEnvio)
  .eq('id', ordenActualId);
```

---

## ✅ Checklist de Implementación

### **Frontend Estático (hacer primero)**

- [ ] Crear estructura HTML de ambas opciones
- [ ] Aplicar estilos CSS coherentes con Paso 1
- [ ] Implementar radio buttons custom
- [ ] Crear animación de expansión suave
- [ ] Probar interacción de selección
- [ ] Verificar responsive en mobile
- [ ] Validar que no se pueda avanzar sin seleccionar

### **Integración con Backend (después)**

- [ ] Crear endpoint `/api/oca/sucursales`
- [ ] Implementar función `obtenerSucursales(cp)`
- [ ] Calcular distancias (o usar las de la API)
- [ ] Ordenar y filtrar las 3 más cercanas
- [ ] Renderizar dinámicamente en el DOM
- [ ] Guardar selección en Supabase
- [ ] Actualizar estado de orden a 'envio_calculado'
- [ ] Habilitar botón "CONTINUAR A PAGAR"

---

## 🚨 Notas Importantes

### **Sobre las distancias**

La API de OCA **NO devuelve distancias** en la respuesta. Tendrás que:

1. **Opción A (Simple)**: Mostrar las primeras 3 que retorna la API (OCA probablemente las ordena por cercanía)

2. **Opción B (Precisa)**: Calcular distancias manualmente usando:
   - Geocoding del CP del cliente → coordenadas
   - Geocoding de direcciones de sucursales → coordenadas  
   - Fórmula de Haversine para calcular distancia
   - Ordenar por distancia calculada

**Recomendación inicial**: Usar Opción A (más simple), mostrar las 3 primeras sin cálculo de distancia.

### **Sobre los precios**

Los precios `$8,000.00` y `$5,500.00` son **estimados**. Cuando implementes cotización real:

```javascript
// Al entrar al Paso 2, cotizar ambas opciones
async function cotizarOpciones() {
  const cp = obtenerCodigoPostalCliente();
  const productos = obtenerProductosOrden();
  
  const [precioDP, precioDS] = await Promise.all([
    cotizarEnvio(cp, productos, 'puerta-puerta'),
    cotizarEnvio(cp, productos, 'puerta-sucursal')
  ]);
  
  // Actualizar precios en el DOM
  document.querySelector('[data-tipo="domicilio"] .opcion-precio')
    .textContent = formatearPrecio(precioDP);
  
  document.querySelector('[data-tipo="sucursal"] .opcion-precio')
    .textContent = formatearPrecio(precioDS);
}
```

---

## 📱 Responsive - Mobile

En mobile, mantener la misma estructura pero ajustar:

```css
@media (max-width: 768px) {
  .opcion-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .opcion-precio {
    margin-top: 4px;
  }
  
  .sucursal-item {
    font-size: 13px;
    line-height: 1.4;
  }
}
```

---

**Versión**: 2.0  
**Última actualización**: 11 de Febrero 2026
