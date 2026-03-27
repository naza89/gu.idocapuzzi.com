/**
 * checkout-payment.js
 * GÜIDO CAPUZZI — Step 3: Pago via NAVE (redirección)
 *
 * Flujo:
 *   1. mostrarCheckoutStep3() se llama desde start.js al confirmar el envío
 *   2. Se llama al backend (/api/nave/crear-pago) para crear la intención de pago
 *   3. Se redirige al usuario a checkout_url (página hosted de NAVE)
 *   4. NAVE redirige de vuelta a /checkout/confirmacion?orden=<id> al finalizar
 *
 * Expone al scope global (para start.js):
 *   - window.mostrarCheckoutStep3(params)
 *   - window.checkoutCurrentStep  (sincronizado)
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // ESTADO INTERNO
    // ─────────────────────────────────────────────
    let _ordenId = null;

    // ─────────────────────────────────────────────
    // 1. MOSTRAR STEP 3
    //    Llamado desde start.js cuando el usuario confirma envío
    // ─────────────────────────────────────────────
    async function mostrarCheckoutStep3({ email, ubicacion, metodoEnvio, ordenId, totalARS, cartItems }) {
        _ordenId = ordenId;
        window.checkoutCurrentStep = 3;

        // Ocultar Step 2, mostrar Step 3
        const stepEnvio = document.getElementById('checkout-step-envio');
        const stepPago = document.getElementById('checkout-step-pago');
        if (stepEnvio) stepEnvio.style.display = 'none';
        if (stepPago) stepPago.style.display = 'block';

        // Poblar resumen
        _setTextSafe('resumen-pago-email', email);
        _setTextSafe('resumen-pago-ubicacion', ubicacion);
        _setTextSafe('resumen-pago-envio', metodoEnvio);

        // Breadcrumb → "Pago" activo
        document.querySelectorAll('.breadcrumb-step').forEach((s, i) => s.classList.toggle('active', i === 2));

        // Ocultar botones y tabs — la redirección es automática
        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        if (continueBtn) continueBtn.style.display = 'none';
        if (payBtn) payBtn.style.display = 'none';

        const tabsContainer = document.querySelector('.pago-tabs');
        if (tabsContainer) tabsContainer.style.display = 'none';

        const backLink = document.getElementById('checkout-back-link');
        if (backLink) {
            backLink.textContent = '‹ Volver a Envío';
            backLink.style.display = '';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Crear intención de pago y redirigir
        await _crearIntencionDePago({ ordenId, totalARS, cartItems });

        console.log('[Checkout] → Step 3: Pago (redirect)');
    }

    // ─────────────────────────────────────────────
    // 2. CREAR INTENCIÓN DE PAGO Y REDIRIGIR
    // ─────────────────────────────────────────────
    async function _crearIntencionDePago({ ordenId, totalARS, cartItems }) {
        try {
            _mostrarLoadingSDK(true);
            _ocultarError();

            // URL de retorno después del pago (NAVE redirige aquí automáticamente)
            const successUrl = window.location.origin + '/checkout/confirmacion?orden=' + encodeURIComponent(ordenId);

            const response = await fetch('/api/nave/crear-pago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    external_payment_id: ordenId,
                    total_ars: totalARS,
                    cart_items: cartItems.map(function (item) {
                        return {
                            name: item.name,
                            quantity: item.qty || 1,
                            price: item.priceValue || 0
                        };
                    }),
                    success_url: successUrl
                })
            });

            if (!response.ok) throw new Error(`Backend error: ${response.status}`);

            const data = await response.json();

            if (!data.checkout_url) {
                throw new Error('NAVE no devolvió una URL de pago');
            }

            console.log('[NAVE] ✅ Intención de pago creada, redirigiendo a NAVE...');

            // Redirigir al checkout de NAVE
            window.location.href = data.checkout_url;

        } catch (err) {
            console.error('[NAVE] ❌ Error al crear intención de pago:', err);
            _mostrarLoadingSDK(false);
            _mostrarError('No se pudo inicializar el proceso de pago. Intentá nuevamente.');
        }
    }

    // ─────────────────────────────────────────────
    // 3. VOLVER ATRÁS (Step 3 → Step 2)
    // ─────────────────────────────────────────────
    function _volverAStep2() {
        const stepPago = document.getElementById('checkout-step-pago');
        const stepEnvio = document.getElementById('checkout-step-envio');
        if (stepPago) stepPago.style.display = 'none';
        if (stepEnvio) stepEnvio.style.display = 'block';

        window.checkoutCurrentStep = 2;

        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        const backLink = document.getElementById('checkout-back-link');

        if (continueBtn) { continueBtn.style.display = ''; continueBtn.textContent = 'CONTINUAR AL PAGO'; }
        if (payBtn) payBtn.style.display = 'none';
        if (backLink) backLink.textContent = '‹ Volver a Información';

        const tabsContainer = document.querySelector('.pago-tabs');
        if (tabsContainer) tabsContainer.style.display = '';

        document.querySelectorAll('.breadcrumb-step').forEach((s, i) => s.classList.toggle('active', i === 1));

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ─────────────────────────────────────────────
    // 4. HELPERS UI
    // ─────────────────────────────────────────────
    function _mostrarLoadingSDK(show) {
        const el = document.getElementById('nave-sdk-loading');
        if (el) el.style.display = show ? 'flex' : 'none';
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
    // 5. EVENT LISTENERS
    // ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        // Back link: si estamos en Step 3, volver al Step 2
        document.getElementById('checkout-back-link')?.addEventListener('click', function (e) {
            if (window.checkoutCurrentStep === 3) {
                e.preventDefault();
                _volverAStep2();
            }
        });

        // Cambiar desde el resumen del Step 3
        document.getElementById('resumen-pago-cambiar-contacto')?.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof window.volverACheckoutStep1 === 'function') window.volverACheckoutStep1();
        });

        document.getElementById('resumen-pago-cambiar-ubicacion')?.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof window.volverACheckoutStep1 === 'function') window.volverACheckoutStep1();
        });

        document.getElementById('resumen-pago-cambiar-envio')?.addEventListener('click', function (e) {
            e.preventDefault();
            _volverAStep2();
        });
    });

    // ─────────────────────────────────────────────
    // 6. EXPORTS AL SCOPE GLOBAL
    // ─────────────────────────────────────────────
    window.mostrarCheckoutStep3 = mostrarCheckoutStep3;
    window.checkoutCurrentStep = window.checkoutCurrentStep || 1;

    // Redirección directa a NAVE sin mostrar Step 3 (llamado desde start.js Step 2)
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
            throw err; // re-lanzar para que start.js pueda resetear el botón
        }
    };

})();
