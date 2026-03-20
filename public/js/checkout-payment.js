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
    let _sdkInstance = null;   // <payfac-sdk> element in the DOM
    let _publicKey = null;   // public key devuelta por el backend
    let _ordenId = null;   // external_payment_id (ID orden Supabase)
    let _metodoPagoActivo = 'tarjeta'; // 'tarjeta' | 'qr'
    let _sdkModuleLoaded = false; // tracks if the SDK web component module has been imported

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

        // Ocultar botones — el SDK de NAVE tiene su propio botón de pago
        const continueBtn = document.getElementById('checkout-continue-btn');
        const payBtn = document.getElementById('checkout-pay-btn');
        if (continueBtn) continueBtn.style.display = 'none';
        if (payBtn) payBtn.style.display = 'none';

        // Back link → "Volver a Envío"
        const backLink = document.getElementById('checkout-back-link');
        if (backLink) {
            backLink.textContent = '‹ Volver a Envío';
            backLink.style.display = '';
        }

        // Ocultar nuestros tabs — el SDK maneja la selección QR/Tarjeta internamente
        var tabsContainer = document.querySelector('.pago-tabs');
        if (tabsContainer) tabsContainer.style.display = 'none';

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
            _publicKey = data.public_key || '';

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
            // Remove previous SDK element if exists
            if (_sdkInstance) {
                _sdkInstance.remove();
                _sdkInstance = null;
            }

            _mostrarLoadingSDK(true);

            // Load the SDK module once (registers <payfac-sdk> web component)
            if (!_sdkModuleLoaded) {
                try {
                    await import('https://cdn.jsdelivr.net/npm/@ranty/ranty-sdk/+esm');
                    _sdkModuleLoaded = true;
                    console.log('[NAVE SDK] Módulo cargado, web component registrado');
                } catch (importErr) {
                    console.warn('[NAVE SDK] Falló el import dinámico del CDN:', importErr);
                    _mostrarLoadingSDK(false);
                    _mostrarError('Error al descargar el componente de pago. Verificá tu conexión a internet.');
                    return;
                }
            }

            // Create <payfac-sdk> web component
            const container = document.getElementById('nave-payment-container');
            if (!container) {
                console.error('[NAVE SDK] #nave-payment-container no encontrado');
                _mostrarLoadingSDK(false);
                return;
            }

            container.innerHTML = '';

            const sdkEl = document.createElement('payfac-sdk');
            sdkEl.setAttribute('paymentRequestId', _paymentRequestId);
            if (_publicKey) {
                sdkEl.setAttribute('publicKey', _publicKey);
            }
            sdkEl.setAttribute('env', _environment);

            // Hide redundant SDK UI (we show our own title/order detail)
            sdkEl.setAttribute('settings', JSON.stringify({
                customerProperties: {
                    show_title: false,
                    show_subtitle: false,
                    show_order_detail: false,
                    enable_auto_redirect: false
                }
            }));

            container.appendChild(sdkEl);
            _sdkInstance = sdkEl;
            _mostrarLoadingSDK(false);

            // Inject GÜIDO brand styles into SDK Shadow DOM
            _personalizarSDK(sdkEl);

            console.log('[NAVE SDK] ✅ <payfac-sdk> montado en #nave-payment-container');

        } catch (err) {
            console.error('[NAVE SDK] ❌ Error al montar SDK:', err);
            _mostrarLoadingSDK(false);
            _mostrarError('Error al cargar el formulario de pago. Recargá la página e intentá nuevamente.');
        }
    }

    // ─────────────────────────────────────────────
    // 4b. PERSONALIZAR SDK — Inyecta estilos GÜIDO recursivamente en todos los Shadow DOMs
    // ─────────────────────────────────────────────
    var _guidoCSS =
        '*, *::before, *::after {' +
        "  font-family: 'Univers', 'Univers 67 Condensed', Inter, Arial, sans-serif !important;" +
        '}' +
        ':host {' +
        '  background: #FAFAFA !important;' +
        '  --alert-border: #AD1C1C;' +
        '  --card-form-title-color: #202020;' +
        '  --card-form-subtitle-color: #442517;' +
        '}' +
        '.btn, button {' +
        '  border-radius: 0 !important;' +
        '  text-transform: uppercase !important;' +
        '  letter-spacing: 0.08em !important;' +
        '}' +
        '.container, .panel-container, .card, .card_list {' +
        '  border-radius: 4px !important;' +
        '}' +
        'input, select {' +
        '  border-radius: 0 !important;' +
        '}';

    function _injectIntoShadowRoot(sr) {
        if (!sr || sr.querySelector('.guido-sdk-override')) return;
        var style = document.createElement('style');
        style.className = 'guido-sdk-override';
        style.textContent = _guidoCSS;
        sr.appendChild(style);
    }

    function _walkAndInject(root) {
        // Inject into this element's shadow root if it has one
        if (root.shadowRoot) {
            _injectIntoShadowRoot(root.shadowRoot);
            // Walk children inside the shadow root too
            root.shadowRoot.querySelectorAll('*').forEach(function (child) {
                if (child.shadowRoot) _walkAndInject(child);
            });
        }
    }

    function _personalizarSDK(sdkEl) {
        // Recursive injection with periodic re-scan for dynamically added components
        var scanCount = 0;
        var maxScans = 20;

        function scan() {
            _walkAndInject(sdkEl);
            // Also scan inside shadow root for new nested components
            if (sdkEl.shadowRoot) {
                sdkEl.shadowRoot.querySelectorAll('*').forEach(function (el) {
                    if (el.shadowRoot) _walkAndInject(el);
                });
            }
            scanCount++;
            if (scanCount < maxScans) {
                setTimeout(scan, 500);
            }
        }

        // Start scanning after a brief delay to let SDK initialize
        setTimeout(scan, 300);
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
    // 6. EVENTOS DEL SDK (postMessage)
    //    Tipos: SUCCESS_PROCESSED, FAILURE_PROCESSED, BLOCKED,
    //    AUTH_ERROR, PAYMENT_REQUEST_ERROR, DIRECT_PAYMENT_ERROR
    // ─────────────────────────────────────────────
    window.addEventListener('message', function (event) {
        if (!event.data || !event.data.type) return;

        var type = event.data.type;

        // Ignore internal/noisy events
        if (['webpack', 'webpackHotUpdate', 'webpackOk'].some(function (w) { return type.indexOf(w) !== -1; })) return;

        console.log('[NAVE SDK Event]', type, event.data);

        switch (type) {
            case 'SUCCESS_PROCESSED':
                _onPagoAprobado();
                break;
            case 'FAILURE_PROCESSED':
            case 'DIRECT_PAYMENT_ERROR':
            case 'BLOCKED':
                _onPagoRechazado();
                break;
            // Legacy event format (fallback)
            case 'PAYMENT_MODAL_RESPONSE':
                var d = event.data.data || {};
                if (d.success && d.closeModal) _onPagoAprobado();
                else if (d.rejected) _onPagoRechazado();
                break;
        }
    });

    // ─────────────────────────────────────────────
    // 7. CALLBACKS DE RESULTADO
    // ─────────────────────────────────────────────
    function _onPagoAprobado() {
        console.log('[NAVE] ✅ Pago aprobado');

        setTimeout(function () {
            if (typeof window.enableConfirmationState === 'function') {
                window.enableConfirmationState(_ordenId);
            } else {
                window.location.href = '/checkout/confirmacion?orden=' + encodeURIComponent(_ordenId);
            }
        }, 300);
    }

    function _onPagoRechazado() {
        console.log('[NAVE] ❌ Pago rechazado');
        _mostrarError('Tu pago fue rechazado. Verificá los datos de la tarjeta o probá con otro método de pago.');
    }

    async function _onPagoExpirado() {
        console.log('[NAVE] ⏰ Intención expirada — renovando...');
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

        // Restore tabs visibility if we go back
        var tabsContainer = document.querySelector('.pago-tabs');
        if (tabsContainer) tabsContainer.style.display = '';

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
