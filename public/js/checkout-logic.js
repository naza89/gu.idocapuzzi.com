// =============================================================================
// CHECKOUT LOGIC - GÜIDO CAPUZZI
// =============================================================================
// Este archivo maneja la validación del Step 1 y dispara la creación de la orden.
//
// FLUJO DEL CHECKOUT (Step 1 → "CONTINUAR A ENVÍOS"):
// 1. Validar formulario (email, nombre, dirección, CP, teléfono)
// 2. POST /api/checkout/crear-orden (SERVER-SIDE, service_role):
//    guarda/actualiza cliente + dirección, crea la orden con PRECIOS DEL
//    CATÁLOGO (no del browser) e inserta los items.
// 3. Transicionar al Step 2 (Envíos)
//
// ⚠️ SEGURIDAD: la orden ya NO se inserta desde el browser con la anon key.
//   Los precios se resuelven server-side contra `productos.precio_centavos`,
//   así el cliente no puede fabricar una orden con montos arbitrarios. El RLS
//   (migración 17) le quita a la anon key el permiso de escribir en ordenes.
// =============================================================================

// =============================================================================
// DISPONIBILIDAD DEL CLIENTE SUPABASE
// =============================================================================
// El resto de la página (stock, auth) sigue usando window.supabaseClient. Estas
// dos funciones las consume start.js para avisar si la librería no cargó.

const MSG_SIN_CONEXION_SUPABASE =
    'No pudimos conectarnos con nuestro sistema. Revisá tu conexión, desactivá el bloqueador de anuncios si tenés uno, y recargá la página.';

/**
 * @returns {boolean} true si se puede operar contra Supabase desde el browser.
 */
function supabaseDisponible() {
    return !!window.supabaseClient && !window.supabaseUnavailable;
}

/**
 * Avisa al entrar al checkout si el cliente de Supabase no está disponible.
 * Se llama desde enableCheckoutState() en start.js.
 *
 * @returns {boolean} true si el checkout es operable, false si se mostró el aviso.
 */
function avisarCheckoutSinConexion() {
    if (supabaseDisponible()) return true;
    console.error('[Checkout] Cliente de Supabase no disponible');
    mostrarErroresCheckout([MSG_SIN_CONEXION_SUPABASE]);
    return false;
}

// =============================================================================
// VALIDACIÓN DE FORMULARIO
// =============================================================================

/**
 * Valida todos los campos requeridos del checkout Step 1.
 * Retorna un objeto con { valid: boolean, errors: string[], datos: object }
 */
function validarCheckoutStep1() {
    const campos = {
        email: document.getElementById('checkout-email'),
        nombre: document.getElementById('checkout-nombre'),
        apellido: document.getElementById('checkout-apellido'),
        direccion: document.getElementById('checkout-direccion'),
        departamento: document.getElementById('checkout-departamento'),
        ciudad: document.getElementById('checkout-ciudad'),
        provincia: document.getElementById('checkout-provincia'),
        cp: document.getElementById('checkout-cp'),
        telefono: document.getElementById('checkout-telefono'),
        newsletter: document.getElementById('checkout-newsletter'),
    };

    const errors = [];

    // Email requerido y formato válido
    const email = campos.email?.value?.trim() || '';
    if (!email) {
        errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('El formato del email no es válido');
    }

    // Nombre y apellido requeridos
    const nombre = campos.nombre?.value?.trim() || '';
    const apellido = campos.apellido?.value?.trim() || '';
    if (!nombre) errors.push('El nombre es requerido');
    if (!apellido) errors.push('El apellido es requerido');

    // Dirección requerida
    const direccion = campos.direccion?.value?.trim() || '';
    if (!direccion) errors.push('La dirección es requerida');

    // Ciudad, provincia y CP requeridos
    const ciudad = campos.ciudad?.value?.trim() || '';
    const provincia = campos.provincia?.value?.trim() || '';
    const cp = campos.cp?.value?.trim() || '';
    if (!ciudad) errors.push('La ciudad es requerida');
    if (!provincia) errors.push('La provincia es requerida');
    if (!cp) errors.push('El código postal es requerido');

    // Teléfono requerido
    const telefono = campos.telefono?.value?.trim() || '';
    if (!telefono) errors.push('El teléfono es requerido');

    return {
        valid: errors.length === 0,
        errors,
        datos: {
            email,
            nombre,
            apellido,
            direccion,
            departamento: campos.departamento?.value?.trim() || '',
            ciudad,
            provincia,
            cp,
            telefono,
            newsletter: campos.newsletter?.checked || false
        }
    };
}

// =============================================================================
// FLUJO PRINCIPAL: PROCESAR CHECKOUT STEP 1
// =============================================================================

/**
 * Ejecuta el Step 1: valida y crea la orden server-side.
 * Se llama cuando el usuario hace click en "CONTINUAR A ENVÍOS".
 *
 * @param {Array} cartItems - El array `cart` de start.js
 * @returns {Promise<object>} { success, ordenId, numeroOrden, errors }
 */
