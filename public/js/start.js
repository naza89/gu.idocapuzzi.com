
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. DATA & STATE VARIABLES
    // -------------------------------------------------------------------------

    // DOM Elements - Navigation & Wrappers
    const body = document.body;
    const shopTrigger = document.getElementById('shop-trigger');
    const homeTrigger = document.getElementById('home-trigger');
    const header = document.getElementById('main-header'); // Fixed ID reference
    const shopTitle = document.getElementById('shop-category-title');

    // NEW: Home Animation Elements
    const heroLogo = document.getElementById('hero-logo');
    const heroLogoContainer = document.getElementById('hero-logo-container');
    const headerLogo = document.getElementById('header-logo');
    const announcementBar = document.getElementById('announcement-bar');
    const homeContainer = document.getElementById('home-container');
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    // searchCursor now handled via CSS ::after

    // Constants
    const STATE_HOME = 'state-home';
    const STATE_SHOP = 'state-shop';
    const STATE_PDP = 'state-pdp';
    const STATE_ACCOUNT = 'state-account';
    const STATE_CONTACT = 'state-contact';
    const STATE_CHECKOUT = 'state-checkout';
    const STATE_LEGALES = 'state-legales';

    // History API — URLs por estado
    const URL_HOME = '/';
    const URL_SHOP = '/shop';
    const URL_PDP = '/shop/producto';
    const URL_ACCOUNT = '/cuenta';
    const URL_CONTACT = '/contacto';
    const URL_LEGALES = '/legales';

    // Animation Constants
    const LOGO_TRANSITION_START = 0;
    const LOGO_TRANSITION_END = 150; // px of scroll to complete transition
    const MARQUEE_HIDE_THRESHOLD = window.innerHeight * 0.8; // Hide marquee after 80% of viewport scroll

    // State Internal Variables
    let currentProductIndex = null;
    let cart = [];
    let isSearchOpen = false;
    let currentShopCategory = 'VER TODO'; // Track current shop category for filters

    // Cart DOM Elements
    const cartDrawer = document.getElementById('cart-drawer');
    const uiOverlay = document.getElementById('ui-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartTrigger = document.getElementById('cart-trigger');
    const cartCountHeader = document.getElementById('cart-trigger');
    const cartTitle = document.getElementById('cart-title'); // "CARRITO (X)" in Drawer
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');

    // Account DOM Elements
    const accountTrigger = document.getElementById('account-trigger');
    const accountLoginSection = document.getElementById('account-login');
    const inputEmail = document.getElementById('input-email');
    const inputPassword = document.getElementById('input-password');
    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const btnCreateAccountTrigger = document.getElementById('btn-create-account');

    // Create Account Elements
    const accountCreateSection = document.getElementById('account-create');
    const btnBackToLogin = document.getElementById('btn-back-to-login');
    const btnFinalCreate = document.getElementById('btn-final-create');
    const inputFname = document.getElementById('input-fname');
    const inputLname = document.getElementById('input-lname');
    const inputCreateEmail = document.getElementById('input-create-email');
    const inputCreatePwd = document.getElementById('input-create-pwd');
    const inputCreatePwdConfirm = document.getElementById('input-create-pwd-confirm');
    const inputRecoverEmail = document.getElementById('input-recover-email');

    // Recover Password Elements
    const accountRecoverSection = document.getElementById('account-recover');
    const linkForgotPwd = document.getElementById('link-forgot-pwd');
    const btnRecoverSubmit = document.getElementById('btn-recover-submit');
    const btnBackToLoginFromRecover = document.getElementById('btn-back-to-login-from-recover');

    // New Password Elements (post-email-link)
    const accountNewPasswordSection = document.getElementById('account-new-password');
    const inputNewPwd = document.getElementById('input-new-pwd');
    const inputNewPwdConfirm = document.getElementById('input-new-pwd-confirm');
    const btnNewPwdSubmit = document.getElementById('btn-new-pwd-submit');

    // Contact DOM Elements
    const accountContactSection = document.getElementById('account-contact');
    const btnContactSubmit = document.getElementById('btn-contact-submit');
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactMsg = document.getElementById('contact-msg');

    // Checkout DOM Elements
    const checkoutSection = document.getElementById('checkout');
    const checkoutCartItemsContainer = document.getElementById('checkout-cart-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutTotal = document.getElementById('checkout-total');
    const checkoutContinueBtn = document.getElementById('checkout-continue-btn');
    const checkoutLogoLink = document.getElementById('checkout-home-link');
    // But initially it's in the static HTML footer, so:
    const footerContactTrigger = document.getElementById('footer-contact-link');

    // Products Data Source
    const products = [
        // REMERAS (12: 3 Güido + 3 Afligida + 3 Baby Tee + 2 Termal + 1 extra)
        { slug: 'remera-guido-negro', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO<br>OVERSIZED', color: 'Negro', colorway: 'NEGRO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-güido-negra-front.png', 'assets/images/products/remera-güido-negra-back.png'] },
        { slug: 'remera-guido-rojo', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA LOGO GÜIDO<br>OVERSIZED', color: 'Rojo en Negro', colorway: 'ROJO EN NEGRO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-güido-rojo-front.png', 'assets/images/products/remera-güido-rojo-back.png'] },
        { slug: 'remera-guido-blanco', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO<br>OVERSIZED', color: 'Blanco', colorway: 'BLANCO', price: '$50.000', description: 'REMERA OVERSIZED 100% ALGODÓN. ESTAMPA GÜIDO EN RELIEVE. LIMPIEZA VISUAL.', images: ['assets/images/products/remera-güido-blanca-front.png', 'assets/images/products/remera-güido-blanca-back.png'] },
        { slug: 'remera-afligida-negro', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Negro', colorway: 'NEGRO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-negra-front.png', 'assets/images/products/remera-afligida-negra-back.png'] },
        { slug: 'remera-afligida-navy', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Navy', colorway: 'NAVY', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-navy-front.png', 'assets/images/products/remera-afligida-navy-back.png'] },
        { slug: 'remera-afligida-blanco', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Blanco', colorway: 'BLANCO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-blanca-front.png', 'assets/images/products/remera-afligida-blanca-back.png'] },

        // MUSCULOSAS (2)
        { slug: 'musculosa-negra', category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO<br>OVERSIZED', color: 'Negra', colorway: 'NEGRA', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-doble-simbolo-negra-front.png', 'assets/images/products/musculosa-doble-simbolo-negra-back.png'] },
        { slug: 'musculosa-blanca', category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO<br>OVERSIZED', color: 'Blanca', colorway: 'BLANCA', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-doble-simbolo-blanca-front.png', 'assets/images/products/musculosa-doble-simbolo-blanca-back.png'] },

        // JEANS (4)
        { slug: 'jean-selvedge-suelto-indigo', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE SUELTO.', images: ['assets/images/products/jean-indigo-suelto-front.png', 'assets/images/products/jean-indigo-suelto-back.png', 'assets/images/products/jean-indigo-fold.png'] },
        { slug: 'jean-selvedge-suelto-negro', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Negro', colorway: 'NEGRO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE SUELTO.', images: ['assets/images/products/jean-negro-suelto-front.png', 'assets/images/products/jean-negro-suelto-back.png', 'assets/images/products/jean-negro-fold.png'] },
        { slug: 'jean-selvedge-regular-indigo', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE REGULAR.', images: ['assets/images/products/jean-indigo-bootcut-front.png', 'assets/images/products/jean-indigo-bootcut-back.png', 'assets/images/products/jean-indigo-fold.png'] },
        { slug: 'jean-selvedge-regular-negro', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Negro', colorway: 'NEGRO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE REGULAR.', images: ['assets/images/products/jean-negro-bootcut-font.png', 'assets/images/products/jean-negro-bootcut-back.png', 'assets/images/products/jean-negro-fold.png'] },

        // BERMUDAS (2)
        { slug: 'bermuda-double-knee-negro', category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE', title: 'BERMUDA SELVEDGE<br>DOUBLE KNEE', color: 'Negro', colorway: 'NEGRO', price: '$175.000', description: 'WORKWEAR ESTILO.', images: ['assets/images/products/bermuda-DK-front.png', 'assets/images/products/bermuda-DK-back.png'] },
        { slug: 'bermuda-patchwork-indigo', category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE PATCHWORK', title: 'BERMUDA SELVEDGE<br>PATCHWORK', color: 'Índigo/Negro', colorway: 'ÍNDIGO/NEGRO', price: '$160.000', description: 'CONSTRUCCIÓN PATCHWORK.', images: ['assets/images/products/bermuda-patchwork-front.png', 'assets/images/products/bermuda-patchwork-back.png'] },

        // ARCHIVO (2)
        { slug: 'jean-intervenido-suela-roja', category: 'ARCHIVO', name: 'JEAN INTERVENIDO "SUELA ROJA" BOOTCUT', title: 'JEAN INTERVENIDO<br>"SUELA ROJA"<br>FIT BOOTCUT', color: 'Azul Lavado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO CON LAVADO NATURAL Y CORTE BOOTCUT. EL COLOR<br>BUSCA REINTERPRETAR EL LEGADO DE LA SUELA ROJA, FUNDIENDO<br>EL CELESTE CLÁSICO EN UN ROJO VIBRANTE. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA", images: ['assets/images/products/jean-archivo-1-front.png', 'assets/images/products/jean-archivo-1-back.png'] },
        { slug: 'jean-intervenido-encerado', category: 'ARCHIVO', name: 'JEAN INTERVENIDO "ENCERADO" BOOTCUT', title: 'JEAN INTERVENIDO<br>"ENCERADO"<br>FIT BOOTCUT', color: 'Negro Encerado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO DE CORTE BOOTCUT. PINTADO Y ENCERADO A MANO. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA.", images: ['assets/images/products/jean-archivo-2-front.png', 'assets/images/products/jean-archivo-2-back.png'] },

        // REMERA BABY TEE (3 colorways - mujer)
        { slug: 'baby-tee-negro', category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Negro', colorway: 'NEGRO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-negra-front.png'] },
        { slug: 'baby-tee-blanco', category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Blanco', colorway: 'BLANCO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-blanca-front.png'] },
        { slug: 'baby-tee-navy', category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Navy', colorway: 'NAVY', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-navy-front.png'] },

        // REMERA MANGA LARGA TERMAL (2 colorways)
        { slug: 'termal-negro', category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA<br>TERMAL', color: 'Negro', colorway: 'NEGRO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-termal-negra-front.png', 'assets/images/products/remera-termal-negra-back.png'] },
        { slug: 'termal-blanco', category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA<br>TERMAL', color: 'Blanco', colorway: 'BLANCO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-termal-blanca-front.png', 'assets/images/products/remera-termal-blanca-back.png'] },
    ];

    // -------------------------------------------------------------------------
    // 2. HOME ANIMATION LOGIC (Avant-Garde Premium)
    // -------------------------------------------------------------------------

    // Scroll Phase State Machine
    let scrollPhase = 0; // 0: initial, 1: logo morphed, 2: marquee hidden (free scroll)
    let isAnimating = false;
    let scrollLocked = true; // Lock scroll during phase transitions

    // Elements for parallax
    const selvedgeBlock = document.querySelector('.selvedge-block');
    const selvedgeSection = document.querySelector('.selvedge-section');

    // --- PHASE 1: LOGO MORPHING (B1 — Vector calculado hero → header) ---
    function triggerPhase1() {
        if (isAnimating || scrollPhase !== 0) return;
        isAnimating = true;
        console.log("[Scroll Phase] Triggering Phase 1: Logo Morphing");

        const heroRect = heroLogo ? heroLogo.getBoundingClientRect() : null;
        const headerRect = headerLogo ? headerLogo.getBoundingClientRect() : null;

        // Fallback: si el header logo no está renderizado, usar el morph original por clase
        if (!heroRect || !headerRect || headerRect.width === 0) {
            if (heroLogo) heroLogo.classList.add('morphed');
            if (headerLogo) headerLogo.classList.add('visible');
            setTimeout(() => {
                scrollPhase = 1;
                isAnimating = false;
                console.log("[Scroll Phase] Phase 1 Complete (fallback)");
            }, 800);
            return;
        }

        // Vector: centro heroLogo → centro headerLogo
        const heroCX = heroRect.left + heroRect.width / 2;
        const heroCY = heroRect.top + heroRect.height / 2;
        const headerCX = headerRect.left + headerRect.width / 2;
        const headerCY = headerRect.top + headerRect.height / 2;
        const dx = headerCX - heroCX;
        const dy = headerCY - heroCY;
        const scaleR = headerRect.width / heroRect.width;

        // Desactivar la transición CSS del hero para usar inline
        heroLogo.style.transition = 'none';
        heroLogo.style.transformOrigin = 'center center';
        void heroLogo.offsetWidth; // force reflow

        // 1. Arrancar: translate + scale con ease-structural (900ms)
        heroLogo.style.transition = 'transform 900ms cubic-bezier(0.16, 1, 0.3, 1)';
        heroLogo.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleR})`;

        // 2. Fade out del hero comienza tarde (cuando el logo ya está en camino)
        setTimeout(() => {
            heroLogo.style.transition += ', opacity 400ms ease';
            heroLogo.style.opacity = '0';
        }, 400);

        // 3. Header logo fade in sincronizado con llegada del hero
        setTimeout(() => {
            if (headerLogo) {
                headerLogo.style.transition = 'opacity 350ms ease';
                headerLogo.classList.add('visible');
            }
        }, 650);

        // 4. Limpieza: añadir clase morphed para que el CSS tome control, resetear inline
        setTimeout(() => {
            heroLogo.classList.add('morphed');
            heroLogo.style.transition = '';
            heroLogo.style.transform = '';
            heroLogo.style.opacity = '';
            heroLogo.style.transformOrigin = '';
            if (headerLogo) headerLogo.style.transition = '';

            scrollPhase = 1;
            isAnimating = false;
            console.log("[Scroll Phase] Phase 1 Complete (vector morph)");
        }, 920);
    }

    // --- PHASE 2: MARQUEE EXIT ---
    function triggerPhase2() {
        if (isAnimating || scrollPhase !== 1) return;
        isAnimating = true;
        console.log("[Scroll Phase] Triggering Phase 2: Marquee Exit");

        // Hide announcement bar
        if (announcementBar) {
            announcementBar.classList.add('hidden');
            body.classList.add('announcement-hidden');
        }

        // After animation completes, unlock scroll
        setTimeout(() => {
            scrollPhase = 2;
            isAnimating = false;
            scrollLocked = false;
            console.log("[Scroll Phase] Phase 2 Complete - Free Scroll Enabled");
        }, 600); // Match CSS transition duration
    }

    // --- DISCRETE SCROLL TRIGGER ---
    function handleWheelEvent(e) {
        if (!body.classList.contains(STATE_HOME)) return;

        // Only trigger on downward scroll
        if (e.deltaY > 0) {
            if (scrollPhase === 0 && !isAnimating) {
                e.preventDefault();
                triggerPhase1();
            } else if (scrollPhase === 1 && !isAnimating) {
                e.preventDefault();
                triggerPhase2();
            }
            // Phase 2+: normal scroll (no prevention)
        }

        // Upward scroll when at top: reverse phases
        if (e.deltaY < 0 && homeContainer.scrollTop === 0) {
            if (scrollPhase === 2 && !isAnimating) {
                isAnimating = true;
                // Show marquee again
                if (announcementBar) {
                    announcementBar.classList.remove('hidden');
                    body.classList.remove('announcement-hidden');
                }
                setTimeout(() => {
                    scrollPhase = 1;
                    isAnimating = false;
                    scrollLocked = true;
                }, 400);
            } else if (scrollPhase === 1 && !isAnimating) {
                isAnimating = true;
                // Unmute the logo
                if (heroLogo) {
                    heroLogo.classList.remove('morphed');
                }
                if (headerLogo) {
                    headerLogo.classList.remove('visible');
                }
                setTimeout(() => {
                    scrollPhase = 0;
                    isAnimating = false;
                }, 800);
            }
        }
    }

    // --- PARALLAX / STICKY DISPLACEMENT FOR SELVEDGE BLOCK ---
    // Moves the block so it stays pinned near the bottom of the viewport
    // as we scroll through the section, until it hits the layout limit.
    function handleParallax() {
        if (!selvedgeSection || !selvedgeBlock) return;
        if (!body.classList.contains(STATE_HOME)) return; // Only run on home

        const rect = selvedgeSection.getBoundingClientRect();
        const sectionHeight = selvedgeSection.offsetHeight;
        const blockHeight = selvedgeBlock.offsetHeight;
        const viewportHeight = window.innerHeight;

        // Viewport bottom position relative to the section top
        // (This value increases as we scroll down)
        const viewportBottomRelToSection = viewportHeight - rect.top;

        // Desired position: We want the block's bottom to be 50px from viewport bottom.
        // So Block Top = Viewport Bottom - 50px (margin) - Block Height
        const targetTop = viewportBottomRelToSection - 50 - blockHeight;

        // Constraints
        const initialTop = 100; // From CSS: top: 100px
        const maxTop = sectionHeight - 50 - blockHeight; // Stop 50px from section bottom

        // Clamp the target Top
        // 1. Don't start moving until the calculated position is below the initial 100px spot
        // 2. Stop moving once we hit the clearance at the bottom of the section
        let finalTop = Math.max(initialTop, Math.min(targetTop, maxTop));

        // Calculate translation needed from initial 100px
        const translate = finalTop - initialTop;

        selvedgeBlock.style.transform = `translateY(${translate}px)`;
    }

    // Attach wheel listener to home container
    if (homeContainer) {
        homeContainer.addEventListener('wheel', handleWheelEvent, { passive: false });
        homeContainer.addEventListener('scroll', handleParallax);
    }

    // --- HEADER HOVER & DROPDOWN EFFECT ---
    function setupHeaderHover() {
        // Universal cleanup function
        const clearHeaderState = () => {
            // Only rollback home animations if at the top (scrollPhase 0)
            if (scrollPhase === 0 && !isSearchOpen) {
                if (headerLogo) headerLogo.classList.remove('visible');
                header.classList.remove('header-hover');
            }

            // Always allow menu-open cleanup if not hovering the dropdown
            if (!isSearchOpen) {
                header.classList.remove('menu-open');
                header.classList.remove('header-hover');
            }
        };

        const headerRight = document.querySelector('.header-right');
        const headerLeft = document.querySelector('.header-left');
        const headerRightItems = headerRight ? headerRight.querySelectorAll('a, .search-trigger-wrapper') : [];
        const headerLeftItems = headerLeft ? headerLeft.querySelectorAll('a') : [];

        // Apply hover to navigation items (works on ALL pages, not just home)
        [...headerRightItems, ...headerLeftItems].forEach(item => {
            item.addEventListener('mouseenter', () => {
                header.classList.add('header-hover');
            });
        });

        // SHOP TRIGGER: Open Menu
        if (shopTrigger) {
            shopTrigger.addEventListener('mouseenter', () => {
                header.classList.add('menu-open');
                header.classList.add('header-hover');

                // Special case for Phase 0 Logo
                if (body.classList.contains(STATE_HOME) && scrollPhase === 0) {
                    if (headerLogo) headerLogo.classList.add('visible');
                }
            });
        }

        // GLOBAL HEADER LEAVE: Force cleanup
        header.addEventListener('mouseleave', (e) => {
            // If we are moving towards a child that handles its own leave (like dropdown), 
            // but usually we want to clear everything when mouse leaves the header area entirely.
            if (!isSearchOpen) {
                header.classList.remove('menu-open');
                header.classList.remove('header-hover');

                // Special cleanup for Phase 0 in home state
                if (body.classList.contains(STATE_HOME) && scrollPhase === 0) {
                    if (headerLogo) headerLogo.classList.remove('visible');
                }
            }
        });

        // Ensure shop dropdown stays open while hovering it, but closes when leaving the interaction wrapper
        const shopWrapper = document.querySelector('.shop-interaction-wrapper');
        if (shopWrapper) {
            shopWrapper.addEventListener('mouseleave', (e) => {
                // If exiting the wrapper entirely
                if (!header.contains(e.relatedTarget) || e.relatedTarget === null) {
                    if (!isSearchOpen) {
                        header.classList.remove('menu-open');
                        header.classList.remove('header-hover');

                        // Special cleanup for Phase 0 in home state
                        if (body.classList.contains(STATE_HOME) && scrollPhase === 0) {
                            if (headerLogo) headerLogo.classList.remove('visible');
                        }
                    }
                }
            });
        }
    }

    setupHeaderHover();

    // --- SEARCH OVERLAY LOGIC ---
    function openSearch(e) {
        if (e) e.preventDefault();
        isSearchOpen = true;
        body.classList.add('search-open');
        header.classList.add('header-hover'); // Keep header black while search is open

        // Focus input after animation
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 350);
    }

    function closeSearch() {
        isSearchOpen = false;
        body.classList.remove('search-open');

        // Only remove header-hover if not hovering
        if (!header.matches(':hover')) {
            header.classList.remove('header-hover');
        }

        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
        }
    }

    // Search trigger click
    if (searchTrigger) {
        searchTrigger.addEventListener('click', openSearch);
    }

    // Close search button
    const closeSearchBtn = document.getElementById('close-search');
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSearch();
        });
    }

    // Close search on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSearchOpen) {
            closeSearch();
        }
    });

    // Close search when clicking outside (on the overlay background or elsewhere)
    document.addEventListener('click', (e) => {
        if (isSearchOpen) {
            const isClickInsideSearch = searchOverlay && searchOverlay.contains(e.target);
            const isClickOnTrigger = (searchTrigger && searchTrigger.contains(e.target)) ||
                (searchCursor && searchCursor.contains(e.target));

            if (!isClickInsideSearch && !isClickOnTrigger) {
                closeSearch();
            }
        }
    });

    // --- RESET HOME STATE (extend existing function) ---
    function resetHomeAnimations() {
        // Reset scroll phase state machine
        scrollPhase = 0;
        isAnimating = false;
        scrollLocked = true;

        // Reset hero logo (remove morphed class)
        if (heroLogo) {
            heroLogo.classList.remove('morphed');
        }

        // Hide header logo
        if (headerLogo) {
            headerLogo.classList.remove('visible');
        }

        // Show announcement bar
        if (announcementBar) {
            announcementBar.classList.remove('hidden');
        }
        body.classList.remove('announcement-hidden');

        // Reset selvedge block parallax to initial position
        if (selvedgeBlock) {
            selvedgeBlock.style.transform = 'translateY(0)';
        }

        // Close search if open
        closeSearch();

        // Remove header hover
        header.classList.remove('header-hover');

        // Reset scroll position of home container
        if (homeContainer) {
            homeContainer.scrollTop = 0;
        }
    }

    // -------------------------------------------------------------------------
    // 3. LOGIC & FUNCTIONS (Original)
    // -------------------------------------------------------------------------

    // --- CART LOGIC ---
    function openCart(e) {
        if (e) e.preventDefault();
        body.classList.add('cart-open');
        renderCart();
    }

    function closeCart() {
        body.classList.remove('cart-open');
    }

    function addToCart(productIndex, size = 'M', qty = 1) {
        const product = products[productIndex];
        if (!product) return;

        const existingItem = cart.find(item => item.productIndex == productIndex && item.size == size);

        if (existingItem) {
            existingItem.qty += qty;
            // Move updated item to the END of array (which becomes TOP in LIFO render)
            // Or just leave it? Ref said "Last In First Out". So recently modified should arguably go to top.
            // Let's re-push it to be safe for LIFO.
            const idx = cart.indexOf(existingItem);
            cart.splice(idx, 1);
            cart.push(existingItem);
        } else {
            cart.push({
                productIndex: productIndex,
                name: product.name,
                priceString: product.price,
                // Clean price string for calculation
                priceValue: parseInt(product.price.replace('$', '').replace('.', '')),
                image: (() => { const raw = product.images && product.images.length > 0 ? product.images[0] : ''; return raw && !raw.startsWith('/') ? '/' + raw : raw; })(),
                size: size,
                qty: qty,
                color: product.color
            });
        }
        updateCartCounts();
        // openCart() se llama externamente (PDP: después de la barra de carga)
    }

    /**
     * Formatea un número como precio argentino: puntos para miles, coma para decimales.
     * Ej: 45000 → "45.000,00"  |  8000 → "8.000,00"  |  53000 → "53.000,00"
     * @param {number} valor - Valor en pesos (puede tener decimales)
     * @returns {string} Precio formateado sin el signo $
     */
    function formatearPrecioARS(valor) {
        const partes = valor.toFixed(2).split('.');
        const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return entero + ',' + partes[1];
    }

    function updateCartCounts() {
        const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
        const subtotal = cart.reduce((acc, item) => acc + (item.priceValue * item.qty), 0);

        // Update Global Header
        if (cartCountHeader) cartCountHeader.textContent = `Carrito (${totalQty})`;

        // Update Drawer Header
        if (cartTitle) cartTitle.textContent = `CARRITO (${totalQty})`;

        // Update Drawer Fixed Footer
        if (cartTotalPrice) cartTotalPrice.textContent = `$${formatearPrecioARS(subtotal)}`;
    }

    function renderCart() {
        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            if (cartEmptyMsg) cartEmptyMsg.style.display = 'block';
            return;
        }

        if (cartEmptyMsg) cartEmptyMsg.style.display = 'none';

        // LIFO RENDER: Map in reverse order
        const lifoCart = [...cart].reverse();

        cartItemsContainer.innerHTML = lifoCart.map((item, reverseIdx) => {
            // We need original index for updates
            const originalIdx = cart.indexOf(item);

            return `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img" alt="${item.name}">
                <div class="item-details">
                    <span class="item-name font-condensed">${item.name}</span>
                    <span class="item-color font-condensed">COLOR ${item.color.toUpperCase()}</span>
                    <span class="item-price font-condensed">${item.priceString}</span>
                    
                    <div class="cart-qty-selector">
                        <button class="cart-qty-btn" onclick="updateItemQty(${originalIdx}, -1)">-</button>
                        <span class="cart-qty-val font-condensed">${item.qty}</span>
                        <button class="cart-qty-btn" onclick="updateItemQty(${originalIdx}, 1)">+</button>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    // Expose global helper for inline HTML clicks
    window.updateItemQty = function (index, change) {
        if (cart[index]) {
            cart[index].qty += change;
            if (cart[index].qty <= 0) cart.splice(index, 1);

            // If item modified, should it move to top? Usually NO for simple qty change.
            updateCartCounts();
            renderCart();
        }
    };

    // --- FILTERS LOGIC ---
    const filtersDrawer = document.getElementById('filters-drawer');
    const closeFiltersBtn = document.getElementById('close-filters');
    const filtersTriggerBtn = document.querySelector('.filtros-btn');
    const filtersClearBtn = document.getElementById('filters-clear-btn');
    const filtersApplyBtn = document.getElementById('filters-apply-btn');

    function openFilters(e) {
        if (e) e.preventDefault();
        // Close cart if open
        body.classList.remove('cart-open');
        body.classList.add('filters-open');

        // Automatically update filters for current shop category
        updateFiltersForCategory(currentShopCategory);
    }

    function closeFilters() {
        body.classList.remove('filters-open');
    }

    // Filters trigger (FILTROS button in shop)
    if (filtersTriggerBtn) {
        filtersTriggerBtn.addEventListener('click', openFilters);
    }

    // Close filters button (X)
    if (closeFiltersBtn) {
        closeFiltersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFilters();
        });
    }

    // Overlay click to close (works for both cart and filters)
    if (uiOverlay) {
        uiOverlay.addEventListener('click', () => {
            if (body.classList.contains('cart-open')) {
                closeCart();
            }
            if (body.classList.contains('filters-open')) {
                closeFilters();
            }
        });
    }

    // ESC key to close filters
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && body.classList.contains('filters-open')) {
            closeFilters();
        }
    });

    // Clear all filters (QUITAR TODOS)
    if (filtersClearBtn) {
        filtersClearBtn.addEventListener('click', () => {
            // Reset all radio buttons to first option
            const radios = filtersDrawer.querySelectorAll('input[type="radio"]');
            radios.forEach((radio, index) => {
                radio.checked = index === 0; // First one checked
            });

            // Uncheck all checkboxes
            const checkboxes = filtersDrawer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }

    // Apply filters button (MOSTRAR) - just closes for now
    if (filtersApplyBtn) {
        filtersApplyBtn.addEventListener('click', () => {
            closeFilters();
        });
    }

    // --- DYNAMIC FILTERS UPDATE ---
    let currentFilterCategory = 'VER TODO'; // Track current category

    // Define color options for each category
    const categoryColorOptions = {
        'VER TODO': null, // No color filter in VER TODO
        'REMERAS': [
            { value: 'NEGRO', label: 'NEGRO', dataColor: null },
            { value: 'BLANCO', label: 'BLANCO', dataColor: null },
            { value: 'NAVY', label: 'NAVY', dataColor: 'navy' }
        ],
        'TOPS / MUSCULOSAS': [
            { value: 'NEGRO', label: 'NEGRO', dataColor: null },
            { value: 'BLANCO', label: 'BLANCO', dataColor: null }
        ],
        'PANTALONES / JEANS': [
            { value: 'ÍNDIGO', label: 'ÍNDIGO', dataColor: 'indigo' },
            { value: 'NEGRO', label: 'NEGRO', dataColor: null }
        ],
        'BERMUDAS / SHORTS': null, // No color filter in BERMUDAS
        'ARCHIVO': null // No color filter in ARCHIVO
    };

    function updateFiltersForCategory(category) {
        currentFilterCategory = category;

        const colorSection = document.getElementById('filter-section-color');
        const colorOptions = document.getElementById('filter-color-options');
        const ordenarSection = document.getElementById('filter-section-ordenar');
        const categoriaSection = document.getElementById('filter-section-categoria');

        const colors = categoryColorOptions[category];

        // Handle COLOR section visibility
        if (colors === null) {
            // No color filter for this category
            colorSection.style.display = 'none';
        } else {
            // Show color section and populate options
            colorSection.style.display = 'block';

            // Clear existing options
            colorOptions.innerHTML = '';

            // Create color checkboxes
            colors.forEach(colorOption => {
                const label = document.createElement('label');
                label.className = 'filter-checkbox';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.name = 'color';
                input.value = colorOption.value;
                if (colorOption.dataColor) {
                    input.setAttribute('data-color', colorOption.dataColor);
                }

                const checkboxSquare = document.createElement('span');
                checkboxSquare.className = 'checkbox-square';

                const checkboxLabel = document.createElement('span');
                checkboxLabel.className = 'checkbox-label';
                checkboxLabel.textContent = colorOption.label;

                label.appendChild(input);
                label.appendChild(checkboxSquare);
                label.appendChild(checkboxLabel);

                colorOptions.appendChild(label);
            });
        }

        // Handle CATEGORIA visibility - only show in VER TODO
        if (category === 'VER TODO') {
            categoriaSection.style.display = 'block';
        } else {
            categoriaSection.style.display = 'none';
        }

        // Handle ORDENAR POR inactive state for MUSCULOSAS and JEANS
        if (category === 'TOPS / MUSCULOSAS' || category === 'PANTALONES / JEANS') {
            ordenarSection.classList.add('inactive');
        } else {
            ordenarSection.classList.remove('inactive');
        }
    }

    // Initialize filters for VER TODO on page load
    updateFiltersForCategory('VER TODO');

    // Function to set current shop category (call when navigating between categories)
    function setShopCategory(category) {
        currentShopCategory = category;
        // Note: Filters will auto-update when drawer is opened via openFilters()
    }

    // Expose functions globally for shop integration
    window.updateFiltersForCategory = updateFiltersForCategory;
    window.setShopCategory = setShopCategory;

    // =========================================================================
    // A1 — SISTEMA DE TRANSICIÓN ENTRE ESTADOS (Plane Shift)
    // Exit: contenido cae (translateY + opacity), 260ms ease-cut
    // Enter: contenido emerge desde abajo con peso, 380ms ease-expose
    // =========================================================================

    // --- SLUG GENERATOR FOR PRODUCT URLs ---
    function generateSlug(product) {
        // Use explicit slug if provided
        if (product.slug) return product.slug;
        // Fallback: auto-generate from name + color
        const raw = `${product.name} ${product.color}`;
        return raw
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/["']/g, '')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    // Pre-compute slugs for all products
    products.forEach((p, i) => { p._slug = generateSlug(p); });

    // Find product index by slug
    function findProductBySlug(slug) {
        return products.findIndex(p => p._slug === slug);
    }

    // --- HISTORY API HELPER ---
    function pushHistory(stateObj) {
        let url;
        switch (stateObj.state) {
            case 'home':
                url = URL_HOME;
                break;
            case 'shop':
                url = stateObj.category && stateObj.category !== 'VER TODO'
                    ? `${URL_SHOP}?cat=${encodeURIComponent(stateObj.category)}`
                    : URL_SHOP;
                break;
            case 'pdp': {
                const pdpProduct = products[stateObj.productIndex];
                const slug = pdpProduct ? pdpProduct._slug : stateObj.productIndex;
                url = `/shop/${slug}`;
                break;
            }
            case 'account':
                url = URL_ACCOUNT;
                break;
            case 'contact':
                url = URL_CONTACT;
                break;
            case 'legales':
                url = URL_LEGALES;
                break;
            default:
                url = URL_HOME;
        }
        history.pushState(stateObj, '', url);
    }

    function getActiveSection() {
        if (body.classList.contains(STATE_HOME)) return document.getElementById('home-container');
        if (body.classList.contains(STATE_SHOP)) return document.getElementById('shop');
        if (body.classList.contains(STATE_PDP)) return document.getElementById('product-page');
        if (body.classList.contains(STATE_ACCOUNT) && !body.classList.contains(STATE_CONTACT)) {
            const candidates = [
                document.getElementById('account-login'),
                document.getElementById('account-create'),
                document.getElementById('account-recover'),
                document.getElementById('account-new-password'),
            ];
            return candidates.find(el => el && el.style.display !== 'none' && el.style.opacity !== '0') || null;
        }
        if (body.classList.contains(STATE_CONTACT)) return document.getElementById('account-contact');
        if (body.classList.contains(STATE_LEGALES)) return document.getElementById('legales-container');
        return null;
    }

    async function transitionState(exitEl, enterEl, enterDisplay, applyStateFn) {
        // 1. EXIT — cae hacia abajo y se desvanece
        if (exitEl) {
            exitEl.style.transition = 'transform 260ms cubic-bezier(0.4,0,1,1), opacity 200ms ease';
            exitEl.style.transform = 'translateY(28px)';
            exitEl.style.opacity = '0';
            await new Promise(r => setTimeout(r, 240));
            exitEl.style.display = 'none';
            exitEl.style.transform = '';
            exitEl.style.opacity = '';
            exitEl.style.transition = '';
        }
        // 2. ESTADO
        applyStateFn();
        // 3. ENTER — emerge desde abajo con peso
        if (enterEl) {
            enterEl.style.transform = 'translateY(28px)';
            enterEl.style.opacity = '0';
            enterEl.style.display = enterDisplay || 'block';
            void enterEl.offsetWidth;
            enterEl.style.transition = 'transform 380ms cubic-bezier(0.25,0,0,1), opacity 300ms ease';
            enterEl.style.transform = 'translateY(0)';
            enterEl.style.opacity = '1';
            setTimeout(() => {
                enterEl.style.transition = '';
                enterEl.style.transform = '';
                enterEl.style.opacity = '';
            }, 420);
        }
    }

    // =========================================================================

    // --- PDP LOGIC ---
    function enablePDPState(productIndex, skipHistory = false) {
        currentProductIndex = productIndex;
        if (!skipHistory) pushHistory({ state: 'pdp', productIndex: Number(productIndex) });
        const product = products[productIndex];
        if (!product) return;

        const exitEl = getActiveSection();
        const productPage = document.getElementById('product-page');

        // Pre-inyectar contenido ANTES de la animación
        if (productPage) {
            productPage.style.pointerEvents = 'auto';

            const images = product.images && product.images.length > 0 ? product.images : [];
            const imagesHTML = images.length > 0
                ? images.map(src => {
                    // Ensure absolute path (leading /)
                    const absSrc = src.startsWith('/') ? src : '/' + src;
                    return `<img src="${absSrc}" class="pdp-image" alt="${product.name}">`;
                }).join('')
                : '<div style="background:#f4f4f4; width:100%; height:100%; min-height:500px;"></div>';

            // Set page title per product
            document.title = `${product.name} ${product.color} — GÜIDO CAPUZZI`;
            const isArchive = product.category === 'ARCHIVO';
            const sizeOtherStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';
            const qtyContainerStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';

            productPage.innerHTML = `
                <div class="pdp-container vertical-stack-layout">
                    <div class="pdp-visual">${imagesHTML}</div>
                    <div class="pdp-info">
                        <div class="pdp-sticky-wrapper">
                            <div class="pdp-header">
                                <h1 class="font-condensed">${product.title || product.name}</h1>
                                <span class="pdp-colorway font-condensed">${product.colorway || product.color}</span>
                                <span class="pdp-price font-condensed">${product.price}</span>
                            </div>
                            <p class="pdp-description font-condensed">${product.description || 'DESCRIPCIÓN NO DISPONIBLE.'}</p>
                            <div class="pdp-selectors">
                                <div class="selector-group">
                                    <label>Talle</label>
                                    <div class="size-options">
                                        <button class="size-btn" ${sizeOtherStyle}>XS</button>
                                        <button class="size-btn active">S</button>
                                        <button class="size-btn" ${sizeOtherStyle}>M</button>
                                        <button class="size-btn" ${sizeOtherStyle}>L</button>
                                    </div>
                                </div>
                                <div class="selector-group">
                                    <label>Cantidad</label>
                                    <div class="qty-selector" ${qtyContainerStyle}>
                                        <button class="qty-btn minus">-</button>
                                        <span class="qty-val">1</span>
                                        <button class="qty-btn plus">+</button>
                                    </div>
                                </div>
                            </div>
                            <button class="add-to-cart-btn font-condensed" id="pdp-add-btn">AÑADIR AL CARRITO</button>
                        </div>
                    </div>
                </div>
                <div class="related-section">
                    <div class="related-header"><h3 class="font-condensed">TAMBIÉN TE PUEDE GUSTAR</h3></div>
                    <div class="related-grid" id="related-grid"></div>
                </div>
                <footer class="shop-footer pdp-footer">
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
            `;

            // Resetear botón al entrar a cualquier PDP
            const addBtnReset = document.getElementById('pdp-add-btn');
            if (addBtnReset) {
                addBtnReset.textContent = 'AÑADIR AL CARRITO';
                addBtnReset.classList.remove('loading', 'done');
                addBtnReset.style.opacity = '';
                addBtnReset.style.transition = '';
                delete addBtnReset.dataset.adding;
            }

            initPDPInteractions();
            initPDPRelated();
            initFooterLogoReveal();
        }

        transitionState(exitEl, productPage, 'block', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES);
            body.classList.add(STATE_PDP);
            window.scrollTo(0, 0);
            [
                document.getElementById('shop'),
                document.getElementById('home-container'),
                document.getElementById('account-login'),
                document.getElementById('account-contact')
            ].forEach(s => { if (s && s !== exitEl) s.style.display = 'none'; });
        });
    }

    function initPDPInteractions() {
        const productPage = document.getElementById('product-page');
        if (!productPage) return;

        let selectedSize = 'M';
        let selectedQty = 1;

        // 1. Size Selection
        const sizeBtns = productPage.querySelectorAll('.size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedSize = btn.textContent;
            });
        });

        // 2. Quantity
        const qtyVal = productPage.querySelector('.qty-val');
        const minusBtn = productPage.querySelector('.minus');
        const plusBtn = productPage.querySelector('.plus');
        if (qtyVal) {
            minusBtn.addEventListener('click', () => {
                if (selectedQty > 1) { selectedQty--; qtyVal.textContent = selectedQty; }
            });
            plusBtn.addEventListener('click', () => {
                selectedQty++;
                qtyVal.textContent = selectedQty;
            });
        }

        // 3. Add to Cart — C3: barra de carga → AÑADIDO → drawer
        const addBtn = document.getElementById('pdp-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                if (addBtn.dataset.adding === '1') return;
                addBtn.dataset.adding = '1';

                // Registrar en el carrito
                addToCart(currentProductIndex, selectedSize, selectedQty);

                // FASE 1: texto AÑADIENDO... + barra roja (580ms CSS)
                addBtn.classList.add('loading');
                addBtn.style.transition = 'opacity 120ms ease';
                addBtn.style.opacity = '0';

                await new Promise(r => setTimeout(r, 130));
                addBtn.textContent = 'AÑADIENDO...';
                addBtn.style.opacity = '0.6';

                // Esperar que la barra CSS complete
                await new Promise(r => setTimeout(r, 620));

                // FASE 2: confirmación AÑADIDO.
                addBtn.style.opacity = '0';
                await new Promise(r => setTimeout(r, 130));
                addBtn.textContent = '— AÑADIDO —';
                addBtn.style.opacity = '0.75';
                addBtn.classList.remove('loading');
                addBtn.classList.add('done');
                addBtn.style.transition = '';

                // FASE 3: abrir drawer 400ms después
                await new Promise(r => setTimeout(r, 400));
                openCart();

                // Botón queda en estado AÑADIDO (inactivo para este producto)
                delete addBtn.dataset.adding;
            });
        }
    }

    function initPDPRelated() {
        const relatedContainer = document.getElementById('related-grid');
        if (!relatedContainer) return;

        // Random Selection
        const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 5);

        relatedContainer.innerHTML = shuffled.map(p => {
            const idx = products.indexOf(p);
            const img = p.images && p.images.length > 0 ? p.images[0] : '';
            const absImg = img && !img.startsWith('/') ? '/' + img : img;
            return `
             <div class="product-card" data-index="${idx}">
                <div class="product-image">
                   ${absImg ? `<img src="${absImg}" style="width:100%; height:100%; object-fit:cover;">` : ''}
                </div>
                <div class="product-info">
                    <span class="product-name">${p.name}</span>
                    <span class="product-color">${p.color}</span>
                    <span class="product-price">${p.price}</span>
                </div>
             </div>`
        }).join('');

        // Wire up ONLY these new cards
        relatedContainer.querySelectorAll('.product-card').forEach(c => {
            c.addEventListener('click', () => {
                const idx = c.dataset.index;
                if (idx !== undefined) enablePDPState(idx);
            });
        });
    }

    // --- SHOP LOGIC ---
    // Used for initial shop grid rendering
    function attachProductClickListeners() {
        // Only target shop grid cards, not related (handled separately)
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        const cards = grid.querySelectorAll('.product-card');
        cards.forEach(card => {
            // Clean slate assignment
            card.onclick = function () {
                const index = card.dataset.index;
                if (index !== undefined) enablePDPState(index);
            };
        });
    }

    // A3 — Shop Grid Stagger Reveal
    function revealProductCards(grid) {
        const cards = grid.querySelectorAll('.product-card');
        if (!cards.length) return;
        const maxDelay = 400;
        const staggerMs = Math.min(40, Math.floor(maxDelay / cards.length));

        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(18px)';
            card.style.transition = 'none';

            requestAnimationFrame(() => {
                setTimeout(() => {
                    card.style.transition = 'opacity 320ms ease, transform 380ms cubic-bezier(0.25,0,0,1)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                    setTimeout(() => {
                        card.style.transition = '';
                        card.style.transform = '';
                        card.style.opacity = '';
                    }, 400);
                }, i * staggerMs);
            });
        });
    }

    function updateShopContent(category) {
        if (shopTitle) shopTitle.textContent = category;

        // Update URL without adding a new history entry (category change within shop)
        const url = category !== 'VER TODO'
            ? `${URL_SHOP}?cat=${encodeURIComponent(category)}`
            : URL_SHOP;
        history.replaceState({ state: 'shop', category }, '', url);

        let filteredProducts = products;
        if (category !== 'VER TODO') {
            filteredProducts = products.filter(p => p.category === category);
        }

        const grid = document.getElementById('product-grid');
        const count = document.getElementById('shop-count');

        if (grid) {
            if (filteredProducts.length > 0) {
                grid.innerHTML = filteredProducts.map(product => {
                    const idx = products.indexOf(product);
                    const rawImgSrc = product.images && product.images.length > 0 ? product.images[0] : '';
                    const imageSrc = rawImgSrc && !rawImgSrc.startsWith('/') ? '/' + rawImgSrc : rawImgSrc;
                    const rawHoverSrc = product.images && product.images.length > 1 ? product.images[1] : null;
                    const hoverSrc = rawHoverSrc && !rawHoverSrc.startsWith('/') ? '/' + rawHoverSrc : rawHoverSrc;
                    return `
                    <div class="product-card" data-index="${idx}">
                        <div class="product-image">
                            ${imageSrc ? `
                                <img
                                    class="product-img-primary"
                                    src="${imageSrc}"
                                    alt="${product.name}"
                                    style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:2; transition: opacity 220ms ease;">
                                ${hoverSrc ? `
                                    <img
                                        class="product-img-hover"
                                        src="${hoverSrc}"
                                        alt="${product.name}"
                                        style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1; opacity:1;">
                                ` : ''}
                            ` : ''}
                        </div>
                        <div class="product-info">
                            <span class="product-name">${product.name}</span>
                            <span class="product-color">${product.color}</span>
                            <span class="product-price">${product.price}</span>
                        </div>
                    </div>
                `}).join('');
            } else {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;">SIN STOCK EN ESTA CATEGORÍA</div>';
            }
            attachProductClickListeners();
            revealProductCards(grid); // A3: stagger reveal
        }
        if (count) count.textContent = `${filteredProducts.length} Productos`;
    }

    function enableShopState(e, category = 'VER TODO', skipHistory = false) {
        if (e) e.preventDefault();
        if (!skipHistory) pushHistory({ state: 'shop', category });
        document.title = 'Shop — GÜIDO CAPUZZI';

        const exitEl = getActiveSection();
        const shopSection = document.getElementById('shop');

        // Always update shop content with the requested category
        updateShopContent(category);

        transitionState(exitEl, shopSection, 'block', () => {
            body.classList.remove(STATE_HOME, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES);
            body.classList.add(STATE_SHOP);
            [
                document.getElementById('account-login'),
                document.getElementById('account-contact'),
                document.getElementById('product-page'),
                document.getElementById('home-container')
            ].forEach(sec => { if (sec && sec !== exitEl) sec.style.display = 'none'; });
            if (shopSection) shopSection.style.pointerEvents = 'auto';
            header.style.backgroundColor = '';
            header.style.color = '';
        });
    }

    function enableHomeState(e, skipHistory = false) {
        if (e) e.preventDefault();
        if (!skipHistory) pushHistory({ state: 'home' });
        document.title = 'GÜIDO CAPUZZI';
        console.log("[Navigation] enableHomeState Triggered - Starting Sequence");

        const exitEl = getActiveSection();
        const homeContainerEl = document.getElementById('home-container');

        transitionState(exitEl, homeContainerEl, 'block', () => {
            if (typeof STATE_SHOP !== 'undefined') body.classList.remove(STATE_SHOP);
            if (typeof STATE_PDP !== 'undefined') body.classList.remove(STATE_PDP);
            if (typeof STATE_ACCOUNT !== 'undefined') body.classList.remove(STATE_ACCOUNT);
            if (typeof STATE_CONTACT !== 'undefined') body.classList.remove(STATE_CONTACT);
            if (typeof STATE_CHECKOUT !== 'undefined') body.classList.remove(STATE_CHECKOUT);
            if (typeof STATE_LEGALES !== 'undefined') body.classList.remove(STATE_LEGALES);

            body.style.overflow = '';
            body.style.height = '';
            body.style.backgroundColor = '';

            [
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('account-login'),
                document.getElementById('account-create'),
                document.getElementById('account-contact'),
                document.getElementById('checkout'),
                document.getElementById('legales-container')
            ].forEach(sec => {
                if (sec && sec !== exitEl) {
                    sec.style.display = 'none';
                    sec.style.opacity = '0';
                    sec.style.pointerEvents = 'none';
                }
            });

            body.classList.add(STATE_HOME);
            if (homeContainerEl) homeContainerEl.style.pointerEvents = 'auto';

            header.classList.remove('menu-open');
            header.style.removeProperty('background-color');
            header.style.removeProperty('color');
            header.style.removeProperty('display');
            header.style.display = 'flex';
            header.style.backgroundColor = 'transparent';
            header.style.color = 'var(--color-white)';

            const announcementBarEl = document.getElementById('announcement-bar');
            if (announcementBarEl) {
                announcementBarEl.style.removeProperty('display');
                announcementBarEl.style.display = 'flex';
                announcementBarEl.classList.remove('hidden');
            }
            body.classList.remove('announcement-hidden');

            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                if (homeContainerEl) homeContainerEl.scrollTop = 0;
            });

            resetHomeAnimations();
            console.log("[Navigation] Sequence Complete");
        });
    }

    // --- ACCOUNT LOGIC ---
    function enableAccountState(e, skipHistory = false) {
        if (e) e.preventDefault();
        if (!skipHistory) pushHistory({ state: 'account' });
        document.title = 'Cuenta — GÜIDO CAPUZZI';

        const exitEl = getActiveSection();
        const enterEl = accountLoginSection;

        transitionState(exitEl, enterEl, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT, STATE_LEGALES);
            body.classList.add(STATE_ACCOUNT);
            [
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('home-container'),
                document.getElementById('account-contact')
            ].forEach(sec => { if (sec && sec !== exitEl) sec.style.display = 'none'; });
            if (accountLoginSection) accountLoginSection.style.pointerEvents = 'auto';
            if (accountCreateSection) accountCreateSection.style.display = 'none';
            header.style.backgroundColor = '';
            header.style.color = '';
            window.scrollTo(0, 0);
            injectFooterInAccount();
        });
    }

    function switchToCreateAccount() {
        // Fade out Login
        if (accountLoginSection) {
            accountLoginSection.style.opacity = '0';
            setTimeout(() => {
                accountLoginSection.style.display = 'none';
                // Fade in Create
                if (accountCreateSection) {
                    accountCreateSection.style.display = 'flex';
                    setTimeout(() => {
                        accountCreateSection.style.opacity = '1';
                        window.scrollTo(0, 0);
                    }, 50);
                }
            }, 400);
        }
    }

    function switchToRecover() {
        // Fade out Login, fade in Recover
        if (accountLoginSection) {
            accountLoginSection.style.opacity = '0';
            setTimeout(() => {
                accountLoginSection.style.display = 'none';
                if (accountRecoverSection) {
                    accountRecoverSection.style.display = 'flex';
                    setTimeout(() => {
                        accountRecoverSection.style.opacity = '1';
                        window.scrollTo(0, 0);
                    }, 50);
                }
            }, 400);
        }
    }

    function switchToLogin() {
        // Fade out Create Account
        if (accountCreateSection) {
            accountCreateSection.style.opacity = '0';
            setTimeout(() => {
                accountCreateSection.style.display = 'none';
                // Fade in Login
                if (accountLoginSection) {
                    accountLoginSection.style.display = 'flex';
                    setTimeout(() => {
                        accountLoginSection.style.opacity = '1';
                        accountLoginSection.style.pointerEvents = 'auto';
                        window.scrollTo(0, 0);
                    }, 50);
                }
            }, 400);
        }
    }

    function enableContactState(e, skipHistory = false) {
        if (e) e.preventDefault();
        if (!skipHistory) pushHistory({ state: 'contact' });
        document.title = 'Contacto — GÜIDO CAPUZZI';

        const exitEl = getActiveSection();
        const enterEl = accountContactSection;

        transitionState(exitEl, enterEl, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_LEGALES);
            body.classList.add(STATE_ACCOUNT);
            body.classList.add(STATE_CONTACT);
            [
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('home-container'),
                accountLoginSection,
                accountCreateSection,
                accountRecoverSection,
                accountNewPasswordSection
            ].forEach(sec => {
                if (sec && sec !== exitEl) {
                    sec.style.display = 'none';
                    sec.style.opacity = '0';
                }
            });
            if (accountContactSection) accountContactSection.style.pointerEvents = 'auto';
            header.style.backgroundColor = '';
            header.style.color = '';
            window.scrollTo(0, 0);
            injectFooterInAccount();
        });
    }

    // --- LEGALES ---
    function enableLegalesState(targetSection, skipHistory = false) {
        if (!skipHistory) pushHistory({ state: 'legales' });
        document.title = 'Legales — GÜIDO CAPUZZI';

        const legalesContainer = document.getElementById('legales-container');
        if (!legalesContainer) return;

        const exitEl = getActiveSection();

        transitionState(exitEl, legalesContainer, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_CHECKOUT);
            body.classList.add(STATE_LEGALES);

            [
                document.getElementById('home-container'),
                document.getElementById('shop'),
                document.getElementById('product-page'),
                accountLoginSection,
                accountCreateSection,
                accountContactSection,
                accountRecoverSection,
                accountNewPasswordSection
            ].forEach(sec => {
                if (sec && sec !== exitEl) {
                    sec.style.display = 'none';
                    sec.style.opacity = '0';
                }
            });

            // Limpiar inline styles del header — el CSS de state-legales se encarga
            header.style.removeProperty('background-color');
            header.style.removeProperty('color');
            window.scrollTo(0, 0);

            // Activar sección (la pedida o la primera por defecto)
            activateLegalesSection(legalesContainer, targetSection || 'terminos');

            // Inicializar navegación interna (una sola vez)
            initLegalesNav(legalesContainer);
        });
    }

    function activateLegalesSection(container, section) {
        const navLinks = container.querySelectorAll('.legales-nav-link');
        const sections = container.querySelectorAll('.legales-section');
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        const targetLink = container.querySelector(`.legales-nav-link[data-section="${section}"]`);
        const targetEl = container.querySelector(`#legales-${section}`);
        // Fallback a terminos si no existe la sección
        if (targetLink) targetLink.classList.add('active');
        else { const first = container.querySelector('.legales-nav-link'); if (first) first.classList.add('active'); }
        if (targetEl) targetEl.classList.add('active');
        else { const first = container.querySelector('.legales-section'); if (first) first.classList.add('active'); }
    }

    function initLegalesNav(container) {
        // Remover listeners viejos clonando el nav (patrón seguro contra doble binding)
        if (container.dataset.navInit) return;
        container.dataset.navInit = '1';

        container.querySelectorAll('.legales-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                activateLegalesSection(container, link.dataset.section);
            });
        });
    }

    // --- CHECKOUT LOGIC ---
    function enableCheckoutState(e) {
        if (e) e.preventDefault();

        // Must have items in cart
        if (cart.length === 0) {
            console.warn('[Checkout] Cannot proceed - cart is empty');
            return;
        }

        // Close cart drawer first
        closeCart();

        // Update State Classes
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES);
        body.classList.add(STATE_CHECKOUT);

        // Hide ALL other containers
        const sectionsToHide = [
            document.getElementById('shop'),
            document.getElementById('product-page'),
            document.getElementById('home-container'),
            accountLoginSection,
            accountCreateSection,
            accountContactSection
        ];
        sectionsToHide.forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        // Hide header and announcement bar for standalone checkout feel
        if (header) {
            header.style.display = 'none';
        }
        const announcementBarEl = document.getElementById('announcement-bar');
        if (announcementBarEl) {
            announcementBarEl.style.display = 'none';
        }

        // Show Checkout Section
        if (checkoutSection) {
            checkoutSection.style.display = 'block';
            checkoutSection.style.opacity = '1';
            checkoutSection.style.pointerEvents = 'auto';
        }

        // Populate checkout sidebar with cart items
        renderCheckoutCart();

        // Scroll to top
        window.scrollTo(0, 0);
    }

    function renderCheckoutCart() {
        if (!checkoutCartItemsContainer) return;

        const subtotal = cart.reduce((acc, item) => acc + (item.priceValue * item.qty), 0);

        // Render cart items in checkout sidebar
        checkoutCartItemsContainer.innerHTML = cart.map(item => {
            return `
                <div class="checkout-cart-item">
                    <div class="checkout-item-image">
                        <img src="${item.image}" alt="${item.name}">
                        <span class="checkout-item-qty-badge">${item.qty}</span>
                    </div>
                    <div class="checkout-item-info">
                        <span class="checkout-item-name">${item.name}</span>
                        <span class="checkout-item-variant">${item.color} / ${item.size}</span>
                    </div>
                    <span class="checkout-item-price">${item.priceString}</span>
                </div>
            `;
        }).join('');

        // Update totals
        const formattedSubtotal = `$${formatearPrecioARS(subtotal)}`;
        if (checkoutSubtotal) checkoutSubtotal.textContent = formattedSubtotal;
        if (checkoutTotal) checkoutTotal.textContent = formattedSubtotal;
    }

    function initFooterLogoReveal() {
        const logos = document.querySelectorAll('.footer-logo:not([data-logo-init])');
        if (!logos.length) return;

        logos.forEach(logo => {
            logo.dataset.logoInit = 'true';

            // El home scrollea dentro de #home-container, no en window.
            // El shop/account usan window (root: null).
            const scrollRoot = logo.closest('#home-container') || null;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('revealed');
                        }, 120);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                root: scrollRoot,
                threshold: 0,
                rootMargin: '0px 0px -60px 0px'
            });

            observer.observe(logo);
        });
    }

    // [C4] initFooterShuffle eliminado — reemplazado por highlight L→R en CSS

    // ─── F1: MANIFESTO SCROLL REVEAL ───
    function initManifestoReveal() {
        const manifestos = document.querySelectorAll('.manifesto-text:not([data-manifesto-init])');
        if (!manifestos.length) return;

        manifestos.forEach(p => {
            p.dataset.manifestoInit = 'true';

            // Dividir por <br> en líneas individuales
            const rawHTML = p.innerHTML;
            const lines = rawHTML.split(/<br\s*\/?>/i);

            p.innerHTML = lines.map(line => line.trim() ? `
                <span class="manifesto-line" style="display:block; overflow:hidden;">
                    <span class="manifesto-line-inner" style="display:block; transform:translateY(105%); opacity:0;">
                        ${line.trim()}
                    </span>
                </span>` : '').filter(Boolean).join('');

            // El home scrollea dentro de #home-container
            const scrollRoot = p.closest('#home-container') || null;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lineInners = entry.target.querySelectorAll('.manifesto-line-inner');
                        lineInners.forEach((inner, i) => {
                            setTimeout(() => {
                                inner.style.transition = 'transform 380ms cubic-bezier(0.25,0,0,1), opacity 300ms ease';
                                inner.style.transform = 'translateY(0)';
                                inner.style.opacity = '1';
                            }, i * 80);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                root: scrollRoot,
                threshold: 0.15
            });

            observer.observe(p);
        });
    }

    function injectFooterInAccount() {
        const shopFooter = document.querySelector('.shop-footer');
        if (!shopFooter) return;

        // Función helper para append y limpiar
        const appendAndReset = (parent) => {
            if (!parent.querySelector('.shop-footer')) {
                const clone = shopFooter.cloneNode(true);
                // Limpiar marcas de "ya inicializado" para que se re-inicialicen
                clone.querySelectorAll('a').forEach(a => {
                    // C4: shuffle eliminado, solo limpiar estilos inline residuales
                    a.style.width = '';
                    a.style.display = '';
                    a.style.textAlign = '';
                });
                // Limpiar el logo para que el reveal se active de nuevo
                clone.querySelectorAll('.footer-logo').forEach(logo => {
                    delete logo.dataset.logoInit;
                    logo.classList.remove('revealed');
                });
                // Limpiar el manifesto para que el reveal se active de nuevo
                clone.querySelectorAll('.manifesto-text').forEach(p => {
                    delete p.dataset.manifestoInit;
                });
                parent.appendChild(clone);
            }
        };

        if (accountLoginSection) appendAndReset(accountLoginSection);
        if (accountCreateSection) appendAndReset(accountCreateSection);
        if (accountContactSection) appendAndReset(accountContactSection);

        // Re-initialize logo reveal + manifesto reveal para footers clonados
        setTimeout(() => {
            initFooterLogoReveal();
            initManifestoReveal();
        }, 50);
    }



    function checkLoginInputs() {
        if (inputEmail && inputPassword && inputEmail.value.trim() !== '' && inputPassword.value.trim() !== '') {
            btnLoginSubmit.classList.remove('is-inactive');
            btnLoginSubmit.classList.add('is-active');
        } else if (btnLoginSubmit) {
            btnLoginSubmit.classList.add('is-inactive');
            btnLoginSubmit.classList.remove('is-active');
        }
    }

    // --- CREATE ACCOUNT INPUT VALIDATION ---
    function checkCreateAccountInputs() {
        if (inputFname && inputLname && inputCreateEmail && inputCreatePwd && inputCreatePwdConfirm) {
            const allFilled = inputFname.value.trim() !== '' &&
                inputLname.value.trim() !== '' &&
                inputCreateEmail.value.trim() !== '' &&
                inputCreatePwd.value.trim() !== '' &&
                inputCreatePwdConfirm.value.trim() !== '';
            if (allFilled && btnFinalCreate) {
                btnFinalCreate.classList.remove('is-inactive');
                btnFinalCreate.classList.add('is-active');
            } else if (btnFinalCreate) {
                btnFinalCreate.classList.add('is-inactive');
                btnFinalCreate.classList.remove('is-active');
            }
        }
    }

    // --- RECOVER PASSWORD INPUT VALIDATION ---
    function checkRecoverInputs() {
        if (inputRecoverEmail && inputRecoverEmail.value.trim() !== '') {
            if (btnRecoverSubmit) {
                btnRecoverSubmit.classList.remove('is-inactive');
                btnRecoverSubmit.classList.add('is-active');
            }
        } else if (btnRecoverSubmit) {
            btnRecoverSubmit.classList.add('is-inactive');
            btnRecoverSubmit.classList.remove('is-active');
        }
    }

    // --- CONTACT FORM INPUT VALIDATION ---
    function checkContactInputs() {
        if (contactName && contactEmail && contactMsg) {
            const allFilled = contactName.value.trim() !== '' &&
                contactEmail.value.trim() !== '' &&
                contactMsg.value.trim() !== '';
            if (allFilled && btnContactSubmit) {
                btnContactSubmit.classList.remove('is-inactive');
                btnContactSubmit.classList.add('is-active');
            } else if (btnContactSubmit) {
                btnContactSubmit.classList.add('is-inactive');
                btnContactSubmit.classList.remove('is-active');
            }
        }
    }

    // -------------------------------------------------------------------------
    // 3. INITIALIZATION & EVENT BINDING
    // -------------------------------------------------------------------------

    // Navbar Links
    if (shopTrigger) shopTrigger.addEventListener('click', enableShopState);
    if (homeTrigger) homeTrigger.addEventListener('click', enableHomeState);
    if (accountTrigger) accountTrigger.addEventListener('click', enableAccountState);

    // Login Validation
    if (inputEmail) inputEmail.addEventListener('input', checkLoginInputs);
    if (inputPassword) inputPassword.addEventListener('input', checkLoginInputs);

    // Create Account Validation
    if (inputFname) inputFname.addEventListener('input', checkCreateAccountInputs);
    if (inputLname) inputLname.addEventListener('input', checkCreateAccountInputs);
    if (inputCreateEmail) inputCreateEmail.addEventListener('input', checkCreateAccountInputs);
    if (inputCreatePwd) inputCreatePwd.addEventListener('input', checkCreateAccountInputs);
    if (inputCreatePwdConfirm) inputCreatePwdConfirm.addEventListener('input', checkCreateAccountInputs);

    // Recover Password Validation
    if (inputRecoverEmail) inputRecoverEmail.addEventListener('input', checkRecoverInputs);

    // Contact Form Validation
    if (contactName) contactName.addEventListener('input', checkContactInputs);
    if (contactEmail) contactEmail.addEventListener('input', checkContactInputs);
    if (contactMsg) contactMsg.addEventListener('input', checkContactInputs);

    // Navbar Links - Logo Click -> Home Reset
    const logoLink = document.querySelector('.logo');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            enableHomeState(e);
        });
    }

    // Create Account Flow
    if (btnCreateAccountTrigger) {
        btnCreateAccountTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            switchToCreateAccount();
        });
    }

    if (btnBackToLogin) {
        btnBackToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLogin();
        });
    }

    // Recover Password Flow
    if (linkForgotPwd) {
        linkForgotPwd.addEventListener('click', (e) => {
            e.preventDefault();
            switchToRecover();
        });
    }

    if (btnBackToLoginFromRecover) {
        btnBackToLoginFromRecover.addEventListener('click', (e) => {
            e.preventDefault();
            switchToLogin();
        });
    }

    // Contact Trigger (Global Delegation for class .trigger-contact)
    document.addEventListener('click', (e) => {
        const contactLink = e.target.closest('.trigger-contact');
        if (contactLink) {
            e.preventDefault();
            enableContactState(e);
        }
    });

    // Legales Trigger (Global Delegation for class .trigger-legales)
    document.addEventListener('click', (e) => {
        const legalesLink = e.target.closest('.trigger-legales');
        if (legalesLink) {
            e.preventDefault();
            const section = legalesLink.dataset.section || 'terminos';
            enableLegalesState(section);
        }
    });

    // Navbar Hover Interactions handled in setupHeaderHover()
    // (Listeners removed from here to avoid duplication)

    // Category Dropdown
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-cat');
            header.classList.remove('menu-open');
            enableShopState(null, category);
            setShopCategory(category); // Update filters category automatically
            if (document.activeElement) document.activeElement.blur();
        });
    });

    // Cart Global Toggles
    if (cartTrigger) cartTrigger.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (uiOverlay) uiOverlay.addEventListener('click', closeCart);

    // Checkout Button (INICIAR COMPRA in cart drawer)
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            enableCheckoutState(e);
        });
    }

    // Checkout Logo -> Return to Home (Use event delegation for re-entry support)
    document.addEventListener('click', (e) => {
        const logoLink = e.target.closest('#checkout-home-link');
        if (logoLink) {
            e.preventDefault();
            enableHomeState(e);
        }
    });

    // Checkout "CONTINUAR A ENVÍOS" Button → Save client + order to Supabase
    // Then transitions to Step 2 (Envío) on success
    let checkoutCurrentStep = 1;

    if (checkoutContinueBtn) {
        checkoutContinueBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (checkoutCurrentStep === 1) {
                // === STEP 1: Save to Supabase, then move to Step 2 ===
                if (window.limpiarErroresCheckout) limpiarErroresCheckout();
                if (window.setBotonCargando) setBotonCargando(true);

                try {
                    const resultado = await window.procesarCheckoutStep1(cart);

                    if (resultado.success) {
                        console.log('[Checkout] ✅ Orden pendiente creada:', resultado.numeroOrden, '| ID:', resultado.ordenId);
                        // Guardar el UUID de la orden para usarlo en Step 3 (NAVE)
                        // NAVE external_payment_id acepta máx 36 chars — un UUID tiene exactamente 36
                        window._currentCheckoutOrdenId = resultado.ordenId;
                        window._currentCheckoutNumeroOrden = resultado.numeroOrden;
                        mostrarCheckoutStep2();
                    } else {
                        if (window.mostrarErroresCheckout) {
                            mostrarErroresCheckout(resultado.errors);
                        }
                    }
                } catch (error) {
                    console.error('[Checkout] Error inesperado:', error);
                    if (window.mostrarErroresCheckout) {
                        mostrarErroresCheckout(['Error de conexión. Intentá nuevamente.']);
                    }
                } finally {
                    if (window.setBotonCargando) setBotonCargando(false);
                }

            } else if (checkoutCurrentStep === 2) {
                // === STEP 2: Validate shipping selection, persist in Supabase, then move to Step 3 ===
                const selectedEnvio = document.querySelector('input[name="metodo-envio"]:checked');
                if (!selectedEnvio) {
                    alert('Por favor seleccioná un método de envío.');
                    return;
                }
                // If sucursal selected, check branch selection
                if (selectedEnvio.value === 'sucursal') {
                    const selectedSucursal = document.querySelector('input[name="sucursal"]:checked');
                    if (!selectedSucursal) {
                        alert('Por favor seleccioná una sucursal.');
                        return;
                    }
                }

                // Armar texto legible del método de envío seleccionado
                const envioOpcionEl = selectedEnvio.closest('.envio-opcion');
                const envioNombre = envioOpcionEl?.querySelector('.envio-opcion-nombre')?.textContent?.trim() || '';
                const envioPrecio = envioOpcionEl?.querySelector('.envio-opcion-precio')?.textContent?.trim() || '';
                const metodoEnvioTexto = envioPrecio ? `${envioNombre} · ${envioPrecio}` : envioNombre;

                // Calcular total con envío
                const envioPrecioNum = parseFloat((envioOpcionEl?.dataset?.precio || '0')) / 100;
                const subtotalNum = cart.reduce((acc, item) => acc + (item.priceValue * item.qty), 0);
                const totalARS = subtotalNum + envioPrecioNum;

                // Datos de Step 1 para el resumen del Step 3
                const emailVal = document.getElementById('checkout-email')?.value || '—';
                const direccionVal = document.getElementById('checkout-direccion')?.value || '';
                const ciudadVal = document.getElementById('checkout-ciudad')?.value || '';
                const provinciaVal = document.getElementById('checkout-provincia')?.value || '';
                const cpVal = document.getElementById('checkout-cp')?.value || '';
                const ubicacion = [direccionVal, ciudadVal, provinciaVal, cpVal].filter(Boolean).join(', ');

                // Guardar en globals para onPagoExpirado() en checkout-payment.js
                window._checkoutTotalARS = totalARS;
                window._checkoutCartItems = cart;

                console.log('[Checkout] ✅ Envío seleccionado:', selectedEnvio.value, '→ persistiendo en Supabase');

                // ── PATCH /api/ordenes/{id} — Persistir envío en Supabase antes del Step 3 ──
                const ordenId = window._currentCheckoutOrdenId;
                if (ordenId) {
                    try {
                        if (window.setBotonCargando) setBotonCargando(true);

                        // Gather OCA-specific data from the selected option
                        const operativaOca = envioOpcionEl?.dataset?.operativa
                            ? parseInt(envioOpcionEl.dataset.operativa) : null;
                        let idSucursalOca = null;
                        if (selectedEnvio.value === 'sucursal') {
                            const selectedSucursalRadio = document.querySelector('input[name="sucursal"]:checked');
                            idSucursalOca = selectedSucursalRadio ? parseInt(selectedSucursalRadio.value) : null;
                        }

                        const patchRes = await fetch(`/api/ordenes/${ordenId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                tipo_envio: selectedEnvio.value === 'domicilio' ? 'puerta_puerta' : 'sucursal',
                                precio_envio: envioPrecioNum,
                                id_sucursal_oca: idSucursalOca,
                                operativa_oca: operativaOca,
                            }),
                        });

                        if (!patchRes.ok) {
                            const errData = await patchRes.json().catch(() => ({}));
                            console.error('[Checkout] Error PATCH ordenes:', errData);
                            alert('Error al guardar el envío. Intentá nuevamente.');
                            if (window.setBotonCargando) setBotonCargando(false);
                            return;
                        }

                        console.log('[Checkout] ✅ Envío persistido en Supabase → pasando a Step 3');
                    } catch (patchErr) {
                        console.error('[Checkout] Error de red PATCH ordenes:', patchErr);
                        alert('Error de conexión. Intentá nuevamente.');
                        if (window.setBotonCargando) setBotonCargando(false);
                        return;
                    } finally {
                        if (window.setBotonCargando) setBotonCargando(false);
                    }
                }

                // Invocar el módulo de pago (checkout-payment.js)
                if (typeof window.mostrarCheckoutStep3 === 'function') {
                    window.mostrarCheckoutStep3({
                        email: emailVal,
                        ubicacion: ubicacion,
                        metodoEnvio: metodoEnvioTexto,
                        ordenId: ordenId || `orden-${Date.now()}`,
                        totalARS: totalARS,
                        cartItems: cart
                    });
                } else {
                    console.error('[Checkout] checkout-payment.js no está cargado. Verificar orden de scripts.');
                    alert('Error al cargar el módulo de pago. Por favor recargá la página.');
                }
            }
        });
    }

    // ========================
    // STEP 2: ENVÍO FUNCTIONS
    // ========================

    function mostrarCheckoutStep2() {
        checkoutCurrentStep = 2;

        // 1. Populate RESUMEN with data from Step 1 form
        const email = document.getElementById('checkout-email')?.value || '—';
        const direccion = document.getElementById('checkout-direccion')?.value || '';
        const ciudad = document.getElementById('checkout-ciudad')?.value || '';
        const provincia = document.getElementById('checkout-provincia')?.value || '';
        const cp = document.getElementById('checkout-cp')?.value || '';
        const ubicacionParts = [direccion, ciudad, provincia, cp].filter(Boolean);

        const resumenEmail = document.getElementById('resumen-email');
        const resumenUbicacion = document.getElementById('resumen-ubicacion');
        if (resumenEmail) resumenEmail.textContent = email;
        if (resumenUbicacion) resumenUbicacion.textContent = ubicacionParts.join(', ') || '—';

        // 2. Hide Step 1 sections (CONTACTO + DIRECCIÓN)
        const step1Sections = document.querySelectorAll('#checkout .checkout-main > .checkout-section');
        step1Sections.forEach(section => {
            // Only hide Step 1 sections (not those inside #checkout-step-envio)
            if (!section.closest('#checkout-step-envio')) {
                section.style.display = 'none';
            }
        });

        // 3. Show Step 2
        const stepEnvio = document.getElementById('checkout-step-envio');
        if (stepEnvio) stepEnvio.style.display = 'block';

        // 4. Update breadcrumb
        const breadcrumbSteps = document.querySelectorAll('.breadcrumb-step');
        breadcrumbSteps.forEach((step, index) => {
            if (index === 1) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // 5. Update button text
        if (checkoutContinueBtn) {
            checkoutContinueBtn.textContent = 'CONTINUAR AL PAGO';
        }

        // 6. Show back link
        const backLink = document.getElementById('checkout-back-link');
        if (backLink) backLink.style.display = '';

        // 7. Scroll to top of checkout
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 8. Fetch real shipping options from OCA
        cargarOpcionesEnvioOCA(cp);

        console.log('[Checkout] → Step 2: Envío');
    }

    // ========================
    // OCA SHIPPING INTEGRATION
    // ========================

    async function cargarOpcionesEnvioOCA(cpDestino) {
        const metodoEnvioSection = document.querySelector('#checkout-step-envio .checkout-section:last-child');
        if (!metodoEnvioSection) return;

        // Calculate package weight from cart
        const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
        const pesoKg = totalItems * 0.3 + 0.1; // estimated: 0.3kg per garment + 0.1 packaging
        const alto = 3 * totalItems + 5;
        const ancho = 30;
        const largo = 35;
        const volumenM3 = (alto / 100) * (ancho / 100) * (largo / 100);
        const subtotalPesos = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

        // Show loading state in shipping section
        const headerEl = metodoEnvioSection.querySelector('.checkout-section-header');
        const existingOptions = metodoEnvioSection.querySelectorAll('.envio-opcion');
        existingOptions.forEach(el => el.style.opacity = '0.4');

        // Create a loading indicator if not present
        let loadingEl = metodoEnvioSection.querySelector('.envio-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'envio-loading';
            loadingEl.style.cssText = 'text-align:center;padding:20px 0;font-family:Univers,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#888;';
            loadingEl.textContent = 'Calculando opciones de envío...';
            if (headerEl) headerEl.after(loadingEl);
        }

        try {
            const res = await fetch('/api/oca/cotizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cpDestino: parseInt(cpDestino),
                    pesoKg,
                    volumenM3,
                    cantidadPaquetes: 1,
                    valorDeclarado: subtotalPesos,
                }),
            });

            const data = await res.json();

            if (!data.success || !data.opciones || data.opciones.length === 0) {
                // Fallback: show error
                if (loadingEl) loadingEl.textContent = 'No se pudieron obtener tarifas de envío. Intentá nuevamente.';
                existingOptions.forEach(el => el.style.opacity = '1');
                console.error('[OCA] Error cotizando:', data.error || 'Sin opciones');
                return;
            }

            // Remove loading indicator
            if (loadingEl) loadingEl.remove();

            // Remove old static options
            existingOptions.forEach(el => el.remove());

            // Build new option elements from OCA response
            const opciones = data.opciones;
            const containerEl = headerEl?.parentElement;
            if (!containerEl) return;

            opciones.forEach(opcion => {
                const tipo = opcion.nombre === 'puertaPuerta' ? 'domicilio' : 'sucursal';
                const nombreDisplay = tipo === 'domicilio' ? 'Envío a domicilio' : 'Retiro en sucursal';
                const precioCentavos = Math.round(opcion.precio * 100);
                const precioDisplay = '$' + formatearPrecioARS(opcion.precio);
                const plazoDisplay = opcion.diasHabiles > 0
                    ? `${opcion.diasHabiles} días hábiles`
                    : '3 a 5 días hábiles';
                const radioId = `envio-${tipo}`;
                const isExpandible = tipo === 'sucursal' ? ' envio-opcion-expandible' : '';

                const optionHTML = `
                    <div class="envio-opcion${isExpandible}" data-tipo="${tipo}" data-precio="${precioCentavos}" data-operativa="${opcion.operativa}">
                        <input type="radio" name="metodo-envio" id="${radioId}" value="${tipo}">
                        <label for="${radioId}" class="envio-opcion-label">
                            <div class="envio-opcion-header">
                                <span class="envio-opcion-nombre">${nombreDisplay}</span>
                                <span class="envio-opcion-precio">${precioDisplay}</span>
                            </div>
                            <div class="envio-opcion-detalle">
                                <span class="envio-opcion-plazo">${plazoDisplay}</span>
                            </div>
                        </label>
                        ${tipo === 'sucursal' ? `
                        <button type="button" class="envio-elegir-sucursal" id="btn-elegir-sucursal">
                            Elegir sucursal &nbsp;&rsaquo;
                        </button>
                        <div class="envio-sucursales" id="envio-sucursales-lista">
                            <p class="envio-sucursales-titulo">Sucursales cerca de tu domicilio:</p>
                            <div class="envio-sucursales-list" id="envio-sucursales-list-container">
                                <div class="envio-loading" style="text-align:center;padding:10px 0;font-family:Univers,sans-serif;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#888;">
                                    Cargando sucursales...
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;

                containerEl.insertAdjacentHTML('beforeend', optionHTML);
            });

            // Store operativa info for later use when creating the order
            window._ocaOpciones = opciones;

            console.log('[OCA] ✅ Opciones de envío cargadas:', opciones.length);

        } catch (err) {
            console.error('[OCA] Error de red al cotizar:', err);
            if (loadingEl) loadingEl.textContent = 'Error de conexión. Intentá nuevamente.';
            existingOptions.forEach(el => el.style.opacity = '1');
        }
    }

    // ========================
    // OCA SUCURSALES DYNAMIC LOADING
    // ========================

    async function cargarSucursalesOCA() {
        const cp = document.getElementById('checkout-cp')?.value || '';
        const container = document.getElementById('envio-sucursales-list-container');
        if (!container || !cp) return;

        container.innerHTML = '<div class="envio-loading" style="text-align:center;padding:10px 0;font-family:Univers,sans-serif;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Cargando sucursales...</div>';

        try {
            const res = await fetch(`/api/oca/sucursales?cp=${encodeURIComponent(cp)}`);
            const data = await res.json();

            if (!data.success || !data.sucursales || data.sucursales.length === 0) {
                container.innerHTML = '<p style="font-family:Univers,sans-serif;font-size:0.75rem;color:#888;padding:10px 0;">No se encontraron sucursales para tu código postal.</p>';
                return;
            }

            container.innerHTML = data.sucursales.map((suc, i) => `
                <div class="envio-sucursal-item${i === 0 ? ' active' : ''}">
                    <input type="radio" name="sucursal" id="sucursal-${suc.id}" value="${suc.id}"
                        ${i === 0 ? 'checked' : ''}
                        data-nombre="${suc.nombre}" data-direccion="${suc.calle} ${suc.nro}, ${suc.localidad}">
                    <label for="sucursal-${suc.id}">${suc.nombre}, ${suc.calle} ${suc.nro}, ${suc.localidad}</label>
                </div>
            `).join('');

            console.log('[OCA] ✅ Sucursales cargadas:', data.sucursales.length);

        } catch (err) {
            console.error('[OCA] Error cargando sucursales:', err);
            container.innerHTML = '<p style="font-family:Univers,sans-serif;font-size:0.75rem;color:#888;padding:10px 0;">Error al cargar sucursales.</p>';
        }
    }

    function volverAStep1() {
        checkoutCurrentStep = 1;

        // 1. Show Step 1 sections
        const step1Sections = document.querySelectorAll('#checkout .checkout-main > .checkout-section');
        step1Sections.forEach(section => {
            if (!section.closest('#checkout-step-envio')) {
                section.style.display = '';
            }
        });

        // 2. Hide Step 2
        const stepEnvio = document.getElementById('checkout-step-envio');
        if (stepEnvio) stepEnvio.style.display = 'none';

        // 3. Update breadcrumb
        const breadcrumbSteps = document.querySelectorAll('.breadcrumb-step');
        breadcrumbSteps.forEach((step, index) => {
            if (index === 0) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // 4. Restore button text
        if (checkoutContinueBtn) {
            checkoutContinueBtn.textContent = 'CONTINUAR A ENVÍOS';
        }

        // 5. Hide back link
        const backLink = document.getElementById('checkout-back-link');
        if (backLink) backLink.style.display = 'none';

        // 6. Reset shipping selections
        const envioRadios = document.querySelectorAll('input[name="metodo-envio"]');
        envioRadios.forEach(r => r.checked = false);
        document.querySelectorAll('.envio-opcion').forEach(opt => opt.classList.remove('selected'));

        // Reset branch expansion
        const sucursalesLista = document.getElementById('envio-sucursales-lista');
        if (sucursalesLista) sucursalesLista.classList.remove('expandido');
        const btnElegir = document.getElementById('btn-elegir-sucursal');
        if (btnElegir) btnElegir.style.display = '';

        // 7. Reset sidebar shipping note
        actualizarSidebarEnvio(null);

        // 8. Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        console.log('[Checkout] ← Step 1: Información');
    }

    // Back link handler
    document.addEventListener('click', (e) => {
        const backLink = e.target.closest('#checkout-back-link');
        if (backLink) {
            e.preventDefault();
            volverAStep1();
        }
    });

    // "Cambiar" links in RESUMEN → go back to Step 1
    document.addEventListener('click', (e) => {
        const cambiarLink = e.target.closest('.resumen-cambiar');
        if (cambiarLink) {
            e.preventDefault();
            volverAStep1();
        }
    });

    // ========================
    // SHIPPING OPTION RADIOS
    // ========================

    // Click on option box → select its radio
    document.addEventListener('click', (e) => {
        const opcionBox = e.target.closest('.envio-opcion');
        if (!opcionBox) return;

        // Don't interfere with branch radio clicks
        if (e.target.closest('.envio-sucursales')) return;

        const radio = opcionBox.querySelector('input[name="metodo-envio"]');
        if (radio && !radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Radio change → toggle .selected class + update sidebar
    document.addEventListener('change', (e) => {
        if (e.target.name === 'metodo-envio') {
            // Update selected state on all option boxes
            document.querySelectorAll('.envio-opcion').forEach(opt => {
                const thisRadio = opt.querySelector('input[name="metodo-envio"]');
                if (thisRadio && thisRadio.checked) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                    // Collapse branch list if unselecting sucursal
                    const sucursalesContainer = opt.querySelector('.envio-sucursales');
                    if (sucursalesContainer) {
                        sucursalesContainer.classList.remove('expandido');
                        const btnElegir = opt.querySelector('.envio-elegir-sucursal');
                        if (btnElegir) btnElegir.style.display = '';
                    }
                }
            });

            // Update sidebar with selected price
            const selectedOpcion = e.target.closest('.envio-opcion');
            const precioAttr = selectedOpcion?.getAttribute('data-precio');
            const precioCentavos = precioAttr ? parseInt(precioAttr) : null;
            actualizarSidebarEnvio(precioCentavos);
        }
    });

    // ========================
    // "ELEGIR SUCURSAL" BUTTON
    // ========================

    document.addEventListener('click', (e) => {
        const btnElegir = e.target.closest('#btn-elegir-sucursal');
        if (!btnElegir) return;
        e.preventDefault();

        // Expand branch list
        const sucursalesLista = document.getElementById('envio-sucursales-lista');
        if (sucursalesLista) {
            sucursalesLista.classList.add('expandido');
        }

        // Hide the trigger button
        btnElegir.style.display = 'none';

        // Load real branches from OCA
        cargarSucursalesOCA();

        console.log('[Checkout] Sucursales expanded — loading from OCA');
    });

    // ========================
    // BRANCH RADIO SELECTION
    // ========================

    document.addEventListener('change', (e) => {
        if (e.target.name === 'sucursal') {
            actualizarSucursalActiva();
        }
    });

    function actualizarSucursalActiva() {
        const items = document.querySelectorAll('.envio-sucursal-item');
        items.forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ========================
    // SIDEBAR SHIPPING PRICE
    // ========================

    function actualizarSidebarEnvio(precioCentavos) {
        const envioRow = document.querySelectorAll('.checkout-total-row')[1]; // Second row = Envío
        if (!envioRow) return;

        const noteEl = envioRow.querySelector('.checkout-total-note');
        let valueEl = envioRow.querySelector('.checkout-total-value');

        if (precioCentavos === null) {
            // Reset to "Calculado en el próximo paso"
            if (noteEl) noteEl.style.display = '';
            if (valueEl) valueEl.remove();
        } else {
            // Show actual shipping price
            if (noteEl) noteEl.style.display = 'none';

            // Create or update value element
            if (!envioRow.querySelector('.checkout-total-value')) {
                valueEl = document.createElement('span');
                valueEl.className = 'checkout-total-value';
                envioRow.appendChild(valueEl);
            }
            const valueSpan = envioRow.querySelector('.checkout-total-value');
            const formatted = '$' + formatearPrecioARS(precioCentavos / 100);
            if (valueSpan) valueSpan.textContent = formatted;

            // Update total
            actualizarTotalConEnvio(precioCentavos);
        }
    }

    function actualizarTotalConEnvio(envioPrecioCentavos) {
        const subtotalEl = document.getElementById('checkout-subtotal');
        const totalEl = document.getElementById('checkout-total');
        if (!subtotalEl || !totalEl) return;

        // Parse subtotal
        const subtotalText = subtotalEl.textContent.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
        const subtotalValue = parseFloat(subtotalText) || 0;
        const envioValue = envioPrecioCentavos / 100;
        const total = subtotalValue + envioValue;

        totalEl.textContent = '$' + formatearPrecioARS(total);
    }

    // Expose Step 2 functions globally
    window.mostrarCheckoutStep2 = mostrarCheckoutStep2;
    window.volverAStep1 = volverAStep1;

    // =========================================================================
    // FORM SUBMISSION HANDLERS (Supabase)
    // =========================================================================

    // --- CONTACT FORM SUBMIT ---
    if (btnContactSubmit) {
        btnContactSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnContactSubmit.classList.contains('is-inactive')) return;
            if (btnContactSubmit.classList.contains('loading')) return;

            const nombre = contactName.value.trim();
            const email = contactEmail.value.trim();
            const mensaje = contactMsg.value.trim();

            if (!nombre || !email || !mensaje) return;

            await runLoadBar(btnContactSubmit, 'ENVIANDO...');

            try {
                const { error } = await window.supabaseClient
                    .from('consultas')
                    .insert([{ nombre, email, mensaje }]);

                if (error) throw new Error(error.message);

                console.log('[Contact] ✅ Consulta enviada con éxito');

                const fields = document.querySelector('#account-contact .login-fields');
                const successHtml = `<span style="font-family:'Univers',sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#202020;line-height:1.5;">Tu consulta fue enviada. Nos comunicamos a la brevedad.</span>`;

                // Keep the button text as ENVIADO during success phase
                await animateButtonAndForm(btnContactSubmit, fields, 'ENVIAR', 'ENVIADO', successHtml);

            } catch (err) {
                console.error('[Contact] ❌ Error al enviar consulta:', err);
                // Reset button on error
                btnContactSubmit.classList.remove('loading');
                btnContactSubmit.style.pointerEvents = 'auto';
                btnContactSubmit.querySelector('.button-text').textContent = 'ENVIAR';
                btnContactSubmit.querySelector('.button-text').style.opacity = '1';
                checkContactInputs();
            }
        });
    }

    // --- HELPER FUNC: Show Custom Error Message ---
    function showFormError(container, message) {
        let errorEl = container.querySelector('.form-error-msg');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'form-error-msg font-condensed';
            Object.assign(errorEl.style, {
                color: 'var(--color-red)',
                textAlign: 'center',
                marginTop: '20px',
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            });
            container.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    function clearFormError(container) {
        const errorEl = container.querySelector('.form-error-msg');
        if (errorEl) errorEl.style.display = 'none';
    }

    // --- HELPER FUNC: Button Animation Sequence ---
    // ─── SISTEMA DE BARRA DE CARGA UNIFICADO ───
    // runLoadBar: anima el botón con barra inferior determinística (580ms)
    // Retorna una Promise que resuelve al completarse la barra.
    function runLoadBar(button, loadingText) {
        return new Promise((resolve) => {
            const span = button.querySelector('.button-text') || button.querySelector('span') || button;
            const setOpacity = (val, ms = 140) => {
                span.style.transition = `opacity ${ms}ms ease`;
                span.style.opacity = val;
            };

            // Bloquear interacción
            button.classList.add('loading');
            button.style.pointerEvents = 'none';

            // Fade out texto actual
            setOpacity('0');

            setTimeout(() => {
                // Cambiar texto + fade in tenue
                if (loadingText) span.textContent = loadingText;
                setOpacity('0.5');

                // Activar barra (CSS transition en ::after via clase .loading)
                // La barra dura 580ms (definido en CSS)
                setTimeout(() => {
                    resolve();
                }, 620); // 580ms barra + 40ms buffer
            }, 150);
        });
    }

    // wait: simple Promise-based delay utility for animation sequencing
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // runConfirm: muestra el texto de confirmación post-barra
    async function runConfirm(button, confirmText) {
        const span = button.querySelector('.button-text') || button.querySelector('span') || button;
        const setOpacity = (val, ms = 140) => {
            span.style.transition = `opacity ${ms}ms ease`;
            span.style.opacity = val;
        };

        // Valle de opacidad → texto de confirmación
        setOpacity('0');
        await wait(150);
        span.textContent = confirmText;
        button.classList.remove('loading');
        button.classList.add('done');
        setOpacity('0.8', 200);
    }

    // runRestore: restaura el botón a su estado original
    async function runRestore(button, originalText, delay = 2000) {
        await wait(delay);
        // Guardar si el botón sigue en el DOM antes de operar
        if (!document.contains(button)) return;
        const span = button.querySelector('.button-text') || button.querySelector('span') || button;
        span.style.transition = 'opacity 140ms ease';
        span.style.opacity = '0';
        await wait(150);
        if (!document.contains(button)) return;
        span.textContent = originalText;
        button.classList.remove('done', 'loading');
        span.style.opacity = '1';
        span.style.transition = '';
        button.style.pointerEvents = 'auto';
    }

    async function animateButtonAndForm(button, fieldsContainer, defaultText, completedText, successHtml) {
        // Barra de carga → confirmación → fade out campos → success HTML
        await runConfirm(button, completedText);

        // Esperar un momento mostrando el texto de confirmación
        await wait(1400);

        // Fade out campos + acciones
        const inputGroups = fieldsContainer.querySelectorAll('.input-group');
        const actions = button.closest('.login-actions');

        inputGroups.forEach(g => {
            g.style.transition = 'opacity 0.5s ease';
            g.style.opacity = '0';
        });
        if (actions) {
            actions.style.transition = 'opacity 0.5s ease';
            actions.style.opacity = '0';
        }

        await wait(500);

        // Colapsar campos extra y mostrar mensaje de éxito
        for (let i = 1; i < inputGroups.length; i++) {
            Object.assign(inputGroups[i].style, { visibility: 'hidden', height: '0', margin: '0', padding: '0', overflow: 'hidden' });
        }
        if (actions) {
            Object.assign(actions.style, { visibility: 'hidden', height: '0', margin: '0', padding: '0', overflow: 'hidden' });
        }
        if (inputGroups[0]) {
            inputGroups[0].innerHTML = successHtml;
            inputGroups[0].style.opacity = '1';
        }
    }

    // --- LOGIN SUBMIT ---
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnLoginSubmit.classList.contains('is-inactive')) return;
            if (btnLoginSubmit.classList.contains('loading')) return;

            const email = inputEmail.value.trim();
            const password = inputPassword.value.trim();
            const container = document.querySelector('#account-login .login-container');

            if (!email || !password) return;

            clearFormError(container);

            // Barra de carga
            await runLoadBar(btnLoginSubmit, 'ENTRANDO...');

            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.warn('[Login] ❌ Email o contraseña incorrectos');
                    // Reset button
                    btnLoginSubmit.classList.remove('loading');
                    btnLoginSubmit.style.pointerEvents = 'auto';
                    btnLoginSubmit.querySelector('.button-text').textContent = 'ENTRAR';
                    btnLoginSubmit.querySelector('.button-text').style.opacity = '1';
                    showFormError(container, 'EMAIL O CONTRASEÑA INCORRECTOS');
                } else {
                    const nombre = data.user?.user_metadata?.nombre || 'Usuario';
                    console.log(`[Login] ✅ Bienvenido, ${nombre}`);

                    const fields = document.querySelector('#account-login .login-fields');
                    const successHtml = `<span style="font-family:'Univers',sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#202020;line-height:1.5;">SESIÓN INICIADA CORRECTAMENTE.</span>`;

                    await animateButtonAndForm(btnLoginSubmit, fields, 'ENTRAR', '¡BIENVENIDO/A!', successHtml);

                    // Proceed to login state after animation...
                    setTimeout(() => { location.reload(); }, 1500);
                }
            } catch (err) {
                console.error('[Login] Error de conexión:', err);
                btnLoginSubmit.classList.remove('loading');
                btnLoginSubmit.style.pointerEvents = 'auto';
                btnLoginSubmit.querySelector('.button-text').textContent = 'ENTRAR';
                btnLoginSubmit.querySelector('.button-text').style.opacity = '1';
                showFormError(container, 'ERROR DE CONEXIÓN');
            }
        });
    }

    // --- CREATE ACCOUNT SUBMIT ---
    if (btnFinalCreate) {
        btnFinalCreate.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnFinalCreate.classList.contains('is-inactive')) return;
            if (btnFinalCreate.classList.contains('loading')) return;

            const nombre = inputFname.value.trim();
            const apellido = inputLname.value.trim();
            const email = inputCreateEmail.value.trim();
            const password = inputCreatePwd.value.trim();
            const passwordConfirm = inputCreatePwdConfirm.value.trim();
            const container = document.querySelector('#account-create .login-container');

            if (!nombre || !apellido || !email || !password || !passwordConfirm) return;

            clearFormError(container);

            // Validate passwords match
            if (password !== passwordConfirm) {
                showFormError(container, 'LAS CONTRASEÑAS NO COINCIDEN');
                return;
            }

            // Validate password length
            if (password.length < 6) {
                showFormError(container, 'LA CONTRASEÑA ES MUY CORTA (MÍN. 6 CARACTERES)');
                return;
            }

            await runLoadBar(btnFinalCreate, 'CREANDO...');

            try {
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nombre,
                            apellido,
                        },
                    },
                });

                if (error) {
                    console.error('[Create Account] ❌ Error:', error.message);
                    btnFinalCreate.classList.remove('loading');
                    btnFinalCreate.style.pointerEvents = 'auto';
                    btnFinalCreate.querySelector('.button-text').textContent = 'CREAR UNA CUENTA';
                    btnFinalCreate.querySelector('.button-text').style.opacity = '1';

                    if (error.message.includes('already registered')) {
                        showFormError(container, 'EL EMAIL YA ESTÁ REGISTRADO');
                    } else {
                        showFormError(container, 'ERROR AL CREAR LA CUENTA');
                    }
                } else {
                    console.log('[Create Account] ✅ Cuenta creada. Verificar email.');
                    const fields = document.querySelector('#account-create .login-fields');
                    const successHtml = `<span style="font-family:'Univers',sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#202020;line-height:1.5;">TE ENVIAMOS UN EMAIL PARA VERIFICAR TU CUENTA.</span>`;

                    await animateButtonAndForm(btnFinalCreate, fields, 'CREAR UNA CUENTA', 'MAIL ENVIADO', successHtml);
                }
            } catch (err) {
                console.error('[Create Account] Error de conexión:', err);
                btnFinalCreate.classList.remove('loading');
                btnFinalCreate.style.pointerEvents = 'auto';
                btnFinalCreate.querySelector('.button-text').textContent = 'CREAR UNA CUENTA';
                btnFinalCreate.querySelector('.button-text').style.opacity = '1';
                showFormError(container, 'ERROR DE CONEXIÓN');
            }
        });
    }

    // --- RECOVER PASSWORD SUBMIT ---
    if (btnRecoverSubmit) {
        btnRecoverSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnRecoverSubmit.classList.contains('is-inactive')) return;
            if (btnRecoverSubmit.classList.contains('loading')) return;

            const email = inputRecoverEmail.value.trim();
            const container = document.querySelector('#account-recover .login-container');

            if (!email) return;

            clearFormError(container);

            await runLoadBar(btnRecoverSubmit, 'ENVIANDO...');

            try {
                // Determine origin dynamically for realistic local + prod redirects
                const redirectUrl = window.location.origin + '/?recover=1';

                const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectUrl,
                });

                if (error) {
                    console.error('[Recover Password] ❌ Error:', error.message);
                    btnRecoverSubmit.classList.remove('loading');
                    btnRecoverSubmit.style.pointerEvents = 'auto';
                    btnRecoverSubmit.querySelector('.button-text').textContent = 'ENVIAR LINK';
                    btnRecoverSubmit.querySelector('.button-text').style.opacity = '1';
                    showFormError(container, 'HUBO UN ERROR AL ENVIAR EL CORREO');
                } else {
                    console.log('[Recover Password] ✅ Email de recuperación enviado');
                    const fields = document.querySelector('#account-recover .login-fields');
                    const successHtml = `<span style="font-family:'Univers',sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#202020;line-height:1.5;">TE ENVIAMOS UN EMAIL CON LAS INSTRUCCIONES.</span>`;

                    await animateButtonAndForm(btnRecoverSubmit, fields, 'ENVIAR LINK', 'LINK ENVIADO', successHtml);
                }
            } catch (err) {
                console.error('[Recover Password] Error de conexión:', err);
                btnRecoverSubmit.classList.remove('loading');
                btnRecoverSubmit.style.pointerEvents = 'auto';
                btnRecoverSubmit.querySelector('.button-text').textContent = 'ENVIAR LINK';
                btnRecoverSubmit.querySelector('.button-text').style.opacity = '1';
                showFormError(container, 'ERROR DE CONEXIÓN');
            }
        });
    }

    // =========================================================================
    // SUPABASE AUTH HASH DETECTION
    // Handles: ?type=recovery (reset password) and ?type=signup (verify account)
    // Supabase sends tokens in the URL hash: #access_token=xxx&type=recovery
    // =========================================================================

    function parseHashParams() {
        const hash = window.location.hash.substring(1);
        const params = {};
        hash.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
        return params;
    }

    function handleAuthRedirect() {
        const hashParams = parseHashParams();
        const type = hashParams['type'];
        const accessToken = hashParams['access_token'];
        const refreshToken = hashParams['refresh_token'];

        if (!type || !accessToken) return; // No redirect to handle

        // Set the session in Supabase so we can call updateUser
        if (window.supabaseClient) {
            window.supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
            }).then(() => {
                if (type === 'recovery') {
                    // Show new password section
                    window.history.replaceState(null, '', window.location.pathname);
                    showNewPasswordSection();
                } else if (type === 'signup') {
                    // Account verified — go to login with confirmation
                    window.history.replaceState(null, '', window.location.pathname);
                    enableAccountState(null);
                    setTimeout(() => {
                        const container = document.querySelector('#account-login .login-container');
                        if (container) showFormSuccess(container, '¡TU CUENTA FUE ACTIVADA! YA PODÉS INICIAR SESIÓN.');
                    }, 300);
                }
            }).catch(err => {
                console.error('[Auth Redirect] Error setting session:', err);
            });
        }
    }

    function showNewPasswordSection() {
        // Hide everything, show new password section
        const allSections = [
            document.getElementById('home-container'),
            document.getElementById('shop'),
            document.getElementById('product-page'),
            accountLoginSection,
            accountCreateSection,
            accountRecoverSection,
            accountContactSection
        ];
        allSections.forEach(s => { if (s) s.style.display = 'none'; });

        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT, STATE_LEGALES);
        body.classList.add(STATE_ACCOUNT);

        if (accountNewPasswordSection) {
            accountNewPasswordSection.style.display = 'flex';
            setTimeout(() => {
                accountNewPasswordSection.style.opacity = '1';
            }, 50);
        }

        header.style.backgroundColor = '';
        header.style.color = '';
        window.scrollTo(0, 0);
        injectFooterInAccount();
    }

    function showFormSuccess(container, message) {
        let el = container.querySelector('.form-success-msg');
        if (!el) {
            el = document.createElement('div');
            el.className = 'form-success-msg font-condensed';
            Object.assign(el.style, {
                color: 'var(--color-black)',
                textAlign: 'left',
                marginTop: '20px',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: '1.5',
                opacity: '0',
                transition: 'opacity 0.5s ease'
            });
            container.appendChild(el);
        }
        el.textContent = message;
        setTimeout(() => { el.style.opacity = '1'; }, 50);
    }

    // New Password validation
    function checkNewPwdInputs() {
        if (!inputNewPwd || !inputNewPwdConfirm || !btnNewPwdSubmit) return;
        const filled = inputNewPwd.value.trim().length >= 6 &&
            inputNewPwdConfirm.value.trim().length >= 6;
        if (filled) {
            btnNewPwdSubmit.classList.remove('is-inactive');
            btnNewPwdSubmit.classList.add('is-active');
        } else {
            btnNewPwdSubmit.classList.add('is-inactive');
            btnNewPwdSubmit.classList.remove('is-active');
        }
    }

    if (inputNewPwd) inputNewPwd.addEventListener('input', checkNewPwdInputs);
    if (inputNewPwdConfirm) inputNewPwdConfirm.addEventListener('input', checkNewPwdInputs);

    // New Password submit
    if (btnNewPwdSubmit) {
        btnNewPwdSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btnNewPwdSubmit.classList.contains('is-inactive')) return;
            if (btnNewPwdSubmit.classList.contains('loading')) return;

            const pwd = inputNewPwd.value.trim();
            const confirm = inputNewPwdConfirm.value.trim();
            const container = document.querySelector('#account-new-password .login-container');

            if (pwd !== confirm) {
                showFormError(container, 'LAS CONTRASEÑAS NO COINCIDEN');
                return;
            }
            if (pwd.length < 6) {
                showFormError(container, 'LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES');
                return;
            }

            clearFormError(container);
            await runLoadBar(btnNewPwdSubmit, 'GUARDANDO...');

            try {
                const { error } = await window.supabaseClient.auth.updateUser({ password: pwd });

                if (error) throw new Error(error.message);

                const fields = document.querySelector('#account-new-password .login-fields');
                const successHtml = `<span style="font-family:'Univers',sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#202020;line-height:1.5;">¡CONTRASEÑA ACTUALIZADA! YA PODÉS INICIAR SESIÓN.</span>`;
                await animateButtonAndForm(btnNewPwdSubmit, fields, 'GUARDAR CONTRASEÑA', 'CONTRASEÑA GUARDADA', successHtml);

                // After success, redirect to login after a moment
                setTimeout(() => {
                    if (accountNewPasswordSection) {
                        accountNewPasswordSection.style.opacity = '0';
                        setTimeout(() => {
                            accountNewPasswordSection.style.display = 'none';
                            enableAccountState(null);
                        }, 400);
                    }
                }, 3000);

            } catch (err) {
                console.error('[New Password] Error:', err);
                btnNewPwdSubmit.classList.remove('loading');
                btnNewPwdSubmit.style.pointerEvents = 'auto';
                btnNewPwdSubmit.querySelector('.button-text').textContent = 'GUARDAR CONTRASEÑA';
                btnNewPwdSubmit.querySelector('.button-text').style.opacity = '1';
                showFormError(container, 'HUBO UN ERROR. INTENTÁ DE NUEVO.');
            }
        });
    }

    // Run hash detection after everything is set up
    // Small delay to ensure supabaseClient is initialized
    setTimeout(handleAuthRedirect, 300);

    // =========================================================================
    // SCROLLBAR COMPENSATION — fixed elements
    // Los elementos position:fixed ignoran el scrollbar del SO en algunos
    // navegadores y se extienden por debajo de él. Medimos el ancho real
    // del scrollbar y lo aplicamos como padding-right en los elementos
    // fixed que llegan al borde derecho.
    // =========================================================================
    function applyScrollbarCompensation() {
        // window.innerWidth incluye el scrollbar, clientWidth no
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        const fixedElements = [
            document.getElementById('announcement-bar'),
            document.getElementById('main-header'),
        ];

        fixedElements.forEach(el => {
            if (el) el.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
        });
    }

    applyScrollbarCompensation();
    window.addEventListener('resize', applyScrollbarCompensation);

    // =========================================================================
    // MARQUEE — relleno dinámico para loop verdaderamente infinito
    //
    // Problema: un texto fijo puede ser más corto que el viewport,
    // generando un hueco visible antes del reinicio del loop CSS.
    //
    // Solución: medir el ancho del texto base una vez renderizado,
    // luego repetirlo las veces necesarias para que el track ocupe
    // al menos el DOBLE del viewport (requerimiento de translateX(-50%)).
    // El loop CSS nunca muestra un hueco porque siempre hay texto a la derecha.
    // =========================================================================
    function initMarquee() {
        const track = document.getElementById('announcement-track');
        const content = document.getElementById('announcement-content');
        if (!track || !content) return;

        const BASE_TEXT = 'GÜIDO CAPUZZI • HASTA 6 CUOTAS SIN INTERÉS • ENVÍOS A TODO EL PAÍS • DENIM ÚNICO SIN RE-STOCK • PRENDAS ÚNICAS 1/1 • HECHO EN ARGENTINA • ';

        // Render una copia para medir su ancho real
        content.textContent = BASE_TEXT;
        const singleWidth = content.offsetWidth;
        if (singleWidth === 0) return; // Guard: fuente no cargada aún

        // Calcular cuántas repeticiones necesitamos para cubrir 2× el viewport
        const viewportWidth = window.innerWidth;
        const minTotalWidth = viewportWidth * 2;
        const reps = Math.ceil(minTotalWidth / singleWidth) + 1; // +1 de margen

        content.textContent = BASE_TEXT.repeat(reps);
    }

    // Inicializar en DOMContentLoaded; re-inicializar si el viewport cambia
    initMarquee();
    window.addEventListener('resize', initMarquee);

    // Footer logo clip-path reveal
    initFooterLogoReveal();
    initManifestoReveal();

    // =========================================================================
    // MARQUEE — sincroniza body.header-active cuando el header se activa (negro)
    // =========================================================================
    if (header) {
        const headerClassObserver = new MutationObserver(() => {
            const isActive = header.classList.contains('header-hover') ||
                header.classList.contains('menu-open');
            body.classList.toggle('header-active', isActive);
        });
        headerClassObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
    }

    console.log("GÜIDO CAPUZZI system fully re-initialized.");

    // =========================================================================
    // HISTORY API — popstate listener + deep link restore
    // =========================================================================

    // Restore state from a history state object (called by popstate)
    function restoreState(stateObj) {
        switch (stateObj.state) {
            case 'home':
                enableHomeState(null, /* skipHistory */ true);
                break;
            case 'shop':
                enableShopState(null, stateObj.category || 'VER TODO', /* skipHistory */ true);
                break;
            case 'pdp':
                if (stateObj.productIndex !== undefined && products[stateObj.productIndex]) {
                    enablePDPState(stateObj.productIndex, /* skipHistory */ true);
                } else {
                    enableHomeState(null, true);
                }
                break;
            case 'account':
                enableAccountState(null, /* skipHistory */ true);
                break;
            case 'contact':
                enableContactState(null, /* skipHistory */ true);
                break;
            case 'legales':
                enableLegalesState(null, /* skipHistory */ true);
                break;
            default:
                enableHomeState(null, true);
        }
    }

    // Listen for browser back/forward
    window.addEventListener('popstate', (e) => {
        const stateObj = e.state;
        if (!stateObj) {
            restoreState({ state: 'home' });
            return;
        }
        restoreState(stateObj);
    });

    // Restore correct state if user lands on a deep URL (e.g. /shop/remera-guido-oversized-negro)
    function restoreFromURL() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);

        // Legacy support: /shop/producto?id=N
        if (path === '/shop/producto' && params.has('id')) {
            const id = parseInt(params.get('id'));
            if (!isNaN(id) && products[id]) {
                enablePDPState(id, /* skipHistory */ true);
                // Upgrade URL to slug format
                const slug = products[id]._slug;
                history.replaceState({ state: 'pdp', productIndex: id }, '', `/shop/${slug}`);
                return;
            }
        }
        // Slug-based PDP: /shop/remera-guido-oversized-negro
        if (path.startsWith('/shop/') && path !== '/shop') {
            const slug = path.replace('/shop/', '');
            const idx = findProductBySlug(slug);
            if (idx !== -1) {
                enablePDPState(idx, /* skipHistory */ true);
                history.replaceState({ state: 'pdp', productIndex: idx }, '', path);
                return;
            }
        }
        if (path === '/shop' || path === '/shop/') {
            const cat = params.get('cat') || 'VER TODO';
            enableShopState(null, cat, /* skipHistory */ true);
            history.replaceState({ state: 'shop', category: cat }, '', window.location.href);
            return;
        }
        if (path.startsWith('/cuenta')) {
            enableAccountState(null, /* skipHistory */ true);
            history.replaceState({ state: 'account' }, '', window.location.href);
            return;
        }
        if (path.startsWith('/contacto')) {
            enableContactState(null, /* skipHistory */ true);
            history.replaceState({ state: 'contact' }, '', window.location.href);
            return;
        }
        if (path.startsWith('/legales')) {
            enableLegalesState(null, /* skipHistory */ true);
            history.replaceState({ state: 'legales' }, '', window.location.href);
            return;
        }

        // Default: home — register initial state
        history.replaceState({ state: 'home' }, '', URL_HOME);
    }

    restoreFromURL();
});
