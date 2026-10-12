/**
 * checkout-payment.js
 * GÜIDO CAPUZZI — Step 3: PAGO
 *
 * Tres métodos:
 *   · TRANSFERENCIA → POST /api/checkout/transferencia. El servidor aplica el
 *     15% sobre los productos, deja la orden en `esperando_transferencia` y
 *     devuelve los datos bancarios. Vamos directo a /checkout/confirmacion,
 *     que muestra a dónde transferir. El equipo confirma desde WIDO.
 *   · TARJETA y MODO → checkout hosted de NAVE (redirección), como siempre.
 *     NAVE ofrece los dos medios en su página: la elección acá sólo cambia lo
 *     que le contamos al cliente antes de mandarlo.
 *
 * Flujo:
 *   1. start.js (Step 2) persiste el envío y llama a mostrarCheckoutStep3()
 *   2. El cliente elige método y aprieta FINALIZAR COMPRA
 *   3. Transferencia → confirmación propia · Tarjeta/MODO → NAVE
 *
 * El descuento que se muestra acá es INFORMATIVO. El que vale es el que
 * calcula el servidor (src/lib/pagos.ts). Si cambia el porcentaje, cambia
 * DESCUENTO_TRANSFERENCIA_PCT acá, en start.js y en src/lib/pagos.ts
 * (tests/pago-transferencia.test.ts lo verifica).
 *
 * Expone al scope global (para start.js):
 *   - window.mostrarCheckoutStep3(params)
 *   - window.redirigirPagoNave(params)
 *   - window.checkoutCurrentStep  (sincronizado)
 */

