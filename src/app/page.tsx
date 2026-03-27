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
    <!-- Pre-routing: ocultar home si la URL es de confirmación (evita flash de fondo rojo) -->
    <script>
    (function(){
        var p = window.location.pathname;
        if (p.indexOf('/checkout/confirmacion') === 0) {
            document.documentElement.classList.add('route-confirmation');
        }
    })();
    </script>
    <style>
        html.route-confirmation #home-container,
        html.route-confirmation #announcement-bar { display: none !important; }
        html.route-confirmation #confirmation-container { display: flex !important; }
        html.route-confirmation body { background: #FAFAFA !important; }
    </style>

    <!-- ANNOUNCEMENT BAR (MARQUEE) -->
    <div id="announcement-bar">
        <div class="announcement-track" id="announcement-track"><span class="announcement-text" id="announcement-content"></span></div>
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
                        <a href="#" class="btn-rect"><span>VER TODO</span></a>
                        <a href="#" class="btn-rect"><span>ARCHIVO</span></a>
                    </div>
                </div>
            </section>

            <!-- Section 2: Selvedge (Brown) -->
            <section class="home-section selvedge-section">
                <div class="section-content-block selvedge-block">
                    <p class="section-subtitle">Nuevos jeans de stock único.</p>
                    <h2 class="section-title font-condensed">SELVEDGE DENIM</h2>
                    <div class="section-buttons">
                        <a href="#" class="btn-rect"><span>COMPRAR AHORA</span></a>
                        <a href="#" class="btn-rect"><span>VER LOOKBOOK</span></a>
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
                                    <li><a href="#" class="trigger-contact"><span>CONTACTO</span></a></li>
                                    <li><a href="#"><span>PREGUNTAS FRECUENTES</span></a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">LEGALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#" class="trigger-legales" data-section="terminos"><span>TÉRMINOS Y CONDICIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="privacidad"><span>POLÍTICA DE PRIVACIDAD</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="devoluciones"><span>DEVOLUCIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="cookies"><span>POLÍTICA DE COOKIES</span></a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">SOCIALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><span>INSTAGRAM</span></a></li>
                                    <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"><span>TIKTOK</span></a></li>
                                </ul>
                            </div>
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
                    <svg class="footer-logo" viewBox="0 0 478.12614 58.217856" xmlns="http://www.w3.org/2000/svg" aria-label="GÜIDO CAPUZZI">
                        <path fill="#AD1C1C" d="M 48.131428 0.49144286 L 48.131428 7.1597696 L 54.984757 7.1597696 L 54.984757 0.49144286 L 48.131428 0.49144286 z M 59.059443 0.49144286 L 59.059443 7.1597696 L 65.913288 7.1597696 L 65.913288 0.49144286 L 59.059443 0.49144286 z M 16.297713 11.666988 C 1.0473499 11.666988 0.49144286 23.089065 0.49144286 34.32607 C 0.49144286 51.243328 2.2817719 57.726191 17.964278 57.726191 C 21.668745 57.726191 28.028462 56.738556 30.559891 56.244628 L 30.559891 33.647041 L 16.17369 33.647041 L 16.17369 40.50037 L 21.236946 40.50037 L 21.236946 50.378836 C 19.816945 50.872765 18.149793 51.243383 16.606221 51.243383 C 11.296574 51.243383 9.9378945 48.773745 9.9378945 34.820096 C 9.9378945 26.176234 9.9379213 18.334798 15.741675 18.334798 C 20.680963 18.334798 21.360049 21.97747 21.298441 26.114168 L 30.559891 26.114168 C 31.115605 16.791164 25.435397 11.666988 16.297713 11.666988 z M 160.64084 11.666988 C 145.26708 11.666988 145.2671 22.903906 145.2671 34.69659 C 145.2671 46.365792 145.26708 57.726191 160.64084 57.726191 C 176.0146 57.726191 176.01458 46.365792 176.01458 34.69659 C 176.01458 22.903906 176.0146 11.666988 160.64084 11.666988 z M 207.4323 11.666988 C 192.05854 11.666988 192.05856 22.903906 192.05856 34.69659 C 192.05856 46.365792 192.05854 57.726191 207.4323 57.726191 C 216.13784 57.726191 220.89194 53.898099 220.89194 41.981933 L 211.6925 41.981933 C 211.56893 45.50122 211.75428 51.058381 207.4323 51.058381 C 202.18426 51.058381 201.50501 46.118827 201.50501 34.69659 C 201.50501 23.27437 202.18426 18.334798 207.4323 18.334798 C 210.21069 18.334798 211.26049 20.557471 211.26049 26.484688 L 220.39791 26.484688 C 220.76827 16.914701 216.94052 11.666988 207.4323 11.666988 z M 41.833622 12.407511 L 41.833622 44.019535 C 41.833622 52.416414 46.773246 57.726191 57.022358 57.726191 C 68.382899 57.726191 72.149083 50.687645 72.149083 44.019535 L 72.149083 12.407511 L 62.826138 12.407511 L 62.826138 43.402001 C 62.826138 48.341342 60.973854 51.058381 56.898852 51.058381 C 53.502959 51.058381 51.156567 48.897021 51.156567 43.402001 L 51.156567 12.407511 L 41.833622 12.407511 z M 83.385607 12.407511 L 83.385607 56.985151 L 92.708552 56.985151 L 92.708552 12.407511 L 83.385607 12.407511 z M 103.94559 12.407511 L 103.94559 56.985151 L 119.13433 56.985151 C 135.06362 56.985151 134.01404 41.302919 134.01404 34.449576 C 134.01404 20.557677 131.72968 12.407511 119.50485 12.407511 L 103.94559 12.407511 z M 273.04638 12.407511 L 273.04638 56.985151 L 282.36932 56.985151 L 282.36932 38.833288 L 289.28415 38.833288 C 300.21255 38.833288 301.69424 30.806989 301.69424 25.744165 C 301.69424 17.59425 298.36055 12.407511 289.84019 12.407511 L 273.04638 12.407511 z M 309.40333 12.407511 L 309.40333 44.019535 C 309.40333 52.416414 314.34244 57.726191 324.59155 57.726191 C 335.95209 57.726191 339.71828 50.687645 339.71828 44.019535 L 339.71828 12.407511 L 330.39533 12.407511 L 330.39533 43.402001 C 330.39533 48.341342 328.54357 51.058381 324.46856 51.058381 C 321.07267 51.058381 318.72628 48.897021 318.72628 43.402001 L 318.72628 12.407511 L 309.40333 12.407511 z M 348.2914 12.407511 L 348.2914 19.26084 L 366.13475 19.26084 L 347.42737 48.835261 L 347.42737 56.985151 L 375.5812 56.985151 L 375.5812 50.131823 L 356.37979 50.131823 L 375.14919 20.495906 L 375.14919 12.407511 L 348.2914 12.407511 z M 384.15484 12.407511 L 384.15484 19.26084 L 401.9982 19.26084 L 383.29029 48.835261 L 383.29029 56.985151 L 411.44465 56.985151 L 411.44465 50.131823 L 392.24272 50.131823 L 411.01212 20.495906 L 411.01212 12.407511 L 384.15484 12.407511 z M 419.15322 12.407511 L 419.15322 56.985151 L 428.47617 56.985151 L 428.47617 12.407511 L 419.15322 12.407511 z M 228.60051 13.148551 L 240.94911 57.726191 L 253.2357 57.726191 L 265.33729 13.148551 L 255.52032 13.148551 L 253.0507 23.027535 L 240.33158 23.027535 L 237.80047 13.148551 L 228.60051 13.148551 z M 457.44339 14.339176 C 446.14582 14.339176 437.08598 23.344395 437.08598 34.641813 C 437.08598 45.939247 446.14582 55.054003 457.44339 55.054003 C 468.68619 55.054003 477.69125 45.939247 477.69125 34.641813 C 477.69125 23.344395 468.68619 14.339176 457.44339 14.339176 z M 457.44339 18.159615 C 466.44853 18.159615 473.87081 25.527464 473.87081 34.641813 C 473.87081 43.756178 466.44853 51.233564 457.44339 51.233564 C 448.27441 51.233564 440.90641 43.756178 440.90641 34.641813 C 440.90641 25.527464 448.27441 18.159615 457.44339 18.159615 z M 160.64084 18.334798 C 165.88888 18.334798 166.56761 23.27437 166.56761 34.69659 C 166.56761 46.118827 165.88888 51.058381 160.64084 51.058381 C 155.3928 51.058381 154.71355 46.118827 154.71355 34.69659 C 154.71355 23.27437 155.3928 18.334798 160.64084 18.334798 z M 113.26854 19.26084 L 118.08478 19.26084 C 124.56764 19.26084 124.56759 26.484943 124.56759 34.69659 C 124.56759 45.871863 123.45595 50.131823 117.77576 50.131823 L 113.26854 50.131823 L 113.26854 19.26084 z M 282.36932 19.26084 L 287.06154 19.26084 C 291.25993 19.26084 292.24779 22.348409 292.24779 25.991178 C 292.24779 28.954787 290.33396 31.97996 287.55557 31.97996 L 282.36932 31.97996 L 282.36932 19.26084 z M 449.52966 22.744348 L 449.52966 46.37598 L 454.87817 46.37598 L 454.87817 36.606551 L 456.24295 36.606551 C 460.39076 36.606551 459.95383 39.008347 459.95383 41.791764 C 459.95383 43.374501 459.95382 44.95698 460.66335 46.37598 L 465.90282 46.37598 C 465.41175 45.393606 465.30234 40.972773 465.30234 39.44462 C 465.30234 35.187619 461.80949 34.914973 460.66335 34.860404 L 460.66335 34.75085 C 464.15623 34.205087 465.41189 31.967927 465.41189 28.96619 C 465.41189 24.927494 463.06471 22.744348 459.40813 22.744348 L 449.52966 22.744348 z M 454.87817 26.673824 L 457.27957 26.673824 C 458.97155 26.673824 460.06338 27.547092 460.06338 29.784745 C 460.06338 31.312898 459.40816 33.277555 457.27957 33.277555 L 454.87817 33.277555 L 454.87817 26.673824 z M 242.18366 29.880863 L 251.07459 29.880863 L 246.56737 49.144286 L 246.44387 49.144286 L 242.18366 29.880863 z" />
                    </svg>
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
                                    <li><a href="#" class="trigger-contact"><span>CONTACTO</span></a></li>
                                    <li><a href="#"><span>PREGUNTAS FRECUENTES</span></a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">LEGALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="#" class="trigger-legales" data-section="terminos"><span>TÉRMINOS Y CONDICIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="privacidad"><span>POLÍTICA DE PRIVACIDAD</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="devoluciones"><span>DEVOLUCIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="cookies"><span>POLÍTICA DE COOKIES</span></a></li>
                                </ul>
                            </div>
                            <div class="footer-nav-column">
                                <h3 class="footer-nav-title font-condensed">SOCIALES</h3>
                                <ul class="footer-nav-list">
                                    <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><span>INSTAGRAM</span></a></li>
                                    <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"><span>TIKTOK</span></a></li>
                                </ul>
                            </div>
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
                    <svg class="footer-logo" viewBox="0 0 478.12614 58.217856" xmlns="http://www.w3.org/2000/svg" aria-label="GÜIDO CAPUZZI">
                        <path fill="#442517" d="M 48.131428 0.49144286 L 48.131428 7.1597696 L 54.984757 7.1597696 L 54.984757 0.49144286 L 48.131428 0.49144286 z M 59.059443 0.49144286 L 59.059443 7.1597696 L 65.913288 7.1597696 L 65.913288 0.49144286 L 59.059443 0.49144286 z M 16.297713 11.666988 C 1.0473499 11.666988 0.49144286 23.089065 0.49144286 34.32607 C 0.49144286 51.243328 2.2817719 57.726191 17.964278 57.726191 C 21.668745 57.726191 28.028462 56.738556 30.559891 56.244628 L 30.559891 33.647041 L 16.17369 33.647041 L 16.17369 40.50037 L 21.236946 40.50037 L 21.236946 50.378836 C 19.816945 50.872765 18.149793 51.243383 16.606221 51.243383 C 11.296574 51.243383 9.9378945 48.773745 9.9378945 34.820096 C 9.9378945 26.176234 9.9379213 18.334798 15.741675 18.334798 C 20.680963 18.334798 21.360049 21.97747 21.298441 26.114168 L 30.559891 26.114168 C 31.115605 16.791164 25.435397 11.666988 16.297713 11.666988 z M 160.64084 11.666988 C 145.26708 11.666988 145.2671 22.903906 145.2671 34.69659 C 145.2671 46.365792 145.26708 57.726191 160.64084 57.726191 C 176.0146 57.726191 176.01458 46.365792 176.01458 34.69659 C 176.01458 22.903906 176.0146 11.666988 160.64084 11.666988 z M 207.4323 11.666988 C 192.05854 11.666988 192.05856 22.903906 192.05856 34.69659 C 192.05856 46.365792 192.05854 57.726191 207.4323 57.726191 C 216.13784 57.726191 220.89194 53.898099 220.89194 41.981933 L 211.6925 41.981933 C 211.56893 45.50122 211.75428 51.058381 207.4323 51.058381 C 202.18426 51.058381 201.50501 46.118827 201.50501 34.69659 C 201.50501 23.27437 202.18426 18.334798 207.4323 18.334798 C 210.21069 18.334798 211.26049 20.557471 211.26049 26.484688 L 220.39791 26.484688 C 220.76827 16.914701 216.94052 11.666988 207.4323 11.666988 z M 41.833622 12.407511 L 41.833622 44.019535 C 41.833622 52.416414 46.773246 57.726191 57.022358 57.726191 C 68.382899 57.726191 72.149083 50.687645 72.149083 44.019535 L 72.149083 12.407511 L 62.826138 12.407511 L 62.826138 43.402001 C 62.826138 48.341342 60.973854 51.058381 56.898852 51.058381 C 53.502959 51.058381 51.156567 48.897021 51.156567 43.402001 L 51.156567 12.407511 L 41.833622 12.407511 z M 83.385607 12.407511 L 83.385607 56.985151 L 92.708552 56.985151 L 92.708552 12.407511 L 83.385607 12.407511 z M 103.94559 12.407511 L 103.94559 56.985151 L 119.13433 56.985151 C 135.06362 56.985151 134.01404 41.302919 134.01404 34.449576 C 134.01404 20.557677 131.72968 12.407511 119.50485 12.407511 L 103.94559 12.407511 z M 273.04638 12.407511 L 273.04638 56.985151 L 282.36932 56.985151 L 282.36932 38.833288 L 289.28415 38.833288 C 300.21255 38.833288 301.69424 30.806989 301.69424 25.744165 C 301.69424 17.59425 298.36055 12.407511 289.84019 12.407511 L 273.04638 12.407511 z M 309.40333 12.407511 L 309.40333 44.019535 C 309.40333 52.416414 314.34244 57.726191 324.59155 57.726191 C 335.95209 57.726191 339.71828 50.687645 339.71828 44.019535 L 339.71828 12.407511 L 330.39533 12.407511 L 330.39533 43.402001 C 330.39533 48.341342 328.54357 51.058381 324.46856 51.058381 C 321.07267 51.058381 318.72628 48.897021 318.72628 43.402001 L 318.72628 12.407511 L 309.40333 12.407511 z M 348.2914 12.407511 L 348.2914 19.26084 L 366.13475 19.26084 L 347.42737 48.835261 L 347.42737 56.985151 L 375.5812 56.985151 L 375.5812 50.131823 L 356.37979 50.131823 L 375.14919 20.495906 L 375.14919 12.407511 L 348.2914 12.407511 z M 384.15484 12.407511 L 384.15484 19.26084 L 401.9982 19.26084 L 383.29029 48.835261 L 383.29029 56.985151 L 411.44465 56.985151 L 411.44465 50.131823 L 392.24272 50.131823 L 411.01212 20.495906 L 411.01212 12.407511 L 384.15484 12.407511 z M 419.15322 12.407511 L 419.15322 56.985151 L 428.47617 56.985151 L 428.47617 12.407511 L 419.15322 12.407511 z M 228.60051 13.148551 L 240.94911 57.726191 L 253.2357 57.726191 L 265.33729 13.148551 L 255.52032 13.148551 L 253.0507 23.027535 L 240.33158 23.027535 L 237.80047 13.148551 L 228.60051 13.148551 z M 457.44339 14.339176 C 446.14582 14.339176 437.08598 23.344395 437.08598 34.641813 C 437.08598 45.939247 446.14582 55.054003 457.44339 55.054003 C 468.68619 55.054003 477.69125 45.939247 477.69125 34.641813 C 477.69125 23.344395 468.68619 14.339176 457.44339 14.339176 z M 457.44339 18.159615 C 466.44853 18.159615 473.87081 25.527464 473.87081 34.641813 C 473.87081 43.756178 466.44853 51.233564 457.44339 51.233564 C 448.27441 51.233564 440.90641 43.756178 440.90641 34.641813 C 440.90641 25.527464 448.27441 18.159615 457.44339 18.159615 z M 160.64084 18.334798 C 165.88888 18.334798 166.56761 23.27437 166.56761 34.69659 C 166.56761 46.118827 165.88888 51.058381 160.64084 51.058381 C 155.3928 51.058381 154.71355 46.118827 154.71355 34.69659 C 154.71355 23.27437 155.3928 18.334798 160.64084 18.334798 z M 113.26854 19.26084 L 118.08478 19.26084 C 124.56764 19.26084 124.56759 26.484943 124.56759 34.69659 C 124.56759 45.871863 123.45595 50.131823 117.77576 50.131823 L 113.26854 50.131823 L 113.26854 19.26084 z M 282.36932 19.26084 L 287.06154 19.26084 C 291.25993 19.26084 292.24779 22.348409 292.24779 25.991178 C 292.24779 28.954787 290.33396 31.97996 287.55557 31.97996 L 282.36932 31.97996 L 282.36932 19.26084 z M 449.52966 22.744348 L 449.52966 46.37598 L 454.87817 46.37598 L 454.87817 36.606551 L 456.24295 36.606551 C 460.39076 36.606551 459.95383 39.008347 459.95383 41.791764 C 459.95383 43.374501 459.95382 44.95698 460.66335 46.37598 L 465.90282 46.37598 C 465.41175 45.393606 465.30234 40.972773 465.30234 39.44462 C 465.30234 35.187619 461.80949 34.914973 460.66335 34.860404 L 460.66335 34.75085 C 464.15623 34.205087 465.41189 31.967927 465.41189 28.96619 C 465.41189 24.927494 463.06471 22.744348 459.40813 22.744348 L 449.52966 22.744348 z M 454.87817 26.673824 L 457.27957 26.673824 C 458.97155 26.673824 460.06338 27.547092 460.06338 29.784745 C 460.06338 31.312898 459.40816 33.277555 457.27957 33.277555 L 454.87817 33.277555 L 454.87817 26.673824 z M 242.18366 29.880863 L 251.07459 29.880863 L 246.56737 49.144286 L 246.44387 49.144286 L 242.18366 29.880863 z" />
                    </svg>
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
                    <a href="#" id="link-forgot-pwd" class="forgot-pwd">¿TE OLVIDASTE LA CONTRASEÑA?</a>
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
                    <button id="btn-login-submit" class="is-inactive font-condensed">
                        <span class="button-content">
                            <span class="button-text">ENTRAR</span>
                            <span class="button-icon spinner">
                                <span class="loader"></span>
                            </span>
                            <span class="button-icon check">
                                <svg class="check-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4" />
                                </svg>
                            </span>
                        </span>
                    </button>
                    <button id="btn-create-account" class="btn-outline font-condensed">CREAR UNA CUENTA</button>
                </div>
            </div>
        </section>

        <!-- STATE: ACCOUNT RECOVER PASSWORD -->
        <section id="account-recover" style="display: none;">
            <div class="login-container">
                <div class="login-header">
                    <h1 class="font-condensed">¿OLVIDASTE TU CONTRASEÑA?</h1>
                </div>
                <div class="login-fields">
                    <div class="input-group">
                        <label for="input-recover-email">EMAIL</label>
                        <input type="email" class="input-custom" id="input-recover-email" autocomplete="email">
                    </div>
                </div>
                <div class="login-actions">
                    <button id="btn-recover-submit" class="is-inactive font-condensed">
                        <span class="button-content">
                            <span class="button-text">ENVIAR LINK</span>
                            <span class="button-icon spinner">
                                <span class="loader"></span>
                            </span>
                            <span class="button-icon check">
                                <svg class="check-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4" />
                                </svg>
                            </span>
                        </span>
                    </button>
                    <button id="btn-back-to-login-from-recover" class="btn-outline font-condensed">VOLVER AL LOGIN</button>
                </div>
            </div>
        </section>

        <!-- STATE: NEW PASSWORD (llegó desde email de recuperación) -->
        <section id="account-new-password" style="display: none; opacity: 0;">
            <div class="login-container">
                <div class="login-header">
                    <h1 class="font-condensed">NUEVA CONTRASEÑA</h1>
                </div>
                <div class="login-fields">
                    <div class="input-group">
                        <label for="input-new-pwd">NUEVA CONTRASEÑA</label>
                        <input type="password" class="input-custom" id="input-new-pwd" autocomplete="new-password">
                    </div>
                    <div class="input-group">
                        <label for="input-new-pwd-confirm">CONFIRMAR CONTRASEÑA</label>
                        <input type="password" class="input-custom" id="input-new-pwd-confirm" autocomplete="new-password">
                    </div>
                </div>
                <div class="login-actions">
                    <button id="btn-new-pwd-submit" class="is-inactive font-condensed">
                        <span class="button-content">
                            <span class="button-text">GUARDAR CONTRASEÑA</span>
                            <span class="button-icon spinner">
                                <span class="loader"></span>
                            </span>
                            <span class="button-icon check">
                                <svg class="check-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4" />
                                </svg>
                            </span>
                        </span>
                    </button>
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
                    <button id="btn-final-create" class="is-inactive font-condensed">
                        <span class="button-content">
                            <span class="button-text">CREAR UNA CUENTA</span>
                            <span class="button-icon spinner">
                                <span class="loader"></span>
                            </span>
                            <span class="button-icon check">
                                <svg class="check-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4" />
                                </svg>
                            </span>
                        </span>
                    </button>
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
                    <button id="btn-contact-submit" class="is-inactive font-condensed">
                        <span class="button-content">
                            <span class="button-text">ENVIAR</span>
                            <span class="button-icon spinner">
                                <span class="loader"></span>
                            </span>
                            <span class="button-icon check">
                                <svg class="check-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4" />
                                </svg>
                            </span>
                        </span>
                    </button>
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

                    <!-- STEP 3: PAGO — NAVE Integration (Hidden by default) -->
                    <div id="checkout-step-pago" style="display: none;">

                        <!-- RESUMEN EXTENDIDO (Contacto + Dirección + Envío confirmados) -->
                        <div class="checkout-section">
                            <div class="checkout-section-header">
                                <h2 class="checkout-section-title font-condensed">RESUMEN</h2>
                            </div>
                            <div class="checkout-resumen-box">
                                <div class="resumen-row">
                                    <span class="resumen-label">Contacto</span>
                                    <span class="resumen-value" id="resumen-pago-email">—</span>
                                    <a href="#" class="resumen-cambiar" id="resumen-pago-cambiar-contacto">Cambiar</a>
                                </div>
                                <div class="resumen-divider"></div>
                                <div class="resumen-row">
                                    <span class="resumen-label">Envío a</span>
                                    <span class="resumen-value" id="resumen-pago-ubicacion">—</span>
                                    <a href="#" class="resumen-cambiar" id="resumen-pago-cambiar-ubicacion">Cambiar</a>
                                </div>
                                <div class="resumen-divider"></div>
                                <div class="resumen-row">
                                    <span class="resumen-label">Método</span>
                                    <span class="resumen-value" id="resumen-pago-envio">—</span>
                                    <a href="#" class="resumen-cambiar" id="resumen-pago-cambiar-envio">Cambiar</a>
                                </div>
                            </div>
                        </div>

                        <!-- MÉTODOS DE PAGO -->
                        <div class="checkout-section">
                            <div class="checkout-section-header">
                                <h2 class="checkout-section-title font-condensed">PAGO</h2>
                                <span class="pago-secure-badge">
                                    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.5 0L0 2.3V6C0 8.95 2.37 11.72 5.5 12.5C8.63 11.72 11 8.95 11 6V2.3L5.5 0Z" fill="currentColor" opacity="0.3"/>
                                        <path d="M3.5 6.2L4.9 7.6L7.5 5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Transacciones seguras y encriptadas
                                </span>
                            </div>

                            <!-- TAB: Tarjeta de crédito / débito -->
                            <div class="pago-metodo-tab pago-tab-activo" id="pago-tab-tarjeta">
                                <div class="pago-metodo-header" id="pago-header-tarjeta">
                                    <div class="pago-radio-circle"></div>
                                    <div class="pago-metodo-label">
                                        <span class="pago-metodo-nombre font-body">Tarjeta de crédito / débito</span>
                                        <div class="pago-metodo-icons">
                                            <span class="pago-card-badge visa">VISA</span>
                                            <span class="pago-card-badge mc">MC</span>
                                            <span class="pago-card-badge amex">AMEX</span>
                                            <span class="pago-card-badge cabal">CABAL</span>
                                            <span class="pago-card-badge naranja">NARANJA</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="pago-metodo-content" id="pago-content-tarjeta">
                                    <div id="nave-payment-container" class="nave-sdk-container">
                                        <div class="nave-sdk-loading" id="nave-sdk-loading">
                                            <div class="pago-spinner"></div>
                                            <span class="font-body">Inicializando pasarela de pago...</span>
                                        </div>
                                        <!-- RantySDK monta el formulario aquí -->
                                    </div>
                                    <p class="pago-nave-disclaimer font-body">Procesado de forma segura por <strong>NAVE · Banco Galicia</strong></p>
                                </div>
                            </div>

                            <!-- TAB: QR / MODO / Billetera virtual -->
                            <div class="pago-metodo-tab" id="pago-tab-qr">
                                <div class="pago-metodo-header" id="pago-header-qr">
                                    <div class="pago-radio-circle"></div>
                                    <div class="pago-metodo-label">
                                        <span class="pago-metodo-nombre font-body">QR · MODO · Billetera virtual</span>
                                        <div class="pago-metodo-icons">
                                            <span class="pago-card-badge modo">MODO</span>
                                            <span class="pago-card-badge bancos">BANCOS</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="pago-metodo-content" id="pago-content-qr">
                                    <div class="pago-qr-wrapper">
                                        <p class="pago-qr-instruccion font-body">
                                            Escaneá con tu app bancaria o billetera virtual.<br>
                                            En dispositivos móviles, abrí directamente con MODO.
                                        </p>
                                        <div class="pago-qr-frame">
                                            <div class="pago-qr-loading" id="pago-qr-loading">
                                                <div class="pago-spinner"></div>
                                                <span class="font-body">Generando código QR...</span>
                                            </div>
                                            <div id="pago-qr-image-wrapper" style="display: none;"></div>
                                        </div>
                                        <p class="pago-qr-expiry font-body" id="pago-qr-expiry"></p>
                                    </div>
                                    <p class="pago-nave-disclaimer font-body" style="margin-top: 18px;">Procesado de forma segura por <strong>NAVE · Banco Galicia</strong></p>
                                </div>
                            </div>

                            <!-- BANNER DE ERROR (oculto por defecto) -->
                            <div class="pago-error-banner" id="pago-error-banner" style="display: none;">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0; margin-top: 1px;">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M8 4.5V8.5M8 11H8.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                                <span class="font-body" id="pago-error-msg">Tu pago fue rechazado. Verificá los datos de la tarjeta o probá con otro método de pago.</span>
                            </div>

                        </div>
                        <!-- END MÉTODOS DE PAGO -->

                    </div>
                    <!-- END STEP 3 -->

                    <div class="checkout-actions">
                        <a href="#" class="checkout-back-link" id="checkout-back-link" style="display: none;">
                            ‹ Volver a Información
                        </a>
                        <button id="checkout-continue-btn" class="checkout-continue-btn font-condensed">
                            CONTINUAR A ENVÍOS
                        </button>
                        <button id="checkout-pay-btn" class="checkout-pay-btn font-condensed" style="display: none;">
                            PAGAR
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


        <!-- ═══════════════════════════════════════
             STATE: CONFIRMACIÓN DE PEDIDO
             ═══════════════════════════════════════ -->
        <section id="confirmation-container" style="display:none;">
            <div class="confirmacion-layout">
                <div class="confirmacion-container" id="confirmacion-inner">

                    <h1 class="confirmacion-titulo">Pedido confirmado</h1>
                    <div class="confirmacion-line" id="confirmacion-line"></div>
                    <div class="confirmacion-orden" id="confirmacion-orden"></div>

                    <!-- Products injected by JS -->
                    <div id="confirmacion-productos"></div>

                    <!-- Detail rows -->
                    <div class="confirmacion-row confirmacion-anim-row" id="confirmacion-envio">
                        <span class="confirmacion-label">Envio</span>
                        <span class="confirmacion-value" id="confirmacion-envio-value"></span>
                    </div>

                    <div class="confirmacion-row confirmacion-anim-row" id="confirmacion-direccion">
                        <span class="confirmacion-label">Direccion</span>
                        <span class="confirmacion-value" id="confirmacion-direccion-value"></span>
                    </div>

                    <div class="confirmacion-row confirmacion-anim-row" id="confirmacion-contacto">
                        <span class="confirmacion-label">Contacto</span>
                        <span class="confirmacion-value" id="confirmacion-contacto-value"></span>
                    </div>

                    <div class="confirmacion-row confirmacion-anim-row" id="confirmacion-pago">
                        <span class="confirmacion-label">Pago</span>
                        <span class="confirmacion-value" id="confirmacion-pago-value"></span>
                    </div>

                    <!-- Total -->
                    <div class="confirmacion-total confirmacion-anim-row" id="confirmacion-total">
                        <span class="total-label">Total</span>
                        <span class="total-value" id="confirmacion-total-value"></span>
                    </div>

                    <!-- CTA -->
                    <div class="confirmacion-cta confirmacion-anim-row" id="confirmacion-cta">
                        <button class="btn-volver" id="confirmacion-btn-volver">Volver al shop</button>
                        <p class="confirmacion-nota" id="confirmacion-nota"></p>
                    </div>

                </div>
            </div>
        </section>


        <!-- ═══════════════════════════════════════
             STATE: LEGALES
             ═══════════════════════════════════════ -->
        <section id="legales-container" style="display:none;">
            <div class="legales-layout">

                <!-- ── COLUMNA IZQUIERDA: Título + Nav ── -->
                <aside class="legales-sidebar">
                    <h1 class="legales-title">LEGALES</h1>
                    <nav class="legales-nav" aria-label="Secciones de legales">
                        <button class="legales-nav-link active" data-section="terminos">Términos y Condiciones</button>
                        <button class="legales-nav-link" data-section="privacidad">Política de Privacidad</button>
                        <button class="legales-nav-link" data-section="devoluciones">Devoluciones y Envíos</button>
                        <button class="legales-nav-link" data-section="cookies">Política de Cookies</button>
                    </nav>
                </aside>

                <!-- ── COLUMNA DERECHA: Contenido ── -->
                <div class="legales-content">

                    <!-- ─── TÉRMINOS Y CONDICIONES ─── -->
                    <section class="legales-section active" id="legales-terminos">
                        <h2 class="legales-section-title">Términos y Condiciones</h2>
                        <div class="legales-body">
                            <p>Los siguientes términos y condiciones rigen la venta de productos por parte de Güido Capuzzi a través de guido.com.ar. Al realizar una compra en el sitio, aceptás estos términos en su totalidad.</p>
                            <span class="legales-block-title">1. Pedidos y Productos</span>
                            <p>Todos los pedidos están sujetos a confirmación por email de nuestra parte. Los productos publicados en el sitio pueden estar agotados o discontinuados, y la disponibilidad no está garantizada. Los colores que se ven en pantalla pueden variar según el monitor del usuario.</p>
                            <span class="legales-block-title">2. Precios</span>
                            <p>Todos los precios están expresados en pesos argentinos (ARS) e incluyen IVA. Los precios pueden modificarse sin previo aviso. El monto total a pagar, incluyendo el costo de envío, se detalla antes de confirmar la compra.</p>
                            <span class="legales-block-title">3. Pago</span>
                            <p>Aceptamos pagos a través de NAVE (Banco Galicia), que incluye tarjetas de crédito, débito y transferencias bancarias. Al completar el pago, aceptás también los términos y condiciones del procesador de pagos correspondiente.</p>
                            <span class="legales-block-title">4. Envíos</span>
                            <p>Los envíos se realizan a través de OCA ePak a todo el país. El costo de envío se calcula en el checkout según el código postal de destino. Una vez despachado el pedido, te enviamos el número de seguimiento por email. Los tiempos de entrega dependen de OCA y pueden variar según la zona.</p>
                            <span class="legales-block-title">5. Devoluciones y Cambios</span>
                            <p>Consultar la sección Devoluciones y Envíos para conocer nuestra política completa.</p>
                            <span class="legales-block-title">6. Acuerdo Vinculante</span>
                            <p>La confirmación del pedido, estos términos y condiciones, y las demás políticas del sitio constituyen el acuerdo completo entre vos y Güido Capuzzi respecto a la compra realizada.</p>
                            <span class="legales-block-title">7. Ley Aplicable</span>
                            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier conflicto que surja será sometido a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.</p>
                            <span class="legales-block-title">8. Errores e Inexactitudes</span>
                            <p>Nos esforzamos por mantener la información del sitio actualizada y precisa. Sin embargo, puede haber errores tipográficos o de disponibilidad. Nos reservamos el derecho de corregirlos, cancelar un pedido o actualizar la información en cualquier momento sin previo aviso.</p>
                        </div>
                    </section>

                    <!-- ─── POLÍTICA DE PRIVACIDAD ─── -->
                    <section class="legales-section" id="legales-privacidad">
                        <h2 class="legales-section-title">Política de Privacidad</h2>
                        <span class="legales-update-date">Última actualización: Marzo 2026</span>
                        <div class="legales-body">
                            <p>En Güido Capuzzi nos tomamos en serio la protección de tus datos. Esta política explica qué información recopilamos, cómo la usamos y qué derechos tenés sobre ella.</p>
                            <span class="legales-block-title">1. Quiénes Somos</span>
                            <p>El responsable del tratamiento de los datos es Güido Capuzzi. Para cualquier consulta escribinos a <a href="mailto:shop@güidocapuzzi.com.ar">shop@güidocapuzzi.com.ar</a>.</p>
                            <span class="legales-block-title">2. Qué Datos Recopilamos</span>
                            <p>Cuando realizás una compra o te registrás en el sitio, recopilamos: nombre y apellido, dirección de email, número de teléfono, dirección de envío (calle, número, localidad, provincia y código postal), y los datos necesarios para procesar el pago a través de NAVE. Si te suscribís al newsletter, guardamos tu email con tu consentimiento expreso.</p>
                            <span class="legales-block-title">3. Para Qué Usamos Tus Datos</span>
                            <p>Usamos tus datos para procesar y gestionar tu pedido, coordinar el envío a través de OCA ePak, enviarte confirmaciones y novedades sobre tu compra, y, si lo autorizaste, enviarte comunicaciones sobre productos y lanzamientos de Güido Capuzzi.</p>
                            <span class="legales-block-title">4. Con Quiénes Compartimos Tus Datos</span>
                            <p>Tus datos pueden ser procesados por los siguientes terceros exclusivamente en el marco de la prestación de sus servicios: Supabase (base de datos), NAVE / Banco Galicia (procesamiento de pagos), OCA ePak (logística y envíos). No vendemos ni compartimos tus datos con terceros para fines publicitarios.</p>
                            <span class="legales-block-title">5. Seguridad</span>
                            <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración. Las transacciones de pago se procesan de forma encriptada a través de NAVE.</p>
                            <span class="legales-block-title">6. Cookies</span>
                            <p>Ver la sección Política de Cookies para más información.</p>
                            <span class="legales-block-title">7. Tus Derechos</span>
                            <p>De acuerdo con la Ley 25.326 de Protección de Datos Personales de la República Argentina, tenés derecho a acceder, rectificar, actualizar y suprimir tus datos personales en cualquier momento. Escribinos a <a href="mailto:shop@güidocapuzzi.com.ar">shop@güidocapuzzi.com.ar</a>. La AAIP es el organismo competente para atender denuncias y consultas sobre el cumplimiento de esta ley.</p>
                            <span class="legales-block-title">8. Cambios a Esta Política</span>
                            <p>Podemos actualizar esta política cuando sea necesario. Los cambios se publicarán en esta página con la fecha de última actualización.</p>
                        </div>
                    </section>

                    <!-- ─── DEVOLUCIONES Y ENVÍOS ─── -->
                    <section class="legales-section" id="legales-devoluciones">
                        <h2 class="legales-section-title">Devoluciones y Envíos</h2>
                        <div class="legales-body">
                            <span class="legales-block-title">Envíos</span>
                            <p>Despachamos de lunes a viernes en horario hábil, exceptuando feriados nacionales. Si hacés tu compra un viernes a la noche o durante el fin de semana, tu pedido será preparado y despachado el siguiente día hábil.</p>
                            <p>Todos los envíos se realizan a través de <strong>OCA ePak</strong> desde CABA. El costo se calcula automáticamente en el checkout según tu código postal de destino. Una vez despachado, te enviamos el número de seguimiento por email para que puedas rastrearlo en tiempo real.</p>
                            <span class="legales-block-title">Tiempos Estimados de Entrega</span>
                            <p>Los tiempos comienzan a contar desde que el pedido es despachado, no desde la compra. En días de alta demanda los tiempos pueden extenderse.</p>
                            <ul class="legales-list">
                                <li>CABA y GBA: 1 a 7 días hábiles.</li>
                                <li>Interior del país: 3 a 15 días hábiles.</li>
                            </ul>
                            <span class="legales-block-title">Modalidades de Envío</span>
                            <p><strong>Envío a domicilio:</strong> OCA realiza hasta dos intentos de entrega entre las 8 y las 18 hs de lunes a sábado. Si en la segunda visita tampoco hay nadie, el paquete se deriva a la sucursal OCA más cercana por 4 días hábiles. Pasado ese plazo, nos es devuelto y un nuevo envío correrá por cuenta del cliente.</p>
                            <p><strong>Envío a sucursal OCA:</strong> Disponible en todo el país. Suele ser más económico y rápido. Una vez llegado, el paquete se retiene por pocos días: si no lo retirás a tiempo, nos es devuelto.</p>
                            <p><strong>SmartLocker OCA:</strong> Disponible en supermercados y shoppings del AMBA, Córdoba y Neuquén. Al llegar tu paquete recibís un código único por SMS o email. Tenés 72 horas para retirarlo.</p>
                            <span class="legales-block-title">Cancelaciones</span>
                            <p>Los pedidos pueden cancelarse dentro de las primeras 24 horas desde la confirmación, siempre que no hayan sido empaquetados. Para cancelar, escribinos a <a href="mailto:shop@güidocapuzzi.com.ar">shop@güidocapuzzi.com.ar</a> con tu número de orden. Un pedido ya despachado no puede cancelarse.</p>
                            <span class="legales-block-title">Cambios de Talle</span>
                            <p>Realizamos cambios de talle dentro de los <strong>7 días corridos</strong> desde que recibís tu pedido. Únicamente cambios por el mismo producto en otro talle, sujeto a disponibilidad de stock. Para que el cambio sea válido, el producto debe:</p>
                            <ul class="legales-list">
                                <li>No haber sido usado, lavado ni alterado de ninguna forma.</li>
                                <li>Conservar todas sus etiquetas originales intactas.</li>
                                <li>Enviarse en su packaging original junto con el comprobante de compra.</li>
                            </ul>
                            <p>Para iniciar el cambio, escribinos a <a href="mailto:shop@güidocapuzzi.com.ar">shop@güidocapuzzi.com.ar</a> con tu número de orden y el talle que necesitás. Te enviamos la etiqueta de OCA sin costo. Si el talle no tiene stock, podés optar por una nota de crédito válida por 60 días corridos.</p>
                            <span class="legales-block-title">Defectos de Fabricación</span>
                            <p>Si tu producto presenta algún defecto de fabricación, escribinos a <a href="mailto:shop@güidocapuzzi.com.ar">shop@güidocapuzzi.com.ar</a> dentro de los 7 días de recibido con foto del defecto y tu número de orden. Evaluamos el caso y, de corresponder, enviamos un reemplazo o tramitamos el reembolso sin costo de envío.</p>
                        </div>
                    </section>

                    <!-- ─── POLÍTICA DE COOKIES ─── -->
                    <section class="legales-section" id="legales-cookies">
                        <h2 class="legales-section-title">Política de Cookies</h2>
                        <div class="legales-body">
                            <span class="legales-block-title">Qué Son las Cookies</span>
                            <p>Las cookies son pequeños archivos que se almacenan en tu dispositivo cuando visitás un sitio web. Nos permiten recordar tus preferencias y mejorar tu experiencia de navegación.</p>
                            <span class="legales-block-title">Qué Cookies Usamos</span>
                            <p>Usamos cookies estrictamente necesarias para el funcionamiento del sitio (como mantener el contenido de tu carrito), cookies de sesión para que el proceso de checkout funcione correctamente, y cookies analíticas para entender cómo se usa el sitio. No usamos cookies de publicidad ni compartimos datos de navegación con redes publicitarias.</p>
                            <span class="legales-block-title">Cómo Controlar las Cookies</span>
                            <p>Podés configurar tu navegador para bloquear o eliminar cookies en cualquier momento. Tené en cuenta que desactivar ciertas cookies puede afectar el funcionamiento del sitio, incluyendo el proceso de compra.</p>
                            <span class="legales-block-title">Cambios a Esta Política</span>
                            <p>Podemos actualizar esta política cuando incorporemos nuevas tecnologías al sitio. Los cambios se publicarán en esta página.</p>
                        </div>
                    </section>

                </div>
                <!-- /legales-content -->
            </div>
            <!-- /legales-layout -->
        </section>
        <!-- /legales-container -->

    </div><!-- END SITE WRAPPER -->

    <!-- ═══════════════════════════════════════
         COOKIE CONSENT BANNER
         ═══════════════════════════════════════ -->
    <div id="cookie-consent">
        <div class="cookie-inner">
            <p class="cookie-text">
                Usamos cookies para mejorar tu experiencia de navegación y analizar el uso del sitio.
                Al continuar navegando, aceptás nuestro uso de cookies.
                <a href="#" class="trigger-legales" data-section="cookies">Política de Cookies</a>
            </p>
            <div class="cookie-actions">
                <button class="cookie-btn-decline" id="cookie-decline">Rechazar</button>
                <button class="cookie-btn-accept font-condensed" id="cookie-accept"><span>ACEPTAR</span></button>
            </div>
        </div>
    </div>

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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <!-- Módulo de pago NAVE — Step 3 -->
    <script src="/js/checkout-payment.js"></script>
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
