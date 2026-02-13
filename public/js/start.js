
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. DATA & STATE VARIABLES
    // -------------------------------------------------------------------------

    // DOM Elements - Navigation & Wrappers
    const body = document.body;
    const shopTrigger = document.getElementById('shop-trigger');
    const homeTrigger = document.getElementById('home-trigger');
    const header = document.getElementById('main-header'); // Fixed ID reference

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

    // Contact DOM Elements
    const accountContactSection = document.getElementById('account-contact');
    // Footer trigger is dynamic or need to query it globally if it exists:
    // Actually we added id="footer-contact-link" in HTML, so we can select it efficiently.
    // However, since footer might be cloned, we should use delegation or select it carefully.

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
        { category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO<br>OVERSIZED', color: 'Negro', colorway: 'NEGRO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-güido-negra-front.png', 'assets/images/products/remera-güido-negra-back.png'] },
        { category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA LOGO GÜIDO<br>OVERSIZED', color: 'Rojo en Negro', colorway: 'ROJO EN NEGRO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-güido-rojo-front.png', 'assets/images/products/remera-güido-rojo-back.png'] },
        { category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO<br>OVERSIZED', color: 'Blanco', colorway: 'BLANCO', price: '$50.000', description: 'REMERA OVERSIZED 100% ALGODÓN. ESTAMPA GÜIDO EN RELIEVE. LIMPIEZA VISUAL.', images: ['assets/images/products/remera-güido-blanca-front.png', 'assets/images/products/remera-güido-blanca-back.png'] },
        { category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Negro', colorway: 'NEGRO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-negra-front.png', 'assets/images/products/remera-afligida-negra-back.png'] },
        { category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Navy', colorway: 'NAVY', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-navy-front.png', 'assets/images/products/remera-afligida-navy-back.png'] },
        { category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA<br>BAGGED TEE', color: 'Blanco', colorway: 'BLANCO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-blanca-front.png', 'assets/images/products/remera-afligida-blanca-back.png'] },

        // MUSCULOSAS (2)
        { category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO<br>OVERSIZED', color: 'Negra', colorway: 'NEGRA', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-doble-simbolo-negra-front.png', 'assets/images/products/musculosa-doble-simbolo-negra-back.png'] },
        { category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO<br>OVERSIZED', color: 'Blanca', colorway: 'BLANCA', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-doble-simbolo-blanca-front.png', 'assets/images/products/musculosa-doble-simbolo-blanca-back.png'] },

        // JEANS (4)
        // JEANS (4)
        { category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE SUELTO.', images: ['assets/images/products/jean-indigo-suelto-front.png', 'assets/images/products/jean-indigo-suelto-back.png', 'assets/images/products/jean-indigo-fold.png'] },
        { category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Negro', colorway: 'NEGRO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE SUELTO.', images: ['assets/images/products/jean-negro-suelto-front.png', 'assets/images/products/jean-negro-suelto-back.png', 'assets/images/products/jean-negro-fold.png'] },
        { category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE REGULAR.', images: ['assets/images/products/jean-indigo-bootcut-front.png', 'assets/images/products/jean-indigo-bootcut-back.png', 'assets/images/products/jean-indigo-fold.png'] },
        { category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR', title: 'JEAN SELVEDGE<br>JAPONES', color: 'Negro', colorway: 'NEGRO', price: '$240.000', description: 'DENIM JAPONES 14OZ. CORTE REGULAR.', images: ['assets/images/products/jean-negro-bootcut-font.png', 'assets/images/products/jean-negro-bootcut-back.png', 'assets/images/products/jean-negro-fold.png'] },

        // BERMUDAS (2)
        { category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE', title: 'BERMUDA SELVEDGE<br>DOUBLE KNEE', color: 'Negro', colorway: 'NEGRO', price: '$175.000', description: 'WORKWEAR ESTILO.', images: ['assets/images/products/bermuda-DK-front.png', 'assets/images/products/bermuda-DK-back.png'] },
        { category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE PATCHWORK', title: 'BERMUDA SELVEDGE<br>PATCHWORK', color: 'Índigo/Negro', colorway: 'ÍNDIGO/NEGRO', price: '$160.000', description: 'CONSTRUCCIÓN PATCHWORK.', images: ['assets/images/products/bermuda-patchwork-front.png', 'assets/images/products/bermuda-patchwork-back.png'] },

        // ARCHIVO (2)
        { category: 'ARCHIVO', name: 'JEAN INTERVENIDO "SUELA ROJA" BOOTCUT', title: 'JEAN INTERVENIDO<br>"SUELA ROJA"<br>FIT BOOTCUT', color: 'Azul Lavado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO CON LAVADO NATURAL Y CORTE BOOTCUT. EL COLOR<br>BUSCA REINTERPRETAR EL LEGADO DE LA SUELA ROJA, FUNDIENDO<br>EL CELESTE CLÁSICO EN UN ROJO VIBRANTE. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA", images: ['assets/images/products/jean-archivo-1-front.png', 'assets/images/products/jean-archivo-1-back.png'] },
        { category: 'ARCHIVO', name: 'JEAN INTERVENIDO "ENCERADO" BOOTCUT', title: 'JEAN INTERVENIDO<br>"ENCERADO"<br>FIT BOOTCUT', color: 'Negro Encerado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO DE CORTE BOOTCUT. PINTADO Y ENCERADO A MANO. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA.", images: ['assets/images/products/jean-archivo-2-front.png', 'assets/images/products/jean-archivo-2-back.png'] },

        // REMERA BABY TEE (3 colorways - mujer)
        { category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Negro', colorway: 'NEGRO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-negra-front.png'] },
        { category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Blanco', colorway: 'BLANCO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-blanca-front.png'] },
        { category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE<br>REGISTRADA', color: 'Navy', colorway: 'NAVY', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-bbytee-navy-front.png'] },

        // REMERA MANGA LARGA TERMAL (2 colorways)
        { category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA<br>TERMAL', color: 'Negro', colorway: 'NEGRO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-termal-negra-front.png', 'assets/images/products/remera-termal-negra-back.png'] },
        { category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA<br>TERMAL', color: 'Blanco', colorway: 'BLANCO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-termal-blanca-front.png', 'assets/images/products/remera-termal-blanca-back.png'] },
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

    // --- PHASE 1: LOGO MORPHING ---
    function triggerPhase1() {
        if (isAnimating || scrollPhase !== 0) return;
        isAnimating = true;
        console.log("[Scroll Phase] Triggering Phase 1: Logo Morphing");

        // Add morphed class to hero logo (CSS handles the transition)
        if (heroLogo) {
            heroLogo.classList.add('morphed');
        }

        // Show header logo
        if (headerLogo) {
            headerLogo.classList.add('visible');
        }

        // After animation completes, advance to phase 1
        setTimeout(() => {
            scrollPhase = 1;
            isAnimating = false;
            console.log("[Scroll Phase] Phase 1 Complete");
        }, 800); // Match CSS transition duration
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
                image: product.images && product.images.length > 0 ? product.images[0] : '',
                size: size,
                qty: qty,
                color: product.color
            });
        }
        updateCartCounts();
        openCart(); // Auto open on add
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

    // --- PDP LOGIC ---
    function enablePDPState(productIndex) {
        currentProductIndex = productIndex;
        const product = products[productIndex];
        if (!product) return;

        // Visual State Switch
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_ACCOUNT, STATE_CONTACT); // Ensure comprehensive removal
        body.classList.add(STATE_PDP);
        window.scrollTo(0, 0);

        // Explicitly hide potential blockers (Shop has inline block now)
        const sectionsToHide = [
            document.getElementById('shop'),
            document.getElementById('home-container'),
            document.getElementById('account-login'),
            document.getElementById('account-contact')
        ];
        sectionsToHide.forEach(s => {
            if (s) s.style.display = 'none';
        });

        const productPage = document.getElementById('product-page');
        if (productPage) {
            productPage.style.removeProperty('display');
            productPage.style.display = 'block';
            productPage.style.opacity = '1'; // Fix: Restore opacity cleared by Home
            productPage.style.pointerEvents = 'auto'; // Fix: Restore clicks

            // Generate Image Stack
            const images = product.images && product.images.length > 0 ? product.images : [];
            const imagesHTML = images.length > 0
                ? images.map(src => `<img src="${src}" class="pdp-image" alt="${product.name}">`).join('')
                : '<div style="background:#f4f4f4; width:100%; height:100%; min-height:500px;"></div>';

            // Defines logic for unique pieces (ARCHIVO)
            const isArchive = product.category === 'ARCHIVO';
            const sizeOtherStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';
            const qtyContainerStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';

            // Inject Content (Fresh Template)
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
                            
                            <!-- ERROR / SUCCESS MSG CONTAINER COULD GO HERE -->
                        </div>
                    </div>
                </div>

                <div class="related-section">
                     <div class="related-header"><h3 class="font-condensed">TAMBIÉN TE PUEDE GUSTAR</h3></div>
                    <div class="related-grid" id="related-grid"></div>
                </div>
                
                 <footer class="pdp-footer">
                    <div class="footer-content">
                        <span class="brand-name font-condensed">GÜIDO CAPUZZI ® 2026</span>
                        <div class="footer-links font-condensed"><span class="trigger-contact">CONTACTO</span><span>LEGALES</span></div>
                    </div>
                </footer>
            `;

            // Initialize Local PDP Logic
            initPDPInteractions();
            initPDPRelated();
        }
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

        // 3. Add to Cart
        const addBtn = document.getElementById('pdp-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                addToCart(currentProductIndex, selectedSize, selectedQty);
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
            return `
             <div class="product-card" data-index="${idx}">
                <div class="product-image">
                   ${img ? `<img src="${img}" style="width:100%; height:100%; object-fit:cover;">` : ''}
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

    function updateShopContent(category) {
        if (shopTitle) shopTitle.textContent = category;

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
                    const imageSrc = product.images && product.images.length > 0 ? product.images[0] : '';
                    return `
                    <div class="product-card" data-index="${idx}">
                        <div class="product-image">
                            ${imageSrc ? `<img src="${imageSrc}" style="width:100%; height:100%; object-fit:cover;" alt="${product.name}">` : ''}
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
        }
        if (count) count.textContent = `${filteredProducts.length} Productos`;
    }

    function enableShopState(e) {
        if (e) e.preventDefault();

        // 1. Logic for "Ver Todo"
        if (e && e.currentTarget && e.currentTarget.id === 'shop-trigger') {
            updateShopContent('VER TODO');
        }

        // 2. Class Switching
        body.classList.remove(STATE_HOME, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT);
        body.classList.add(STATE_SHOP);

        // 3. Restore visibility of Shop Container (Fix for Home->Shop deadlock)
        const shopSection = document.getElementById('shop');
        if (shopSection) {
            shopSection.style.removeProperty('display');
            shopSection.style.display = 'block'; // Force visibility
            shopSection.style.opacity = '1';
            shopSection.style.pointerEvents = 'auto';
        }

        // 4. Hide Others
        const sectionsToHide = [
            document.getElementById('account-login'),
            document.getElementById('account-contact'),
            document.getElementById('product-page'),
            document.getElementById('home-container') // Keep Home separate
        ];

        sectionsToHide.forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        // 5. Header Reset
        header.style.backgroundColor = '';
        header.style.color = '';
    }

    function enableHomeState(e) {
        if (e) e.preventDefault();
        console.log("[Navigation] enableHomeState Triggered - Starting Sequence");

        // --- 1. MASTER RESET (Inlined for Safety) ---

        // A. Remove all State Classes based on known constants
        // Force removal individually to ensure no failure
        if (typeof STATE_SHOP !== 'undefined') body.classList.remove(STATE_SHOP);
        if (typeof STATE_PDP !== 'undefined') body.classList.remove(STATE_PDP);
        if (typeof STATE_ACCOUNT !== 'undefined') body.classList.remove(STATE_ACCOUNT);
        if (typeof STATE_CONTACT !== 'undefined') body.classList.remove(STATE_CONTACT);
        if (typeof STATE_CHECKOUT !== 'undefined') body.classList.remove(STATE_CHECKOUT);

        // Reset Body Styles
        body.style.overflow = ''; // Let CSS control it (revert 'auto' override if it conflicts)
        body.style.height = '';
        body.style.backgroundColor = ''; // Clear inline

        // B. Hide All Sections (Safely) - Including Checkout
        const allSections = [
            document.getElementById('shop'),
            document.getElementById('product-page'),
            document.getElementById('account-login'),
            document.getElementById('account-create'),
            document.getElementById('account-contact'),
            document.getElementById('checkout')
        ];

        allSections.forEach(sec => {
            if (sec) {
                sec.style.display = 'none';
                sec.style.opacity = '0';
                sec.style.pointerEvents = 'none';
            }
        });

        // --- 2. ACTIVATE HOME ---
        console.log("[Navigation] Activating Home State");
        body.classList.add(STATE_HOME); // Adds Red BG via CSS

        const homeContainer = document.getElementById('home-container');
        if (homeContainer) {
            homeContainer.style.removeProperty('display');
            homeContainer.style.display = 'block';
            homeContainer.style.opacity = '1';
            homeContainer.style.pointerEvents = 'auto'; // Ensure clickable
            // Force Reflow
            void homeContainer.offsetWidth;
        } else {
            console.error("[Navigation] Critical: home-container not found!");
        }

        // --- 3. RESTORE HEADER & ANNOUNCEMENT BAR ---
        console.log("[Navigation] Resetting Header");
        header.classList.remove('menu-open');
        header.style.removeProperty('background-color');
        header.style.removeProperty('color');
        header.style.removeProperty('display');

        // Make sure header is visible
        header.style.display = 'flex';
        header.style.backgroundColor = 'transparent';
        header.style.color = 'var(--color-white)';

        // Restore announcement bar
        const announcementBar = document.getElementById('announcement-bar');
        if (announcementBar) {
            announcementBar.style.removeProperty('display');
            announcementBar.style.display = 'flex';  // Must be 'flex' per CSS
            announcementBar.classList.remove('hidden');
        }
        body.classList.remove('announcement-hidden');

        // --- 4. SCROLL RESET (Delayed to ensure DOM is ready) ---
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            // Also reset home-container scroll if it's a scroll-snap container
            if (homeContainer) homeContainer.scrollTop = 0;
        });

        // --- 5. RESET HOME ANIMATIONS ---
        resetHomeAnimations();

        console.log("[Navigation] Sequence Complete");
    }

    // --- ACCOUNT LOGIC ---
    function enableAccountState(e) {
        if (e) e.preventDefault();

        // Update State Classes
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT);
        body.classList.add(STATE_ACCOUNT);

        // Hide ALL other containers (including Shop which might have inline display:block)
        const sectionsToHide = [
            document.getElementById('shop'),
            document.getElementById('product-page'),
            document.getElementById('home-container'),
            document.getElementById('account-contact')
        ];
        sectionsToHide.forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        // Show Login Section (Default) - Restore visibility AND pointer-events
        if (accountLoginSection) {
            accountLoginSection.style.display = 'flex';
            accountLoginSection.style.opacity = '1';
            accountLoginSection.style.pointerEvents = 'auto'; // CRITICAL FIX

            if (accountCreateSection) {
                accountCreateSection.style.display = 'none';
            }
        }

        // Header Reset (let CSS handle)
        header.style.backgroundColor = '';
        header.style.color = '';

        // Reset scroll
        window.scrollTo(0, 0);

        // Footer Injection Logic
        injectFooterInAccount();
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

    function enableContactState(e) {
        if (e) e.preventDefault();

        // Update State Classes
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP);
        body.classList.add(STATE_ACCOUNT); // Shared CSS for account-like pages
        body.classList.add(STATE_CONTACT); // Semantic

        // Hide ALL other containers (including Shop which might have inline display:block)
        const sectionsToHide = [
            document.getElementById('shop'),
            document.getElementById('product-page'),
            document.getElementById('home-container'),
            accountLoginSection,
            accountCreateSection
        ];
        sectionsToHide.forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        // Show Contact - Restore visibility AND pointer-events
        if (accountContactSection) {
            accountContactSection.style.display = 'flex';
            accountContactSection.style.opacity = '1';
            accountContactSection.style.pointerEvents = 'auto'; // CRITICAL FIX
        }

        // Header Reset
        header.style.backgroundColor = '';
        header.style.color = '';

        // Scroll Reset
        window.scrollTo(0, 0);

        // Footer Injection
        injectFooterInAccount();
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
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT);
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

    function initFooterShuffle() {
        const links = document.querySelectorAll('.footer-nav-list a');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        links.forEach(link => {
            if (link.dataset.shuffleInit) return;
            link.dataset.shuffleInit = 'true';

            link.addEventListener('mouseenter', () => {
                const originalText = link.textContent;

                // --- STABILITY FIX: Lock width ---
                // We capture the computed width just before animation starts
                // and force it inline to prevent jitter
                link.style.width = getComputedStyle(link).width;
                link.style.display = 'inline-block'; // Should already be set by CSS, but safety first
                link.style.textAlign = 'center'; // Optional: keeps text centered in the locked box

                let counter = 0;

                const interval = setInterval(() => {
                    link.textContent = originalText.split('')
                        .map(char => {
                            if (char === ' ') return ' ';
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join('');

                    counter++;
                    if (counter > 6) {
                        clearInterval(interval);
                        link.textContent = originalText;
                        // Release the lock
                        link.style.width = '';
                    }
                }, 30);

                // Restore immediately on leave
                link.addEventListener('mouseleave', () => {
                    clearInterval(interval);
                    link.textContent = originalText;
                    link.style.width = ''; // Release lock
                }, { once: true });
            });
        });
    }

    // Call initially for Home/Shop footers
    initFooterShuffle();

    function injectFooterInAccount() {
        const shopFooter = document.querySelector('.shop-footer');
        if (!shopFooter) return;

        // Función helper para append y limpiar
        const appendAndReset = (parent) => {
            if (!parent.querySelector('.shop-footer')) {
                const clone = shopFooter.cloneNode(true);
                // IMPORTANTE: Limpiar la marca de "ya inicializado" en el clon
                // o initFooterShuffle lo ignorará.
                clone.querySelectorAll('a').forEach(a => {
                    delete a.dataset.shuffleInit;
                    // También resetear estilos inline si quedaron pegados
                    a.style.width = '';
                    a.style.display = '';
                    a.style.textAlign = '';
                });
                parent.appendChild(clone);
            }
        };

        if (accountLoginSection) appendAndReset(accountLoginSection);
        if (accountCreateSection) appendAndReset(accountCreateSection);
        if (accountContactSection) appendAndReset(accountContactSection);

        // Re-initialize shuffle for new elements
        setTimeout(() => {
            initFooterShuffle();
        }, 50);
    }



    function checkLoginInputs() {
        if (inputEmail.value.trim() !== '' && inputPassword.value.trim() !== '') {
            btnLoginSubmit.classList.remove('is-inactive');
            btnLoginSubmit.classList.add('is-active');
        } else {
            btnLoginSubmit.classList.add('is-inactive');
            btnLoginSubmit.classList.remove('is-active');
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

    // Contact Trigger (Global Delegation for class .trigger-contact)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('trigger-contact')) {
            e.preventDefault();
            enableContactState(e);
        }
    });

    // Navbar Hover Interactions handled in setupHeaderHover()
    // (Listeners removed from here to avoid duplication)

    // Category Dropdown
    const categoryLinks = document.querySelectorAll('.category-link');
    const shopTitle = document.getElementById('shop-category-title');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-cat');
            header.classList.remove('menu-open');
            enableShopState();
            setShopCategory(category); // Update filters category automatically
            updateShopContent(category);
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
                        console.log('[Checkout] ✅ Orden pendiente creada:', resultado.numeroOrden);
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
                // === STEP 2: Validate shipping selection, then move to Step 3 ===
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
                // TODO: Transicionar a Step 3 (Pago)
                console.log('[Checkout] ✅ Envío seleccionado:', selectedEnvio.value);
                alert('Próximo paso: selección de pago (en desarrollo).');
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

        console.log('[Checkout] → Step 2: Envío');
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

        // Set active state on first (pre-checked) branch
        actualizarSucursalActiva();

        console.log('[Checkout] Sucursales expanded');
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

    console.log("GÜIDO CAPUZZI system fully re-initialized.");
});
