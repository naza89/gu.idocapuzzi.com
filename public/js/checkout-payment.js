/**
 * checkout-payment.js
 * GÜIDO CAPUZZI — Step 3: Pago via NAVE (Banco Galicia)
 *
 * Este módulo es llamado desde start.js cuando el usuario confirma el envío
 * (checkoutCurrentStep === 2) y pasa a la pantalla de pago.
 *
 * Depende de:
 *   - @ranty/ranty-sdk  (npm install @ranty/ranty-sdk)  ← formulario de tarjeta
 *   - qrcode.js (CDN cargado en page.tsx)               ← renderizado de QR
 *
 * Expone al scope global (para start.js):
 *   - window.mostrarCheckoutStep3(params)
 *   - window.checkoutCurrentStep  (sincronizado)
 *   - window.volverACheckoutStep1 (llamado desde aquí al hacer click en "Cambiar")
 */

(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // ESTADO INTERNO
    // ─────────────────────────────────────────────
    let _paymentRequestId = null;   // id devuelto por NAVE
    let _qrData = null;   // qr_data para renderizar QR
    let _environment = 'sandbox';
    let _sdkInstance = null;   // instancia activa del RantySDK
    let _ordenId = null;   // external_payment_id (ID orden Supabase)
    let _metodoPagoActivo = 'tarjeta'; // 'tarjeta' | 'qr'

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

        // Poblar resumen extendido
        _setTextSafe('resumen-pago-email', email);
        _setTextSafe('resumen-pago-ubicacion', ubicacion);
        _setTextSafe('resumen-pago-envio', metodoEnvio);

        // Breadcrumb → "Pago" activo
        const steps = document.querySelectorAll('.breadcrumb-step');
        steps.forEach((s, i) => s.classList.toggle('active', i === 2));

        // Ocultar botón CONTINUAR, mostrar botón PAGAR
        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        if (continueBtn) continueBtn.style.display = 'none';
        if (payBtn) payBtn.style.display = '';

        // Back link → "Volver a Envío"
        const backLink = document.getElementById('checkout-back-link');
        if (backLink) {
            backLink.textContent = '‹ Volver a Envío';
            backLink.style.display = '';
        }

        // Activar tab Tarjeta por defecto
        _activarTab('tarjeta');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Crear la intención de pago en NAVE (vía backend)
        await _crearIntencionDePago({ ordenId, totalARS, cartItems });

        console.log('[Checkout] → Step 3: Pago');
    }

    // ─────────────────────────────────────────────
    // 2. TOGGLE DE TABS (Tarjeta / QR)
    // ─────────────────────────────────────────────
    function _activarTab(metodo) {
        _metodoPagoActivo = metodo;

        const tabTarjeta = document.getElementById('pago-tab-tarjeta');
        const tabQr = document.getElementById('pago-tab-qr');

        if (metodo === 'tarjeta') {
            tabTarjeta?.classList.add('pago-tab-activo');
            tabQr?.classList.remove('pago-tab-activo');
            // Si ya tenemos el payment_request_id, montar el SDK
            if (_paymentRequestId) _montarSDK();
        } else {
            tabQr?.classList.add('pago-tab-activo');
            tabTarjeta?.classList.remove('pago-tab-activo');
            // Si ya tenemos qr_data, renderizarlo
            if (_qrData) _renderizarQR(_qrData);
        }
    }

    // ─────────────────────────────────────────────
    // 3. CREAR INTENCIÓN DE PAGO (llama al backend)
    // ─────────────────────────────────────────────
    async function _crearIntencionDePago({ ordenId, totalARS, cartItems }) {
        try {
            _mostrarLoadingSDK(true);
            _ocultarError();

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
                    })
                })
            });

            if (!response.ok) throw new Error(`Backend error: ${response.status}`);

            const data = await response.json();
            // Espera: { payment_request_id, qr_data, environment }
            _paymentRequestId = data.payment_request_id;
            _qrData = data.qr_data;
            _environment = data.environment || 'sandbox';

            console.log('[NAVE] ✅ Intención de pago creada:', _paymentRequestId);

            if (_metodoPagoActivo === 'tarjeta') {
                _montarSDK();
            } else {
                _mostrarLoadingSDK(false);
                _renderizarQR(_qrData);
            }

        } catch (err) {
            console.error('[NAVE] ❌ Error al crear intención de pago:', err);
            _mostrarLoadingSDK(false);
            _mostrarError('No se pudo inicializar el proceso de pago. Intentá nuevamente.');
        }
    }

    // ─────────────────────────────────────────────
    // 4. SDK EMBEBIDO — @ranty/ranty-sdk (Tarjeta)
    // ─────────────────────────────────────────────
    async function _montarSDK() {
        if (!_paymentRequestId) return;

        try {
            // Desmontar instancia anterior si existe
            if (_sdkInstance && typeof _sdkInstance.unmount === 'function') {
                _sdkInstance.unmount();
                _sdkInstance = null;
            }

            _mostrarLoadingSDK(true);

            // Usar el SDK cargado vía CDN (global window.RantySDK)
            var RantySDK = window.RantySDK;
            if (!RantySDK) {
                console.warn('[NAVE SDK] RantySDK no disponible en window — CDN no cargó');
                _mostrarLoadingSDK(false);
                _mostrarError('Error al cargar el SDK de pago. Recargá la página.');
                return;
            }

            _sdkInstance = new RantySDK({
                paymentRequestId: _paymentRequestId,
                environment: _environment   // 'sandbox' | 'production'
            });

            _sdkInstance.mount('#nave-payment-container');
            _mostrarLoadingSDK(false);

            console.log('[NAVE SDK] ✅ Montado en #nave-payment-container');

        } catch (err) {
            console.error('[NAVE SDK] ❌ Error al montar SDK:', err);
            _mostrarLoadingSDK(false);
            _mostrarError('Error al cargar el formulario de pago. Recargá la página e intentá nuevamente.');
        }
    }

    // ─────────────────────────────────────────────
    // 5. RENDERIZAR QR (MODO / Billeteras)
    // ─────────────────────────────────────────────
    function _renderizarQR(qrData) {
        const loadingEl = document.getElementById('pago-qr-loading');
        const wrapperEl = document.getElementById('pago-qr-image-wrapper');

        if (!qrData || !wrapperEl) return;

        if (loadingEl) loadingEl.style.display = 'none';
        wrapperEl.style.display = 'flex';
        wrapperEl.innerHTML = '';

        if (typeof QRCode !== 'undefined') {
            new QRCode(wrapperEl, {
                text: qrData,
                width: 200,
                height: 200,
                colorDark: '#1A1A1A',
                colorLight: '#FAFAFA',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            // Fallback: imagen vía API pública (solo para desarrollo)
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
            img.alt = 'Código QR de pago';
            img.style.cssText = 'width:200px;height:200px;display:block;';
            wrapperEl.appendChild(img);
            console.warn('[NAVE QR] qrcode.js no disponible. Usando API fallback.');
        }

        const expiryEl = document.getElementById('pago-qr-expiry');
        if (expiryEl) expiryEl.textContent = 'El código expira en 10 minutos.';
    }

    // ─────────────────────────────────────────────
    // 6. EVENTOS DEL SDK (PAYMENT_MODAL_RESPONSE)
    // ─────────────────────────────────────────────
    window.addEventListener('message', function (event) {
        if (!event.data || event.data.type !== 'PAYMENT_MODAL_RESPONSE') return;

        const { success, closeModal, rejected, expiration } = event.data.data || {};

        console.log('[NAVE SDK Event]', event.data.data);

        if (success && closeModal) {
            _onPagoAprobado();
        } else if (rejected) {
            _onPagoRechazado();
        } else if (expiration) {
            _onPagoExpirado();
        }
    });

    // ─────────────────────────────────────────────
    // 7. CALLBACKS DE RESULTADO
    // ─────────────────────────────────────────────
    function _onPagoAprobado() {
        console.log('[NAVE] ✅ Pago aprobado');
        const btn = document.getElementById('checkout-pay-btn');

        // Barra roja → retrocede → redirigir
        if (btn) {
            btn.classList.remove('loading');
            btn.classList.add('done');
        }

        setTimeout(() => {
            const url = `/checkout/confirmacion?orden=${encodeURIComponent(_ordenId)}`;
            window.location.href = url;
        }, 300);
    }

    function _onPagoRechazado() {
        console.log('[NAVE] ❌ Pago rechazado');
        const btn = document.getElementById('checkout-pay-btn');
        if (btn) {
            btn.classList.remove('loading', 'done');
            btn.textContent = 'PAGAR';
        }
        _ocultarError();
        setTimeout(() => {
            _mostrarError('Tu pago fue rechazado. Verificá los datos de la tarjeta o probá con otro método de pago.');
        }, 100);
    }

    async function _onPagoExpirado() {
        console.log('[NAVE] ⏰ Intención expirada — renovando...');
        const btn = document.getElementById('checkout-pay-btn');
        if (btn) {
            btn.classList.remove('loading', 'done');
            btn.textContent = 'PAGAR';
        }
        _ocultarError();
        _paymentRequestId = null;
        _qrData = null;

        await _crearIntencionDePago({
            ordenId: _ordenId,
            totalARS: window._checkoutTotalARS,
            cartItems: window._checkoutCartItems
        });
    }

    // ─────────────────────────────────────────────
    // 8. BOTÓN PAGAR — barra de progreso roja
    // ─────────────────────────────────────────────
    function _initBotonPagar() {
        const btn = document.getElementById('checkout-pay-btn');
        if (!btn) return;

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!_paymentRequestId) {
                _mostrarError('El proceso de pago aún se está inicializando. Esperá un momento.');
                return;
            }
            // Iniciar animación de loading
            btn.textContent = 'PROCESANDO...';
            btn.classList.add('loading');
            // El SDK gestiona el pago; el botón queda en loading hasta
            // que el evento PAYMENT_MODAL_RESPONSE dispara el callback.
        });
    }

    // ─────────────────────────────────────────────
    // 9. HELPERS UI
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
    // 10. VOLVER ATRÁS
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

        const steps = document.querySelectorAll('.breadcrumb-step');
        steps.forEach((s, i) => s.classList.toggle('active', i === 1));

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ─────────────────────────────────────────────
    // 11. EVENT LISTENERS
    // ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        // Inicializar botón PAGAR
        _initBotonPagar();

        // Toggle de tabs
        document.getElementById('pago-header-tarjeta')?.addEventListener('click', function () {
            if (window.checkoutCurrentStep === 3) _activarTab('tarjeta');
        });

        document.getElementById('pago-header-qr')?.addEventListener('click', function () {
            if (window.checkoutCurrentStep === 3) _activarTab('qr');
        });

        // Back link: detecta si estamos en Step 3
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
    // 12. EXPORTS AL SCOPE GLOBAL
    // ─────────────────────────────────────────────
    window.mostrarCheckoutStep3 = mostrarCheckoutStep3;
    window.checkoutCurrentStep = window.checkoutCurrentStep || 1;

})();
