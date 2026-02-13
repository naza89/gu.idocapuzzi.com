/**
 * GÜIDO CAPUZZI — Main Page (Server Component)
 * 
 * IMPORTANT: This uses dangerouslySetInnerHTML to inject the original HTML
 * as an opaque blob. React will NOT hydrate or manage these DOM nodes,
 * allowing start.js, checkout-logic.js, and supabase-config.js to freely
 * manipulate the DOM exactly as they did in the vanilla HTML version.
 * 
 * This is critical because the original JS uses direct DOM manipulation:
 * - document.getElementById / querySelector
 * - classList.add/remove/toggle
 * - addEventListener on specific elements
 * - IntersectionObserver on scroll containers
 * - style.display toggling for state management
 * 
 * If React hydrates these nodes, it will conflict with all of the above.
 */

const siteHTML = `
    <!-- ANNOUNCEMENT BAR (MARQUEE) -->
    <div id="announcement-bar">
        <div class="announcement-track">
            <span class="announcement-text">6 CUOTAS SIN INTERÉS • ENVÍOS GRATIS A ARGENTINA • DENIM ÚNICO SIN RE-STOCK
                • PRENDAS 1/1 • </span>
            <span class="announcement-text">6 CUOTAS SIN INTERÉS • ENVÍOS GRATIS A ARGENTINA • DENIM ÚNICO SIN RE-STOCK
                • PRENDAS 1/1 • </span>
        </div>
    </div>

    <!-- WRAPPER FOR SITE SHIFT ANIMATION -->
    <div id="site-wrapper">

        <!-- SEARCH OVERLAY -->
        <div id="search-overlay">
            <div class="search-bar">
                <img src="/assets/icons/search.svg" class="search-icon" alt="Buscar">
                <input type="text" id="search-input" placeholder="Buscar..">
                <button id="close-search" class="close-search-btn">
                    <img src="/assets/icons/cross-blanca.svg" alt="Cerrar" class="close-icon">
                </button>
            </div>
        </div>

        <!-- HEADER -->
        <header id="main-header">
            <div class="header-left">
                <div class="shop-interaction-wrapper">
                    <a href="#" id="shop-trigger" class="shop-trigger">Shop</a>

                    <!-- DROPDOWN MENU -->
                    <nav id="dropdown-menu">
                        <ul>
                            <li><a href="#" class="category-link" data-cat="REMERAS">REMERAS</a></li>
                            <li><a href="#" class="category-link" data-cat="TOPS / MUSCULOSAS">TOPS / MUSCULOSAS</a>
                            </li>
                            <li><a href="#" class="category-link" data-cat="PANTALONES / JEANS">PANTALONES / JEANS</a>
                            </li>
                            <li><a href="#" class="category-link" data-cat="BERMUDAS / SHORTS">BERMUDAS / SHORTS</a>
                            </li>
                            <li><a href="#" class="category-link" data-cat="ARCHIVO">ARCHIVO</a></li>
                            <li><a href="#" class="category-link" data-cat="VER TODO">VER TODO</a></li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div class="header-center">
                <a href="#" id="home-trigger" class="header-logo-link">
                    <img src="/assets/brand/logo-guido-blanco.svg" id="header-logo" class="header-logo"
                        alt="GÜIDO CAPUZZI">
                </a>
            </div>

            <div class="header-right">
                <div class="search-trigger-wrapper">
                    <a href="#" id="search-trigger">Buscar</a>
                </div>
                <a href="#" id="account-trigger">Cuenta</a>
                <a href="#" id="cart-trigger">Carrito (0)</a>
            </div>
        </header>

        <!-- STATE: HOME (Atmosphere & Scroll) -->
        <main id="home-container">
            <!-- HERO LOGO (Animated) -->
            <div id="hero-logo-container">
                <img src="/assets/brand/logo-guido-blanco.svg" id="hero-logo" alt="GÜIDO CAPUZZI">
            </div>

            <!-- Section 1: Campaign (Red) -->
            <section class="home-section campaign-section">
                <div class="section-content-block campaign-block">
                    <p class="section-subtitle">Descubrí los vestuarios del origen de Güido.</p>
                    <h2 class="section-title font-condensed">CAMPAÑA 2026</h2>
                    <div class="section-buttons">
                        <a href="#" class="btn-pill">VER TODO</a>
                        <a href="#" class="btn-pill">ARCHIVO</a>
                    </div>
                </div>
            </section>

            <!-- Section 2: Selvedge (Brown) -->
            <section class="home-section selvedge-section">
                <div class="section-content-block selvedge-block">
                    <p class="section-subtitle">Nuevos jeans de stock único.</p>
                    <h2 class="section-title font-condensed">SELVEDGE DENIM</h2>
                    <div class="section-buttons">
                        <a href="#" class="btn-pill">COMPRAR AHORA</a>
                        <a href="#" class="btn-pill">VER LOOKBOOK</a>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="home-footer">
                <div class="footer-main-content">
                    <div class="footer-left-section">
                        <div class="footer-nav-columns">
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">SOPORTE</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#" class="trigger-contact">CONTACTO</a></li>
                                    <li><a href="#">PREGUNTAS FRECUENTES</a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">LEGALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#">TÉRMINOS Y CONDICIONES</a></li>
                                    <li><a href="#">POLÍTICA DE PRIVACIDAD</a></li>
                                    <li><a href="#">DEVOLUCIONES</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer-social-icons">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                class="social-icon-link">
                                <img src="/assets/icons/insta-footer-negro.svg" alt="Instagram" class="social-icon">
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                                class="social-icon-link">
                                <img src="/assets/icons/tiktok-footer-negro.svg" alt="TikTok" class="social-icon">
                            </a>
                        </div>
                    </div>
                    <div class="footer-brand-description">
                        <p class="manifesto-text font-condensed">
                            GÜIDO vive en la consciencia de su nieto, Nazareno Capuzzi,<br>
                            en su afán de querer crear y compartir con el mundo una visión que lo<br>
                            precede. "Quiero construir lo que busco y no encuentro, crear en virtud<br>
                            de materializar lo que siento para dejar una huella de lo que llaman Alma.<br>
                            Mi proyecto es el símbolo de una idea que se instancia en la materia,<br>
                            pero que pertenece, esencialmente, al espíritu".
                        </p>
                    </div>
                </div>
                <div class="footer-logo-container">
                    <img src="/assets/brand/logo-guido-rojo-footer.svg" alt="GÜIDO CAPUZZI" class="footer-logo">
                </div>
            </footer>
        </main>

        <!-- STATE: SHOP (Catalogue) -->
        <section id="shop">
            <div class="shop-header">
                <div class="shop-title-row">
                    <h1 id="shop-category-title" class="font-condensed">VER TODO</h1>
                </div>
                <div class="shop-controls-row">
                    <span id="shop-count" class="shop-count">14 Productos</span>
                    <div class="shop-actions">
                        <button class="filtros-btn font-condensed">FILTROS</button>
                    </div>
                </div>
            </div>

            <div class="shop-grid" id="product-grid">
                <!-- Dynamic Content via JS -->
            </div>

            <!-- Shop Footer -->
            <footer class="shop-footer">
                <div class="footer-main-content">
                    <div class="footer-left-section">
                        <div class="footer-nav-columns">
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">SOPORTE</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#" class="trigger-contact">CONTACTO</a></li>
                                    <li><a href="#">PREGUNTAS FRECUENTES</a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">LEGALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#">TÉRMINOS Y CONDICIONES</a></li>
                                    <li><a href="#">POLÍTICA DE PRIVACIDAD</a></li>
                                    <li><a href="#">DEVOLUCIONES</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer-social-icons">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                class="social-icon-link">
                                <img src="/assets/icons/insta-footer-marron.svg" alt="Instagram" class="social-icon">
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                                class="social-icon-link">
                                <img src="/assets/icons/tiktok-footer-marron.svg" alt="TikTok" class="social-icon">
                            </a>
                        </div>
                    </div>
                    <div class="footer-brand-description">
                        <p class="manifesto-text font-condensed">
                            GÜIDO vive en la consciencia de su nieto, Nazareno Capuzzi,<br>
                            en su afán de querer crear y compartir con el mundo una visión que lo<br>
                            precede. "Quiero construir lo que busco y no encuentro, crear en virtud<br>
                            de materializar lo que siento para dejar una huella de lo que llaman Alma.<br>
                            Mi proyecto es el símbolo de una idea que se instancia en la materia,<br>
                            pero que pertenece, esencialmente, al espíritu".
                        </p>
                    </div>
                </div>
                <div class="footer-logo-container">
                    <img src="/assets/brand/logo-guido-marron-footer.svg" alt="GÜIDO CAPUZZI" class="footer-logo">
                </div>
            </footer>
        </section>

        <!-- STATE: PRODUCT DETAIL (PDP) -->
        <section id="product-page" style="display: none;">
            <!-- Content injected via JS -->
        </section>

        <!-- STATE: ACCOUNT LOGIN -->
        <section id="account-login" style="display: none;">
            <div class="login-container">
                <div class="login-header">
                    <h1 class="font-condensed">LOGIN</h1>
                    <a href="#" class="forgot-pwd">¿TE OLVIDASTE LA CONTRASEÑA?</a>
                </div>
                <div class="login-fields">
                    <div class="input-group">
                        <label for="input-email">EMAIL</label>
                        <input type="email" class="input-custom" id="input-email" autocomplete="email">
                    </div>
                    <div class="input-group">
                        <label for="input-password">CONTRASEÑA</label>
                        <input type="password" class="input-custom" id="input-password" autocomplete="current-password">
                    </div>
                </div>
                <div class="login-actions">
                    <button id="btn-login-submit" class="is-inactive font-condensed">ENTRAR</button>
                    <button id="btn-create-account" class="btn-outline font-condensed">CREAR UNA CUENTA</button>
                </div>
            </div>
        </section>

        <!-- STATE: CREATE ACCOUNT -->
        <section id="account-create" style="display: none;">
            <div class="login-container">
                <div class="login-header">
                    <h1 class="font-condensed">CREAR UNA CUENTA</h1>
                </div>
                <div class="login-fields">
                    <div class="name-row">
                        <div class="input-group">
                            <label for="input-fname">NOMBRE</label>
                            <input type="text" class="input-custom" id="input-fname" autocomplete="given-name">
                        </div>
                        <div class="input-group">
                            <label for="input-lname">APELLIDO</label>
                            <input type="text" class="input-custom" id="input-lname" autocomplete="family-name">
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="input-create-email">EMAIL</label>
                        <input type="email" class="input-custom" id="input-create-email" autocomplete="email">
                    </div>
                    <div class="input-group">
                        <label for="input-create-pwd">CONTRASEÑA</label>
                        <input type="password" class="input-custom" id="input-create-pwd" autocomplete="new-password">
                    </div>
                    <div class="input-group">
                        <label for="input-create-pwd-confirm">CONFIRMAR CONTRASEÑA</label>
                        <input type="password" class="input-custom" id="input-create-pwd-confirm" autocomplete="new-password">
                    </div>
                </div>
                <div class="login-actions">
                    <button id="btn-final-create" class="is-inactive font-condensed">CREAR UNA CUENTA</button>
                    <button id="btn-back-to-login" class="btn-outline font-condensed">ENTRAR</button>
                </div>
            </div>
        </section>

        <!-- STATE: CONTACT -->
        <section id="account-contact" style="display: none;">
            <div class="login-container contact-container">
                <div class="login-header">
                    <h1 class="font-condensed">CONTACTO</h1>
                </div>
                <div class="login-fields">
                    <div class="input-group">
                        <label for="contact-name">NOMBRE COMPLETO</label>
                        <input type="text" class="input-custom" id="contact-name" autocomplete="name">
                    </div>
                    <div class="input-group">
                        <label for="contact-email">EMAIL</label>
                        <input type="email" class="input-custom" id="contact-email" autocomplete="email">
                    </div>
                    <div class="input-group">
                        <label for="contact-msg">ESCRIBI TU COMENTARIO/CONSULTA</label>
                        <textarea class="textarea-custom" id="contact-msg"></textarea>
                    </div>
                </div>
                <div class="login-actions">
                    <button id="btn-contact-submit" class="is-inactive font-condensed">ENVIAR</button>
                </div>
            </div>
        </section>

        <!-- STATE: CHECKOUT (Multi-step Process) -->
        <section id="checkout" style="display: none;">
            <div class="checkout-container">
                <!-- LEFT PANEL: Form Content -->
                <div class="checkout-main">
                    <div class="checkout-logo">
                        <a href="#" class="checkout-logo-link" id="checkout-home-link">
                            <img src="/assets/brand/logo-guido-negro.svg" alt="GÜIDO CAPUZZI" class="checkout-logo-img">
                        </a>
                    </div>

                    <nav class="checkout-breadcrumb">
                        <span class="breadcrumb-step active">Información</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-step">Envío</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-step">Pago</span>
                    </nav>

                    <!-- CONTACTO Section -->
                    <div class="checkout-section">
                        <div class="checkout-section-header">
                            <h2 class="checkout-section-title font-condensed">CONTACTO</h2>
                            <a href="#" class="checkout-login-link">Log in</a>
                        </div>
                        <div class="checkout-form-group">
                            <input type="email" id="checkout-email" class="checkout-input" placeholder="Email" autocomplete="email">
                        </div>
                        <label class="checkout-checkbox-group">
                            <input type="checkbox" id="checkout-newsletter">
                            <span class="checkout-checkbox-square"></span>
                            <span class="checkout-checkbox-label">Recibir novedades y ofertas por mail</span>
                        </label>
                    </div>

                    <!-- DIRECCIÓN DE ENVÍO Section -->
                    <div class="checkout-section">
                        <div class="checkout-section-header">
                            <h2 class="checkout-section-title font-condensed">DIRECCIÓN DE ENVÍO</h2>
                        </div>
                        <div class="checkout-row checkout-row-half">
                            <div class="checkout-form-group">
                                <input type="text" id="checkout-nombre" class="checkout-input" placeholder="Nombre" autocomplete="given-name">
                            </div>
                            <div class="checkout-form-group">
                                <input type="text" id="checkout-apellido" class="checkout-input" placeholder="Apellido" autocomplete="family-name">
                            </div>
                        </div>
                        <div class="checkout-form-group">
                            <input type="text" id="checkout-direccion" class="checkout-input" placeholder="Dirección" autocomplete="address-line1">
                        </div>
                        <div class="checkout-form-group">
                            <input type="text" id="checkout-departamento" class="checkout-input" placeholder="Departamento, suite,etc. (opcional)" autocomplete="address-line2">
                        </div>
                        <div class="checkout-row checkout-row-thirds">
                            <div class="checkout-form-group">
                                <input type="text" id="checkout-ciudad" class="checkout-input" placeholder="Ciudad" autocomplete="address-level2">
                            </div>
                            <div class="checkout-form-group">
                                <input type="text" id="checkout-provincia" class="checkout-input" placeholder="Provincia" autocomplete="address-level1">
                            </div>
                            <div class="checkout-form-group">
                                <input type="text" id="checkout-cp" class="checkout-input" placeholder="Código postal" autocomplete="postal-code">
                            </div>
                        </div>
                        <div class="checkout-form-group">
                            <input type="tel" id="checkout-telefono" class="checkout-input" placeholder="Teléfono" autocomplete="tel">
                        </div>
                        <label class="checkout-checkbox-group">
                            <input type="checkbox" id="checkout-save-info">
                            <span class="checkout-checkbox-square"></span>
                            <span class="checkout-checkbox-label">Guarda esta información para la próxima</span>
                        </label>
                    </div>

                    <!-- STEP 2: ENVÍO (Hidden by default) -->
                    <div id="checkout-step-envio" style="display: none;">
                        <div class="checkout-section">
                            <div class="checkout-section-header">
                                <h2 class="checkout-section-title font-condensed">RESUMEN</h2>
                            </div>
                            <div class="checkout-resumen-box">
                                <div class="resumen-row">
                                    <span class="resumen-label">Contacto</span>
                                    <span class="resumen-value" id="resumen-email">—</span>
                                    <a href="#" class="resumen-cambiar" id="resumen-cambiar-contacto">Cambiar</a>
                                </div>
                                <div class="resumen-divider"></div>
                                <div class="resumen-row">
                                    <span class="resumen-label">Ubicación</span>
                                    <span class="resumen-value" id="resumen-ubicacion">—</span>
                                    <a href="#" class="resumen-cambiar" id="resumen-cambiar-ubicacion">Cambiar</a>
                                </div>
                            </div>
                        </div>
                        <div class="checkout-section">
                            <div class="checkout-section-header">
                                <h2 class="checkout-section-title font-condensed">MÉTODO DE ENVÍO</h2>
                            </div>
                            <div class="envio-opcion" data-tipo="domicilio" data-precio="800000">
                                <input type="radio" name="metodo-envio" id="envio-domicilio" value="domicilio">
                                <label for="envio-domicilio" class="envio-opcion-label">
                                    <div class="envio-opcion-header">
                                        <span class="envio-opcion-nombre">Envío a domicilio</span>
                                        <span class="envio-opcion-precio">$8,000.00</span>
                                    </div>
                                    <div class="envio-opcion-detalle">
                                        <span class="envio-opcion-plazo">3 a 5 días hábiles</span>
                                    </div>
                                </label>
                            </div>
                            <div class="envio-opcion envio-opcion-expandible" data-tipo="sucursal" data-precio="550000">
                                <input type="radio" name="metodo-envio" id="envio-sucursal" value="sucursal">
                                <label for="envio-sucursal" class="envio-opcion-label">
                                    <div class="envio-opcion-header">
                                        <span class="envio-opcion-nombre">Retiro en sucursal</span>
                                        <span class="envio-opcion-precio">$5,500.00</span>
                                    </div>
                                    <div class="envio-opcion-detalle">
                                        <span class="envio-opcion-plazo">2 a 4 días hábiles</span>
                                    </div>
                                </label>
                                <button type="button" class="envio-elegir-sucursal" id="btn-elegir-sucursal">
                                    Elegir sucursal &nbsp;&rsaquo;
                                </button>
                                <div class="envio-sucursales" id="envio-sucursales-lista">
                                    <p class="envio-sucursales-titulo">Sucursales cerca de tu domicilio:</p>
                                    <div class="envio-sucursales-list">
                                        <div class="envio-sucursal-item">
                                            <input type="radio" name="sucursal" id="sucursal-1" value="1" checked
                                                data-nombre="OCA Microcentro" data-direccion="Florida 520, CABA">
                                            <label for="sucursal-1">OCA Microcentro, Florida 520, CABA</label>
                                        </div>
                                        <div class="envio-sucursal-item">
                                            <input type="radio" name="sucursal" id="sucursal-2" value="2"
                                                data-nombre="OCA Retiro" data-direccion="Av. Córdoba 950, CABA">
                                            <label for="sucursal-2">OCA Retiro, Av. Córdoba 950, CABA</label>
                                        </div>
                                        <div class="envio-sucursal-item">
                                            <input type="radio" name="sucursal" id="sucursal-3" value="3"
                                                data-nombre="OCA Constitución" data-direccion="Av. Brasil 280, CABA">
                                            <label for="sucursal-3">OCA Constitución, Av. Brasil 280, CABA</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- END STEP 2 -->

                    <div class="checkout-actions">
                        <a href="#" class="checkout-back-link" id="checkout-back-link" style="display: none;">
                            ‹ Volver a Información
                        </a>
                        <button id="checkout-continue-btn" class="checkout-continue-btn font-condensed">
                            CONTINUAR A ENVÍOS
                        </button>
                    </div>
                </div>

                <!-- RIGHT PANEL: Order Summary Sidebar -->
                <aside class="checkout-sidebar">
                    <div class="checkout-cart-items" id="checkout-cart-items">
                        <!-- Items will be injected via JS -->
                    </div>
                    <div class="checkout-discount-section">
                        <input type="text" id="checkout-discount" class="checkout-discount-input" placeholder="Código de descuento">
                    </div>
                    <div class="checkout-totals">
                        <div class="checkout-total-row">
                            <span class="checkout-total-label">Subtotal</span>
                            <span class="checkout-total-value" id="checkout-subtotal">$0.00</span>
                        </div>
                        <div class="checkout-total-row">
                            <span class="checkout-total-label">Envío</span>
                            <span class="checkout-total-note">Calculado en el próximo paso</span>
                        </div>
                        <div class="checkout-total-row checkout-total-final">
                            <span class="checkout-total-label font-condensed">TOTAL</span>
                            <span class="checkout-total-currency">ARS</span>
                            <span class="checkout-total-value checkout-total-amount font-condensed" id="checkout-total">$0.00</span>
                        </div>
                    </div>
                </aside>
            </div>
        </section>

    </div><!-- END SITE WRAPPER -->

    <!-- CINEMATIC UI ELEMENTS (SIBLINGS TO WRAPPER) -->
    <div id="ui-overlay"></div>

    <aside id="cart-drawer">
        <div class="cart-header">
            <h2 class="font-condensed" id="cart-title">CARRITO (0)</h2>
            <button id="close-cart" class="close-btn">×</button>
        </div>
        <div class="cart-content">
            <div class="cart-empty-msg font-condensed" id="cart-empty-msg">
                TU CARRITO<br>ESTÁ VACÍO
            </div>
            <div id="cart-items" class="cart-items-list">
                <!-- Items injected via JS (LIFO) -->
            </div>
            <div class="cart-footer-spacer"></div>
        </div>
        <div class="cart-footer">
            <div class="cart-subtotal">
                <span class="font-condensed">SUBTOTAL:</span>
                <span id="cart-total-price" class="font-condensed">$0.00</span>
            </div>
            <button class="checkout-btn font-condensed">INICIAR COMPRA</button>
        </div>
    </aside>

    <!-- FILTERS DRAWER (Enters from LEFT) -->
    <aside id="filters-drawer">
        <div class="filters-header">
            <h2 class="font-condensed" id="filters-title">FILTROS</h2>
            <button id="close-filters" class="filters-close-btn">
                <img src="/assets/icons/cross-blanca.svg" alt="Cerrar" class="filters-close-icon">
            </button>
        </div>
        <div class="filters-content">
            <!-- ORDENAR POR -->
            <div class="filter-section" id="filter-section-ordenar">
                <h3 class="filter-section-title font-condensed">ORDENAR POR</h3>
                <div class="filter-options-radio">
                    <label class="filter-radio">
                        <input type="radio" name="ordenar" value="ultimos" checked>
                        <span class="radio-circle"></span>
                        <span class="radio-label">ÚLTIMOS INGRESOS</span>
                    </label>
                    <label class="filter-radio">
                        <input type="radio" name="ordenar" value="alto-bajo">
                        <span class="radio-circle"></span>
                        <span class="radio-label">PRECIO: ALTO A BAJO</span>
                    </label>
                    <label class="filter-radio">
                        <input type="radio" name="ordenar" value="bajo-alto">
                        <span class="radio-circle"></span>
                        <span class="radio-label">PRECIO: BAJO A ALTO</span>
                    </label>
                </div>
            </div>

            <!-- COLOR (Dynamic) -->
            <div class="filter-section" id="filter-section-color" style="display: none;">
                <h3 class="filter-section-title font-condensed">COLOR</h3>
                <div class="filter-options-checkbox filter-color-grid" id="filter-color-options">
                    <!-- Options will be dynamically populated -->
                </div>
            </div>

            <!-- TALLE -->
            <div class="filter-section">
                <h3 class="filter-section-title font-condensed">TALLE</h3>
                <div class="filter-options-checkbox filter-talle-grid">
                    <label class="filter-checkbox">
                        <input type="checkbox" name="talle" value="XS">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">XS</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="talle" value="S">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">S</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="talle" value="M">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">M</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="talle" value="L">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">L</span>
                    </label>
                </div>
            </div>

            <!-- CATEGORIA -->
            <div class="filter-section" id="filter-section-categoria">
                <h3 class="filter-section-title font-condensed">CATEGORIA</h3>
                <div class="filter-options-checkbox filter-categoria-grid">
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="JEANS">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">JEANS</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="REMERAS">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">REMERAS</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="BERMUDAS">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">BERMUDAS</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="MUSCULOSAS">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">MUSCULOSAS</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="UNISEX">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">UNISEX</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="MUJER">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">MUJER</span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" name="categoria" value="1/1">
                        <span class="checkbox-square"></span>
                        <span class="checkbox-label">1/1</span>
                    </label>
                </div>
            </div>

            <div class="filters-footer-spacer"></div>
        </div>
        <div class="filters-footer">
            <button id="filters-clear-btn" class="filters-action-btn filters-clear font-condensed">QUITAR TODOS</button>
            <button id="filters-apply-btn" class="filters-action-btn filters-apply font-condensed">MOSTRAR</button>
        </div>
    </aside>

    <!-- Supabase Client (CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/js/supabase-config.js"></script>
    <script src="/js/checkout-logic.js"></script>
    <script src="/js/start.js"></script>
`;

export default function HomePage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: siteHTML }}
    />
  );
}