async function procesarCheckoutStep1(cartItems) {
    console.log('[Checkout] Iniciando procesamiento Step 1...');

    // PASO 1: Validar formulario
    const validacion = validarCheckoutStep1();
    if (!validacion.valid) {
        console.warn('[Checkout] Validación fallida:', validacion.errors);
        return { success: false, errors: validacion.errors };
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return { success: false, errors: ['Tu carrito está vacío'] };
    }

    try {
        // Ids de una pasada anterior (re-entrada), si existen
        const existingOrdenId = sessionStorage.getItem('checkout_orden_id');
        const existingDireccionId = sessionStorage.getItem('checkout_direccion_id');

        // Sólo mandamos identificadores del item — el precio lo pone el servidor
        const items = cartItems.map(function (item) {
            return {
                sku: item.sku || null,
                name: item.name || '',
                colorway: item.colorway || '',
                size: item.size || '',
                color: item.color || '',
                qty: item.qty || 1,
            };
        });

        // PASO 2: Crear/actualizar la orden server-side
        const res = await fetch('/api/checkout/crear-orden', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                datos: validacion.datos,
                items,
                existingOrdenId: existingOrdenId || null,
                existingDireccionId: existingDireccionId || null,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error('[Checkout] ❌ Error del servidor al crear la orden:', data);
            return {
                success: false,
                errors: [data.error || 'No pudimos procesar tu orden. Intentá de nuevo.'],
            };
        }

        // Guardar para re-entrada
        sessionStorage.setItem('checkout_orden_id', data.ordenId);
        sessionStorage.setItem('checkout_numero_orden', data.numeroOrden);
        if (data.direccionId) sessionStorage.setItem('checkout_direccion_id', data.direccionId);

        console.log('[Checkout] ✅ Step 1 completado. Orden:', data.numeroOrden, '| ID:', data.ordenId);

        return {
            success: true,
            ordenId: data.ordenId,
            numeroOrden: data.numeroOrden,
            clienteId: data.clienteId,
            direccionId: data.direccionId,
            errors: []
        };

    } catch (error) {
        console.error('[Checkout] ❌ Error en Step 1:', error);
        return {
            success: false,
            errors: ['Error de conexión al procesar tu orden. Revisá tu conexión e intentá de nuevo.']
        };
    }
}

// =============================================================================
// UI HELPERS - FEEDBACK VISUAL
// =============================================================================

/**
 * Muestra errores de validación al usuario.
 * Resalta los campos con error y muestra un mensaje.
 */
function mostrarErroresCheckout(errors) {
    // Limpiar errores anteriores
    document.querySelectorAll('.checkout-input.error').forEach(el => {
        el.classList.remove('error');
    });

    // Resaltar campos con error
    const campoMap = {
        'email': 'checkout-email',
        'nombre': 'checkout-nombre',
        'apellido': 'checkout-apellido',
        'dirección': 'checkout-direccion',
        'ciudad': 'checkout-ciudad',
        'provincia': 'checkout-provincia',
        'código postal': 'checkout-cp',
        'teléfono': 'checkout-telefono'
    };

    errors.forEach(err => {
        const errLower = err.toLowerCase();
        for (const [keyword, fieldId] of Object.entries(campoMap)) {
            if (errLower.includes(keyword)) {
                const field = document.getElementById(fieldId);
                if (field) field.classList.add('error');
            }
        }
    });

    // Mostrar mensaje de error (primer error)
    const firstError = errors[0] || 'Por favor completá todos los campos requeridos';

    // Buscar o crear el contenedor de error
    let errorContainer = document.getElementById('checkout-error-msg');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'checkout-error-msg';
        errorContainer.className = 'checkout-error-message';
        const actionsDiv = document.querySelector('.checkout-actions');
        if (actionsDiv) {
            actionsDiv.insertBefore(errorContainer, actionsDiv.firstChild);
        }
    }

    errorContainer.textContent = firstError;
    errorContainer.style.display = 'block';
}

/**
 * Limpia los errores visuales del checkout.
 */
function limpiarErroresCheckout() {
    document.querySelectorAll('.checkout-input.error').forEach(el => {
        el.classList.remove('error');
    });
    const errorContainer = document.getElementById('checkout-error-msg');
    if (errorContainer) errorContainer.style.display = 'none';
}

/**
 * Muestra estado de cargando en el botón.
 */
function setBotonCargando(cargando) {
    const btn = document.getElementById('checkout-continue-btn');
    if (!btn) return;

    if (cargando) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'PROCESANDO...';
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'wait';
    } else {
        btn.textContent = btn.dataset.originalText || 'CONTINUAR A ENVÍOS';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

// Exponer funciones globalmente
window.supabaseDisponible = supabaseDisponible;
window.avisarCheckoutSinConexion = avisarCheckoutSinConexion;
window.procesarCheckoutStep1 = procesarCheckoutStep1;
window.validarCheckoutStep1 = validarCheckoutStep1;
window.mostrarErroresCheckout = mostrarErroresCheckout;
window.limpiarErroresCheckout = limpiarErroresCheckout;
window.setBotonCargando = setBotonCargando;