(function () {
    'use strict';

    const DESCUENTO_TRANSFERENCIA_PCT = 15;
    const METODO_TRANSFERENCIA = 'transferencia';

    // ─────────────────────────────────────────────
    // ESTADO INTERNO
    // ─────────────────────────────────────────────
    let _ordenId = null;
    let _subtotal = 0;      // pesos, productos
    let _envio = 0;         // pesos
    let _cartItems = [];
    let _metodo = null;     // 'transferencia' | 'tarjeta' | 'modo'
    let _transferenciaHabilitada = false;
    let _procesando = false;

    // ─────────────────────────────────────────────
    // HELPERS DE MONTOS
    // ─────────────────────────────────────────────
    function _descuento(subtotal) {
        // Mismo redondeo que el servidor: a pesos enteros.
        return Math.round(subtotal * DESCUENTO_TRANSFERENCIA_PCT / 100);
    }

    function _formatear(pesos) {
        // Mismo formato que el resto del resumen del checkout: "290.000,00"
        return '$' + Number(pesos).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function _formatearCorto(pesos) {
        return '$' + Math.round(Number(pesos)).toLocaleString('es-AR');
    }

    // ─────────────────────────────────────────────
    // 1. MOSTRAR STEP 3
    // ─────────────────────────────────────────────
    async function mostrarCheckoutStep3({ email, ubicacion, metodoEnvio, ordenId, subtotalARS, envioARS, cartItems }) {
        _ordenId = ordenId;
        _subtotal = Number(subtotalARS) || 0;
        _envio = Number(envioARS) || 0;
        _cartItems = cartItems || [];
        window.checkoutCurrentStep = 3;

        const stepEnvio = document.getElementById('checkout-step-envio');
        const stepPago = document.getElementById('checkout-step-pago');
        if (stepEnvio) stepEnvio.style.display = 'none';
        if (stepPago) stepPago.style.display = 'block';

        _setTextSafe('resumen-pago-email', email);
        _setTextSafe('resumen-pago-ubicacion', ubicacion);
        _setTextSafe('resumen-pago-envio', metodoEnvio);

        document.querySelectorAll('.breadcrumb-step').forEach((s, i) => s.classList.toggle('active', i === 2));

        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        if (continueBtn) continueBtn.style.display = 'none';
        if (payBtn) {
            payBtn.style.display = '';
            _resetPayBtn();
        }

        const backLink = document.getElementById('checkout-back-link');
        if (backLink) {
            backLink.textContent = '‹ Volver a Envío';
            backLink.style.display = '';
        }

        _ocultarError();

        // Textos con los montos de esta compra
        const total = _subtotal + _envio;
        const totalTransferencia = total - _descuento(_subtotal);
        _setTextSafe(
            'pago-transferencia-detalle',
            `Pagás ${_formatearCorto(totalTransferencia)} en lugar de ${_formatearCorto(total)}: ${DESCUENTO_TRANSFERENCIA_PCT}% de descuento sobre los productos.`
        );
        _setTextSafe(
            'pago-tarjeta-detalle',
            `Hasta 6 cuotas sin interés de ${_formatearCorto(total / 6)}.`
        );

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ¿Hay datos bancarios? Sin ellos no se ofrece la transferencia.
        _transferenciaHabilitada = false;
        try {
            const res = await fetch('/api/checkout/transferencia');
            if (res.ok) {
                const data = await res.json();
                _transferenciaHabilitada = !!data.habilitada;
            }
        } catch (err) {
            console.warn('[Checkout] No se pudo consultar la transferencia:', err);
        }

        const tabTransferencia = document.getElementById('pago-tab-transferencia');
        if (tabTransferencia) tabTransferencia.style.display = _transferenciaHabilitada ? '' : 'none';

        // La promo es la transferencia: si está disponible, arranca elegida.
        _seleccionarMetodo(_transferenciaHabilitada ? METODO_TRANSFERENCIA : 'tarjeta');

        console.log('[Checkout] → Step 3: Pago');
    }

    // ─────────────────────────────────────────────
    // 2. SELECCIÓN DE MÉTODO + RESUMEN
    // ─────────────────────────────────────────────
    function _seleccionarMetodo(metodo) {
        _metodo = metodo;
        document.querySelectorAll('#checkout-step-pago .pago-metodo-tab').forEach(tab => {
            tab.classList.toggle('pago-tab-activo', tab.dataset.metodo === metodo);
        });
        _actualizarResumen();
        _ocultarError();
    }

    /** Muestra u oculta la fila de descuento y recalcula el TOTAL del sidebar. */
    function _actualizarResumen(forzarSinDescuento) {
        const conDescuento = !forzarSinDescuento && _metodo === METODO_TRANSFERENCIA;
        const descuento = conDescuento ? _descuento(_subtotal) : 0;
        const total = _subtotal + _envio - descuento;

        const fila = document.getElementById('checkout-descuento-row');
        if (fila) fila.style.display = conDescuento ? '' : 'none';
        _setTextSafe('checkout-descuento', '−' + _formatear(descuento));
        _setTextSafe('checkout-descuento-label', `Descuento transferencia (${DESCUENTO_TRANSFERENCIA_PCT}%)`);

        _setTextSafe('checkout-total', _formatear(total));
        _setTextSafe('checkout-summary-total-preview', _formatear(total));
    }

    // ─────────────────────────────────────────────
    // 3. FINALIZAR COMPRA
    // ─────────────────────────────────────────────
    async function _finalizarCompra() {
        if (_procesando || !_ordenId) return;
        _procesando = true;
        _ocultarError();
        _setPayBtnCargando(true);

        // Meta Pixel — eligió cómo pagar (paso del embudo entre checkout y compra)
        if (window.fbq) {
            const valor = _subtotal + _envio - (_metodo === METODO_TRANSFERENCIA ? _descuento(_subtotal) : 0);
            window.fbq('track', 'AddPaymentInfo', { value: valor, currency: 'ARS' });
        }

        try {
            if (_metodo === METODO_TRANSFERENCIA) {
                await _pagarConTransferencia();
            } else {
                await window.redirigirPagoNave({
                    ordenId: _ordenId,
                    totalARS: _subtotal + _envio,
                    cartItems: _cartItems,
                });
            }
        } catch (err) {
            console.error('[Checkout] ❌ Error al finalizar la compra:', err);
            _mostrarError(err && err.mensajeCliente
                ? err.mensajeCliente
                : 'No pudimos procesar el pago. Intentá nuevamente.');
            _setPayBtnCargando(false);
            _procesando = false;
        }
    }

    async function _pagarConTransferencia() {
        const res = await fetch('/api/checkout/transferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordenId: _ordenId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.error || `HTTP ${res.status}`);
            err.mensajeCliente = data.error || 'No pudimos reservar tu pedido. Intentá nuevamente.';
            throw err;
        }

        console.log('[Checkout] ✅ Orden', data.numeroOrden, 'reservada por transferencia');
        if (data.numeroOrden != null) sessionStorage.setItem('checkout_numero_orden', data.numeroOrden);

        // Misma pantalla de confirmación que una compra con NAVE: recarga limpia,
        // el carrito en memoria se vacía y los datos salen de la API (con el
        // descuento y los datos bancarios autoritativos).
        window.location.href = '/checkout/confirmacion?orden=' + encodeURIComponent(_ordenId);
    }

    // ─────────────────────────────────────────────
    // 4. VOLVER ATRÁS (Step 3 → Step 2)
    // ─────────────────────────────────────────────
    function _volverAStep2() {
        const stepPago = document.getElementById('checkout-step-pago');
        const stepEnvio = document.getElementById('checkout-step-envio');
        if (stepPago) stepPago.style.display = 'none';
        if (stepEnvio) stepEnvio.style.display = 'block';

        window.checkoutCurrentStep = 2;

        // El descuento sólo existe con transferencia elegida en este paso.
        _actualizarResumen(/* forzarSinDescuento */ true);

        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        const backLink = document.getElementById('checkout-back-link');

        if (continueBtn) {
            continueBtn.style.display = '';
            continueBtn.textContent = 'CONTINUAR AL PAGO';
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
        }
        if (payBtn) payBtn.style.display = 'none';
        if (backLink) backLink.textContent = '‹ Volver a Información';

        document.querySelectorAll('.breadcrumb-step').forEach((s, i) => s.classList.toggle('active', i === 1));

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ─────────────────────────────────────────────
    // 5. HELPERS UI
    // ─────────────────────────────────────────────
    function _resetPayBtn() {
        const payBtn = document.getElementById('checkout-pay-btn');
        if (!payBtn) return;
        payBtn.textContent = 'FINALIZAR COMPRA';
        payBtn.disabled = false;
        payBtn.style.opacity = '1';
        payBtn.style.cursor = 'pointer';
    }

    function _setPayBtnCargando(cargando) {
        const payBtn = document.getElementById('checkout-pay-btn');
        if (!payBtn) return;
        if (!cargando) return _resetPayBtn();
        payBtn.textContent = _metodo === METODO_TRANSFERENCIA ? 'RESERVANDO...' : 'REDIRIGIENDO...';
        payBtn.disabled = true;
        payBtn.style.opacity = '0.6';
        payBtn.style.cursor = 'wait';
    }

    function _mostrarError(msg) {
        const banner = document.getElementById('pago-error-banner');
        const texto = document.getElementById('pago-error-msg');
        if (texto) texto.textContent = msg;
        if (banner) {
            banner.style.display = 'flex';
            banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function _ocultarError() {
        const banner = document.getElementById('pago-error-banner');
        if (banner) banner.style.display = 'none';
    }

    function _setTextSafe(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // ─────────────────────────────────────────────
    // 6. EVENT LISTENERS
    // ─────────────────────────────────────────────
    //
    // ⚠️ start.js escucha en `document` el click del back link y de TODOS los
    // `.resumen-cambiar`, y siempre vuelve al Step 1. Acá los listeners van en el
    // elemento, que corre antes:
    //   · "Volver a Envío" y "Cambiar" método → Step 2, y stopPropagation para
    //     que start.js no lo mande al Step 1.
    //   · "Cambiar" contacto/ubicación → ocultamos el Step 3 y dejamos pasar el
    //     click: start.js hace la vuelta al Step 1 (que no conoce el Step 3).
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('checkout-back-link')?.addEventListener('click', function (e) {
            if (window.checkoutCurrentStep === 3) {
                e.preventDefault();
                e.stopPropagation();
                _volverAStep2();
            }
        });

        document.querySelectorAll('#checkout-step-pago .pago-metodo-header').forEach(header => {
            header.addEventListener('click', function () {
                if (_procesando) return;
                const tab = header.closest('.pago-metodo-tab');
                if (tab && tab.dataset.metodo) _seleccionarMetodo(tab.dataset.metodo);
            });
        });

        document.getElementById('checkout-pay-btn')?.addEventListener('click', function (e) {
            e.preventDefault();
            _finalizarCompra();
        });

        ['resumen-pago-cambiar-contacto', 'resumen-pago-cambiar-ubicacion'].forEach(function (id) {
            document.getElementById(id)?.addEventListener('click', function (e) {
                e.preventDefault();
                _volverAStep2(); // oculta el Step 3; start.js sigue hasta el Step 1
            });
        });

        document.getElementById('resumen-pago-cambiar-envio')?.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            _volverAStep2();
        });
    });

    // ─────────────────────────────────────────────
    // 7. EXPORTS AL SCOPE GLOBAL
    // ─────────────────────────────────────────────
    window.mostrarCheckoutStep3 = mostrarCheckoutStep3;
    window.checkoutCurrentStep = window.checkoutCurrentStep || 1;

    // Redirección al checkout hosted de NAVE (tarjeta y MODO).
    window.redirigirPagoNave = async function ({ ordenId, totalARS, cartItems }) {
        const successUrl = window.location.origin + '/checkout/confirmacion?orden=' + encodeURIComponent(ordenId);
        try {
            const response = await fetch('/api/nave/crear-pago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    external_payment_id: ordenId,
                    total_ars: totalARS,
                    cart_items: cartItems.map(function (item) {
                        return { name: item.name, quantity: item.qty || 1, price: item.priceValue || 0 };
                    }),
                    success_url: successUrl
                })
            });
            if (!response.ok) throw new Error(`Backend error: ${response.status}`);
            const data = await response.json();
            if (!data.checkout_url) throw new Error('NAVE no devolvió una URL de pago');
            console.log('[NAVE] ✅ Redirigiendo a checkout NAVE...');
            window.location.href = data.checkout_url;
        } catch (err) {
            console.error('[NAVE] ❌ Error al crear intención de pago:', err);
            throw err; // re-lanzar para que el llamador pueda resetear el botón
        }
    };

})();
