// =============================================================================
// CHECKOUT LOGIC - GÜIDO CAPUZZI
// =============================================================================
// Este archivo maneja la persistencia de datos del checkout en Supabase.
//
// FLUJO DEL CHECKOUT (Step 1 → "CONTINUAR A ENVÍOS"):
// 1. Validar formulario (email, nombre, dirección, CP, teléfono)
// 2. Guardar o actualizar cliente en Supabase → cliente_id
// 3. Guardar dirección de envío → direccion_id
// 4. Crear orden con estado "pendiente" → orden_id
// 5. Insertar items de la orden → items creados
// 6. Transicionar al Step 2 (Envíos)
//
// DEPENDENCIAS:
// - supabase-config.js debe estar cargado antes que este archivo
// - start.js debe exponer el carrito (cart) y datos del checkout
// =============================================================================

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
// GUARDAR CLIENTE
// =============================================================================

/**
 * Guarda o actualiza un cliente en Supabase.
 * 
 * CÓMO FUNCIONA:
 * 1. Busca si ya existe un cliente con ese email
 * 2. Si existe → actualiza sus datos (nombre, teléfono, etc.)
 * 3. Si no existe → crea uno nuevo
 * 4. Retorna el cliente_id (UUID)
 *
 * Esto se conoce como "upsert" (update + insert).
 * Usamos el email como identificador único del cliente.
 *
 * @param {object} datos - Datos del formulario validados
 * @returns {Promise<string>} cliente_id (UUID)
 */
async function guardarCliente(datos) {
    // Buscar si el cliente ya existe por email
    const { data: clienteExistente, error: errBuscar } = await window.supabaseClient
        .from('clientes')
        .select('id')
        .eq('email', datos.email)
        .limit(1)
        .maybeSingle();

    if (errBuscar) {
        console.error('[Checkout] Error buscando cliente:', errBuscar);
        throw new Error('Error al buscar cliente: ' + errBuscar.message);
    }

    if (clienteExistente) {
        // Cliente existe → actualizar datos
        const { data: updated, error: errUpdate } = await window.supabaseClient
            .from('clientes')
            .update({
                nombre: datos.nombre,
                apellido: datos.apellido,
                telefono: datos.telefono,
                newsletter: datos.newsletter,
                updated_at: new Date().toISOString()
            })
            .eq('id', clienteExistente.id)
            .select('id')
            .single();

        if (errUpdate) {
            console.error('[Checkout] Error actualizando cliente:', errUpdate);
            throw new Error('Error al actualizar cliente: ' + errUpdate.message);
        }

        console.log('[Checkout] Cliente actualizado:', updated.id);
        return updated.id;
    } else {
        // Cliente nuevo → insertar
        const { data: nuevo, error: errInsert } = await window.supabaseClient
            .from('clientes')
            .insert({
                email: datos.email,
                nombre: datos.nombre,
                apellido: datos.apellido,
                telefono: datos.telefono,
                newsletter: datos.newsletter
            })
            .select('id')
            .single();

        if (errInsert) {
            console.error('[Checkout] Error creando cliente:', errInsert);
            throw new Error('Error al crear cliente: ' + errInsert.message);
        }

        console.log('[Checkout] Cliente creado:', nuevo.id);
        return nuevo.id;
    }
}

// =============================================================================
// GUARDAR DIRECCIÓN DE ENVÍO
// =============================================================================

/**
 * Guarda la dirección de envío del cliente en Supabase.
 *
 * CÓMO FUNCIONA:
 * Inserta una nueva dirección asociada al cliente.
 * Un cliente puede tener múltiples direcciones guardadas.
 *
 * @param {string} clienteId - UUID del cliente
 * @param {object} datos - Datos del formulario validados
 * @returns {Promise<string>} direccion_id (UUID)
 */
async function guardarDireccion(clienteId, datos) {
    const direccionPayload = {
        cliente_id: clienteId,
        direccion: datos.direccion + (datos.departamento ? `, ${datos.departamento}` : ''),
        departamento: datos.departamento || null,
        ciudad: datos.ciudad,
        provincia: datos.provincia,
        codigo_postal: datos.cp,
        es_predeterminada: true
    };

    // Check if we already saved a dirección in this session (re-entry case)
    const existingDireccionId = sessionStorage.getItem('checkout_direccion_id');

    if (existingDireccionId) {
        // Update existing dirección
        const { data: updated, error } = await window.supabaseClient
            .from('direcciones_envio')
            .update(direccionPayload)
            .eq('id', existingDireccionId)
            .select('id')
            .single();

        if (error) {
            console.error('[Checkout] Error actualizando dirección:', error);
            throw new Error('Error al actualizar dirección: ' + error.message);
        }

        console.log('[Checkout] Dirección actualizada:', updated.id);
        return updated.id;
    } else {
        // Insert new dirección
        const { data: direccion, error } = await window.supabaseClient
            .from('direcciones_envio')
            .insert(direccionPayload)
            .select('id')
            .single();

        if (error) {
            console.error('[Checkout] Error guardando dirección:', error);
            throw new Error('Error al guardar dirección: ' + error.message);
        }

        // Store for re-entry
        sessionStorage.setItem('checkout_direccion_id', direccion.id);
        console.log('[Checkout] Dirección guardada:', direccion.id);
        return direccion.id;
    }
}

// =============================================================================
// CREAR ORDEN PENDIENTE
// =============================================================================

/**
 * Crea una orden con estado "pendiente" en Supabase.
 *
 * CÓMO FUNCIONA:
 * 1. Calcula subtotal y total desde los items del carrito
 * 2. Inserta la orden en la tabla `ordenes`
 * 3. Inserta cada item del carrito en la tabla `items_orden`
 *    (con un "snapshot" del producto — precio, nombre, color, talle)
 * 4. La orden queda en estado "pendiente" esperando el paso de envío
 *
 * SNAPSHOT: Guardamos los datos del producto al momento de la compra.
 * Si mañana cambia el precio, la orden mantiene el precio original.
 *
 * @param {string} clienteId - UUID del cliente
 * @param {string} direccionId - UUID de la dirección de envío
 * @param {Array} cartItems - Array de items del carrito desde start.js
 * @returns {Promise<string>} orden_id (UUID)
 */
async function crearOrdenPendiente(clienteId, direccionId, cartItems) {
    // Calcular totales (todo en centavos)
    const subtotalCentavos = cartItems.reduce((acc, item) => {
        return acc + (item.priceValue * 100 * item.qty);
    }, 0);

    // Insertar la orden
    const { data: orden, error: errOrden } = await window.supabaseClient
        .from('ordenes')
        .insert({
            cliente_id: clienteId,
            direccion_envio_id: direccionId,
            estado: 'pendiente',
            subtotal_centavos: subtotalCentavos,
            costo_envio_centavos: 0,  // Se calculará en el paso de envío
            descuento_centavos: 0,
            total_centavos: subtotalCentavos  // Por ahora = subtotal (sin envío)
        })
        .select('id, numero_orden')
        .single();

    if (errOrden) {
        console.error('[Checkout] Error creando orden:', errOrden);
        throw new Error('Error al crear orden: ' + errOrden.message);
    }

    console.log('[Checkout] Orden creada:', orden.id, '| Nº:', orden.numero_orden);

    // Insertar items de la orden (snapshot del producto)
    const itemsParaInsertar = cartItems.map(item => ({
        orden_id: orden.id,
        // variante_id se buscaría si tenemos el mapeo, por ahora null
        variante_id: null,
        nombre_producto: item.name,
        color: item.color || '',
        talle: item.size || '',
        precio_unitario_centavos: item.priceValue * 100,
        cantidad: item.qty,
        subtotal_centavos: item.priceValue * 100 * item.qty
    }));

    const { error: errItems } = await window.supabaseClient
        .from('items_orden')
        .insert(itemsParaInsertar);

    if (errItems) {
        console.error('[Checkout] Error insertando items:', errItems);
        throw new Error('Error al guardar items de la orden: ' + errItems.message);
    }

    console.log('[Checkout] Items de orden insertados:', itemsParaInsertar.length);

    return {
        ordenId: orden.id,
        numeroOrden: orden.numero_orden
    };
}

// =============================================================================
// FLUJO PRINCIPAL: PROCESAR CHECKOUT STEP 1
// =============================================================================

/**
 * Función principal que ejecuta todo el flujo del Step 1.
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

    try {
        // Check if we already have an order from a previous pass (re-entry case)
        const existingOrdenId = sessionStorage.getItem('checkout_orden_id');
        const existingNumero = sessionStorage.getItem('checkout_numero_orden');

        // PASO 2: Guardar/actualizar cliente
        const clienteId = await guardarCliente(validacion.datos);

        // PASO 3: Guardar/actualizar dirección
        const direccionId = await guardarDireccion(clienteId, validacion.datos);

        let ordenId, numeroOrden;

        if (existingOrdenId) {
            // Re-entry: update existing order's dirección reference
            const { error: errUpdate } = await window.supabaseClient
                .from('ordenes')
                .update({ direccion_envio_id: direccionId })
                .eq('id', existingOrdenId);

            if (errUpdate) {
                console.error('[Checkout] Error actualizando orden:', errUpdate);
                throw new Error('Error al actualizar orden: ' + errUpdate.message);
            }

            ordenId = existingOrdenId;
            numeroOrden = existingNumero;
            console.log('[Checkout] ✅ Orden existente actualizada:', numeroOrden);
        } else {
            // First pass: create new order
            const result = await crearOrdenPendiente(clienteId, direccionId, cartItems);
            ordenId = result.ordenId;
            numeroOrden = result.numeroOrden;

            // Store for re-entry
            sessionStorage.setItem('checkout_orden_id', ordenId);
            sessionStorage.setItem('checkout_numero_orden', numeroOrden);
        }

        console.log('[Checkout] ✅ Step 1 completado exitosamente');
        console.log('[Checkout] Orden:', numeroOrden, '| ID:', ordenId);

        return {
            success: true,
            ordenId,
            numeroOrden,
            clienteId,
            direccionId,
            errors: []
        };

    } catch (error) {
        console.error('[Checkout] ❌ Error en Step 1:', error);
        return {
            success: false,
            errors: [error.message || 'Error inesperado al procesar tu orden']
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
window.procesarCheckoutStep1 = procesarCheckoutStep1;
window.validarCheckoutStep1 = validarCheckoutStep1;
window.mostrarErroresCheckout = mostrarErroresCheckout;
window.limpiarErroresCheckout = limpiarErroresCheckout;
window.setBotonCargando = setBotonCargando;
