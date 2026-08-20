
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
    const STATE_CONFIRMATION = 'state-confirmation';

    // History API — URLs por estado
    const URL_HOME = '/';
    const URL_SHOP = '/shop';
    const URL_PDP = '/shop/producto';
    const URL_ACCOUNT = '/cuenta';
    const URL_CONTACT = '/contacto';
    const URL_LEGALES = '/legales';
    const URL_CONFIRMATION = '/checkout/confirmacion';
    const URL_ARCHIVE = '/archivo';

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

    // Mobile menu DOM Elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileCatLinks = document.querySelectorAll('.mobile-cat-link');

    // Mobile header icon buttons
    const mobileSearchIcon = document.getElementById('mobile-search-icon');
    const mobileAccountIcon = document.getElementById('mobile-account-icon');
    const mobileCartIcon = document.getElementById('mobile-cart-icon');
    const mobileCartBadge = document.getElementById('mobile-cart-badge');

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
        { slug: 'remera-guido-negro', sku: 'REM-LOGO-NBL', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO OVERSIZED', color: 'Negro', colorway: 'NEGRO LOGO BLANCO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-guido-negro-1.webp', 'assets/images/products/remera-guido-negro-2.webp', 'assets/images/products/remera-guido-negro-3.webp', 'assets/images/products/remera-guido-negro-4.webp'] },
        { slug: 'remera-guido-rojo', sku: 'REM-LOGO-NRO', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA LOGO GÜIDO OVERSIZED', color: 'Negro / Rojo', colorway: 'NEGRO LOGO ROJO', price: '$50.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-guido-rojo-1.webp', 'assets/images/products/remera-guido-rojo-2.webp', 'assets/images/products/remera-guido-rojo-3.webp', 'assets/images/products/remera-guido-rojo-4.webp'] },
        { slug: 'remera-guido-blanco', sku: 'REM-LOGO-BNE', category: 'REMERAS', name: 'REMERA GÜIDO OVERSIZED', title: 'REMERA GÜIDO OVERSIZED', color: 'Blanco', colorway: 'BLANCO LOGO NEGRO', price: '$50.000', description: 'REMERA OVERSIZED 100% ALGODÓN. ESTAMPA GÜIDO EN RELIEVE. LIMPIEZA VISUAL.', images: ['assets/images/products/remera-guido-blanco-1.webp', 'assets/images/products/remera-guido-blanco-2.webp', 'assets/images/products/remera-guido-blanco-3.webp', 'assets/images/products/remera-guido-blanco-4.webp', 'assets/images/products/remera-guido-blanco-5.webp', 'assets/images/products/remera-guido-blanco-6.webp'] },
        // REMERA LOGO GÜIDO STRASS — misma base que la logo, con strass a mano.
        // `swatch` pisa el color del chip: el rectangulo muestra el color del logo,
        // no el de la tela (las dos son negras). `colorLabel` es lo que muestra la
        // PDP; `color` queda en 'Negro' para que el filtro NEGRO del Shop las tome.
        { slug: 'remera-guido-strass-rojo', sku: 'REM-STR-NRO', category: 'REMERAS', name: 'REMERA LOGO GÜIDO STRASS', title: 'REMERA LOGO GÜIDO STRASS', color: 'Negro', swatch: '#AD1C1C', colorway: 'LOGO ROJO', colorLabel: 'LOGO ROJO', price: '$65.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO CON STRASS APLICADO A MANO, PIEZA POR PIEZA. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-guido-strass-rojo-1.webp', 'assets/images/products/remera-guido-strass-rojo-2.webp', 'assets/images/products/remera-guido-strass-rojo-3.webp', 'assets/images/products/remera-guido-strass-rojo-4.webp', 'assets/images/products/remera-guido-strass-rojo-5.webp'] },
        { slug: 'remera-guido-strass-blanco', sku: 'REM-STR-NBL', category: 'REMERAS', name: 'REMERA LOGO GÜIDO STRASS', title: 'REMERA LOGO GÜIDO STRASS', color: 'Negro', swatch: '#FAFAFA', colorway: 'LOGO BLANCO', colorLabel: 'LOGO BLANCO', price: '$65.000', description: 'REMERA DE MANGA CORTA CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES HECHOS A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO CON STRASS APLICADO A MANO, PIEZA POR PIEZA. CALCE RELAJADO CON HOMBROS CAÍDOS. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-guido-strass-blanco-1.webp', 'assets/images/products/remera-guido-strass-blanco-2.webp', 'assets/images/products/remera-guido-strass-blanco-3.webp', 'assets/images/products/remera-guido-strass-blanco-4.webp', 'assets/images/products/remera-guido-strass-blanco-5.webp'] },

        { slug: 'remera-afligida-negro', sku: 'REM-AFL-NEG', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA BAGGED TEE', color: 'Negro', colorway: 'NEGRO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-negro-1.webp', 'assets/images/products/remera-afligida-negro-2.webp', 'assets/images/products/remera-afligida-negro-3.webp', 'assets/images/products/remera-afligida-negro-4.webp', 'assets/images/products/remera-afligida-negro-5.webp'] },
        { slug: 'remera-afligida-navy', sku: 'REM-AFL-NAV', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA BAGGED TEE', color: 'Navy', colorway: 'NAVY', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-navy-1.webp', 'assets/images/products/remera-afligida-navy-2.webp', 'assets/images/products/remera-afligida-navy-3.webp', 'assets/images/products/remera-afligida-navy-4.webp', 'assets/images/products/remera-afligida-navy-5.webp'] },
        { slug: 'remera-afligida-blanco', sku: 'REM-AFL-BLA', category: 'REMERAS', name: 'REMERA AFLIGIDA BAGGED TEE', title: 'REMERA AFLIGIDA BAGGED TEE', color: 'Blanco', colorway: 'BLANCO', price: '$55.000', description: 'REMERA DE MANGA CORTA, 100% ALGODÓN SUAVE. ROTURAS HECHAS A MANO DEBAJO DEL CUELLO Y EN LA COSTURA INFERIOR. INTERVENCIÓN CON SALPICADURAS DE PINTURA QUE HACEN CADA PRENDA ÚNICA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/remera-afligida-blanco-1.webp', 'assets/images/products/remera-afligida-blanco-2.webp', 'assets/images/products/remera-afligida-blanco-3.webp', 'assets/images/products/remera-afligida-blanco-4.webp', 'assets/images/products/remera-afligida-blanco-5.webp'] },

        // MUSCULOSAS (2)
        { slug: 'musculosa-negra', sku: 'MUS-DSB-NEG', category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', color: 'Negro', colorway: 'NEGRO', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-negra-1.webp', 'assets/images/products/musculosa-negra-2.webp'] },
        { slug: 'musculosa-blanca', sku: 'MUS-DSB-BLA', category: 'TOPS / MUSCULOSAS', name: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', title: 'MUSCULOSA DOBLE SIMBOLO OVERSIZED', color: 'Blanco', colorway: 'BLANCO', price: '$45.000', description: 'MUSCULOSA OVERSIZED 100% ALGODÓN SUAVE. CORTES DE MANGAS HECHOS A MANO, ÚNICOS EN CADA PRENDA. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO Y LA ESPALDA. HECHA EN ARGENTINA.', images: ['assets/images/products/musculosa-blanca-1.webp', 'assets/images/products/musculosa-blanca-2.webp'] },

        // JEANS (3)
        { slug: 'jean-selvedge-suelto-indigo', sku: 'JEA-IND-SUE', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO', title: 'JEAN DE DENIM SELVEDGE JAPONES SUELTO', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM SELVEDGE JAPONÉS DE NIHON MENPU, CRUDO DE 13 OZ. TEJIDO EN KOJIMA, OKAYAMA, LA CAPITAL DEL DENIM. ÍNDIGO DE TONO NATURAL, ÚNICO EN EL PAÍS. FIT SUELTO: LA MISMA SILUETA SUTILMENTE BOOTCUT DEL CORTE REGULAR, EN UN CALCE MÁS AMPLIO Y RELAJADO. BOTONES Y REMACHES DE LA MARCA. BADANA DE CUERO EN LA PARTE POSTERIOR. HECHO EN ARGENTINA.', care: 'EL SELVEDGE CRUDO SE VIVE Y SE CUIDA. LAVALO LO MENOS POSIBLE Y SIEMPRE DEL REVÉS. RECOMENDAMOS EL LAVADO A MANO: SUMERGILO 30 A 45 MINUTOS EN AGUA FRÍA CON JABÓN NEUTRO, SIN FROTAR, Y ENJUAGÁ EN FRÍO HASTA QUITAR EL JABÓN. ESCURRILO CON CUIDADO, SIN RETORCER. SI USÁS LAVARROPAS, ELEGÍ EL CICLO MÁS DELICADO. SECALO COLGADO EN VERTICAL DESDE LA CINTURA, A LA SOMBRA. EVITÁ EL SOL Y, SOBRE TODO, LA SECADORA.', images: ['assets/images/products/jean-selvedge-suelto-indigo-1.webp', 'assets/images/products/jean-selvedge-suelto-indigo-2.webp', 'assets/images/products/jean-selvedge-suelto-indigo-3.webp', 'assets/images/products/jean-selvedge-suelto-indigo-4.webp', 'assets/images/products/jean-selvedge-suelto-indigo-5.webp'] },
        { slug: 'jean-selvedge-regular-indigo', sku: 'JEA-IND-REG', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR', title: 'JEAN DE DENIM SELVEDGE JAPONES REGULAR', color: 'Índigo', colorway: 'ÍNDIGO', price: '$240.000', description: 'DENIM SELVEDGE JAPONÉS DE NIHON MENPU, CRUDO DE 13 OZ. TEJIDO EN KOJIMA, OKAYAMA, LA CAPITAL DEL DENIM. ÍNDIGO DE TONO NATURAL, ÚNICO EN EL PAÍS. FIT REGULAR, SUTILMENTE BOOTCUT, QUE OFRECE UN CALCE RECTO Y CÓMODO. BOTONES Y REMACHES DE LA MARCA. BADANA DE CUERO EN LA PARTE POSTERIOR. HECHO EN ARGENTINA.', care: 'EL SELVEDGE CRUDO SE VIVE Y SE CUIDA. LAVALO LO MENOS POSIBLE Y SIEMPRE DEL REVÉS. RECOMENDAMOS EL LAVADO A MANO: SUMERGILO 30 A 45 MINUTOS EN AGUA FRÍA CON JABÓN NEUTRO, SIN FROTAR, Y ENJUAGÁ EN FRÍO HASTA QUITAR EL JABÓN. ESCURRILO CON CUIDADO, SIN RETORCER. SI USÁS LAVARROPAS, ELEGÍ EL CICLO MÁS DELICADO. SECALO COLGADO EN VERTICAL DESDE LA CINTURA, A LA SOMBRA. EVITÁ EL SOL Y, SOBRE TODO, LA SECADORA.', images: ['assets/images/products/jean-selvedge-regular-indigo-1.webp', 'assets/images/products/jean-selvedge-regular-indigo-2.webp', 'assets/images/products/jean-selvedge-regular-indigo-3.webp', 'assets/images/products/jean-selvedge-regular-indigo-4.webp', 'assets/images/products/jean-selvedge-regular-indigo-5.webp', 'assets/images/products/jean-selvedge-regular-indigo-6.webp'] },
        { slug: 'jean-selvedge-regular-negro', sku: 'JEA-NEG-REG', category: 'PANTALONES / JEANS', name: 'JEAN DE DENIM SELVEDGE ITALIANO FIT REGULAR', title: 'JEAN DE DENIM SELVEDGE ITALIANO REGULAR', color: 'Negro', colorway: 'NEGRO', price: '$240.000', description: 'DENIM SELVEDGE ITALIANO DE CANDIANI, CRUDO DE 11 OZ. ESTE TEJIDO NACE EN LA PROVINCIA DE MILÁN, ITALIA. NEGRO PROFUNDO DE TONO NATURAL, ÚNICO EN EL PAÍS. FIT REGULAR, SUTILMENTE BOOTCUT, QUE OFRECE UN CALCE RECTO Y CÓMODO. BOTONES Y REMACHES DE LA MARCA. BADANA DE CUERO EN LA PARTE POSTERIOR. HECHO EN ARGENTINA.', care: 'EL SELVEDGE CRUDO SE VIVE Y SE CUIDA. LAVALO LO MENOS POSIBLE Y SIEMPRE DEL REVÉS. RECOMENDAMOS EL LAVADO A MANO: SUMERGILO 30 A 45 MINUTOS EN AGUA FRÍA CON JABÓN NEUTRO, SIN FROTAR, Y ENJUAGÁ EN FRÍO HASTA QUITAR EL JABÓN. ESCURRILO CON CUIDADO, SIN RETORCER. SI USÁS LAVARROPAS, ELEGÍ EL CICLO MÁS DELICADO. SECALO COLGADO EN VERTICAL DESDE LA CINTURA, A LA SOMBRA. EVITÁ EL SOL Y, SOBRE TODO, LA SECADORA.', images: ['assets/images/products/jean-selvedge-regular-negro-1.webp', 'assets/images/products/jean-selvedge-regular-negro-2.webp', 'assets/images/products/jean-selvedge-regular-negro-3.webp', 'assets/images/products/jean-selvedge-regular-negro-4.webp', 'assets/images/products/jean-selvedge-regular-negro-5.webp'] },

        // BERMUDAS (2)
        { slug: 'bermuda-double-knee-negro', sku: 'BER-DK-NEG', category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE', title: 'BERMUDA SELVEDGE DOUBLE KNEE', color: 'Negro', colorway: 'NEGRO', price: '$175.000', description: 'WORKWEAR ESTILO.', images: ['assets/images/products/bermuda-double-knee-negro-1.webp', 'assets/images/products/bermuda-double-knee-negro-2.webp', 'assets/images/products/bermuda-double-knee-negro-3.webp', 'assets/images/products/bermuda-double-knee-negro-4.webp', 'assets/images/products/bermuda-double-knee-negro-5.webp', 'assets/images/products/bermuda-double-knee-negro-6.webp', 'assets/images/products/bermuda-double-knee-negro-7.webp'] },
        { slug: 'bermuda-patchwork-indigo', sku: 'BER-PAT-MIX', category: 'BERMUDAS / SHORTS', name: 'BERMUDA DE DENIM SELVEDGE PATCHWORK', title: 'BERMUDA SELVEDGE PATCHWORK', color: 'Índigo/Negro', colorway: 'ÍNDIGO/NEGRO', price: '$160.000', description: 'CONSTRUCCIÓN PATCHWORK.', images: ['assets/images/products/bermuda-patchwork-indigo-1.webp', 'assets/images/products/bermuda-patchwork-indigo-2.webp', 'assets/images/products/bermuda-patchwork-indigo-3.webp', 'assets/images/products/bermuda-patchwork-indigo-4.webp'] },

        // INTERVENCIONES (4) — piezas 1/1
        { slug: 'jean-pintor-wildcat', sku: 'JEA-1/1-SUR', category: 'INTERVENCIONES', name: 'JEAN PINTOR "WILDCAT"', title: 'JEAN PINTOR "WILDCAT" BOOTCUT', color: 'Azul Lavado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO CON LAVADO NATURAL Y CORTE BOOTCUT. EL COLOR<br>BUSCA REINTERPRETAR EL LEGADO DE LA SUELA ROJA, FUNDIENDO<br>EL CELESTE CLÁSICO EN UN ROJO VIBRANTE. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA", images: ['assets/images/products/jean-pintor-wildcat-1.webp', 'assets/images/products/jean-pintor-wildcat-2.webp', 'assets/images/products/jean-pintor-wildcat-3.webp', 'assets/images/products/jean-pintor-wildcat-4.webp', 'assets/images/products/jean-pintor-wildcat-5.webp'] },
        { slug: 'jean-pintor-faja', sku: 'JEA-1/1-ENC', category: 'INTERVENCIONES', name: 'JEAN PINTOR "FAJA"', title: 'JEAN PINTOR "FAJA" BOOTCUT', color: 'Negro Pintado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO DE CORTE BOOTCUT. PINTADO Y ENCERADO A MANO. COSTURA INFERIOR<br>ABIERTA PARA MAYOR APERTURA SOBRE EL CALZADO. BOTONES Y<br>REMACHES DE LA MARCA Y BADANA DE CUERO NEGRA, EXCLUSIVA DE<br>INTERVENCIONES. HECHO A MANO EN ARGENTINA.", images: ['assets/images/products/jean-pintor-faja-1.webp', 'assets/images/products/jean-pintor-faja-2.webp'] },
        { slug: 'jean-encerado', sku: 'JEA-1/1-WAX', category: 'INTERVENCIONES', name: 'JEAN ENCERADO', title: 'JEAN ENCERADO BOOTCUT', color: 'Verde Encerado', colorway: '1/1', price: '$150.000', description: "JEAN LEVI'S 517 INTERVENIDO A MANO. PIEZA 1/1. DENIM<br>CLÁSICO DE CORTE BOOTCUT, RECUBIERTO A MANO CON UNA MEZCLA<br>DE PARAFINA Y CERA DE ABEJAS APLICADA EN CALIENTE. EL ENCERADO<br>SELLA EL TEJIDO, LE DA CUERPO Y UN BRILLO OPACO QUE SE VA<br>QUEBRANDO CON EL USO. COSTURA INFERIOR ABIERTA PARA MAYOR<br>APERTURA SOBRE EL CALZADO. BOTONES Y REMACHES DE LA MARCA Y<br>BADANA DE CUERO NEGRA, EXCLUSIVA DE INTERVENCIONES. HECHO A<br>MANO EN ARGENTINA.", care: 'EL ENCERADO NO SE LAVA. LIMPIALO EN SECO, CON UN CEPILLO SUAVE O UN PAÑO APENAS HÚMEDO EN FRÍO Y SÓLO SOBRE LA MANCHA. NUNCA A MÁQUINA, NUNCA CON AGUA CALIENTE NI DETERGENTE: DISUELVEN LA CERA. SECALO COLGADO A LA SOMBRA, LEJOS DE ESTUFAS Y RADIADORES. CON EL USO LA CERA SE MARCA Y SE QUIEBRA EN LOS PLIEGUES — ESO ES PARTE DE LA PIEZA. SE PUEDE VOLVER A ENCERAR.', images: ['assets/images/products/jean-encerado-1.webp', 'assets/images/products/jean-encerado-2.webp', 'assets/images/products/jean-encerado-3.webp', 'assets/images/products/jean-encerado-4.webp', 'assets/images/products/jean-encerado-5.webp'] },
        { slug: 'bermuda-camo-woodland', sku: 'BER-1/1-CAM', category: 'INTERVENCIONES', name: 'BERMUDA CAMO "WOODLAND"', title: 'BERMUDA CAMO "WOODLAND"', color: 'Camo', colorway: '1/1', price: '$130.000', description: 'PANTALÓN CARGO MILITAR EN CAMUFLADO WOODLAND INTERVENIDO A<br>MANO. PIEZA 1/1. CORTADO A LA ALTURA DE LA BERMUDA Y ABIERTO<br>CON PANELES AGREGADOS SOBRE LA ENTREPIERNA, QUE LLEVAN EL<br>CALCE A UNA SILUETA MUCHO MÁS ANCHA. BAJO DESHILACHADO SIN<br>DOBLADILLO. BOLSILLOS CARGO ORIGINALES. AVÍOS Y ETIQUETAS DE<br>LA MARCA. HECHA A MANO EN ARGENTINA.', images: ['assets/images/products/bermuda-camo-woodland-1.webp', 'assets/images/products/bermuda-camo-woodland-2.webp', 'assets/images/products/bermuda-camo-woodland-3.webp'] },

        // REMERA BABY TEE (3 colorways - mujer)
        { slug: 'baby-tee-negro', sku: 'REM-BBY-NEG', category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE REGISTRADA', color: 'Negro', colorway: 'NEGRO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/baby-tee-negro-1.webp', 'assets/images/products/baby-tee-negro-2.webp', 'assets/images/products/baby-tee-negro-3.webp', 'assets/images/products/baby-tee-negro-4.webp', 'assets/images/products/baby-tee-negro-5.webp'] },
        { slug: 'baby-tee-blanco', sku: 'REM-BBY-BLA', category: 'REMERAS', name: 'REMERA BABY TEE REGISTRADA', title: 'REMERA BABY TEE REGISTRADA', color: 'Blanco', colorway: 'BLANCO', price: '$45.000', description: 'REMERA DE MUJER AL CUERPO CON CUELLO REDONDO, 100% ALGODÓN. DESGASTES SUTILES A MANO EN COSTURAS Y BORDES. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/baby-tee-blanco-1.webp', 'assets/images/products/baby-tee-blanco-2.webp', 'assets/images/products/baby-tee-blanco-3.webp', 'assets/images/products/baby-tee-blanco-4.webp', 'assets/images/products/baby-tee-blanco-5.webp'] },

        // REMERA MANGA LARGA TERMAL (2 colorways)
        { slug: 'termal-negro', sku: 'REM-TRM-NEG', category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA TERMAL', color: 'Negro', colorway: 'NEGRO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/termal-negro-1.webp', 'assets/images/products/termal-negro-2.webp', 'assets/images/products/termal-negro-3.webp', 'assets/images/products/termal-negro-4.webp', 'assets/images/products/termal-negro-5.webp'] },
        { slug: 'termal-blanco', sku: 'REM-TRM-BLA', category: 'REMERAS', name: 'REMERA MANGA LARGA TERMAL', title: 'REMERA MANGA LARGA TERMAL', color: 'Blanco', colorway: 'BLANCO', price: '$70.000', description: 'REMERA DE MANGA LARGA DE TELA WAFFLE PESADA, 100% ALGODÓN. CON MANGAS EXTRA LARGAS PARA UN CALCE EN CAPAS, PUÑOS RIBB CON AGUJEROS PARA EL PULGAR. COSTURAS EXPUESTAS Y DESGASTADAS EN CONTRASTE. ESTAMPA EN SERIGRAFÍA SOBRE EL PECHO. HECHA EN ARGENTINA.', images: ['assets/images/products/termal-blanco-1.webp', 'assets/images/products/termal-blanco-2.webp', 'assets/images/products/termal-blanco-3.webp', 'assets/images/products/termal-blanco-4.webp', 'assets/images/products/termal-blanco-5.webp', 'assets/images/products/termal-blanco-6.webp'] },
    ];

    // -------------------------------------------------------------------------
    // GUÍA DE TALLES — config por tipo de prenda (Feature 1)
    // Mapeo producto → calce → SVG (los 9 diagramas de public/assets/size-charts).
    // NOTA: medidas y descripciones son PLACEHOLDERS razonables; se afinan en la
    // pasada de descripciones por producto.
    // -------------------------------------------------------------------------
    const CONTACTO_TALLES = 'Ante cualquier consulta, escribinos a <a href="mailto:info@guidocapuzzi.com">info@guidocapuzzi.com</a>.';
    const SIZE_CHARTS = {
        oversize: {
            svg: '/assets/size-charts/oversize_sc.svg',
            desc: ['Nuestra remera oversize puede usarla cualquier persona y está diseñada para un calce holgado y amplio. Para un calce más regular, podés elegir un talle menos.', 'Para ayudarte a encontrar tu talle, te damos las medidas exactas, tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Pecho', 'C. Hombro', 'D. Manga'],
            rows: { XS: [68, 54, 50, 22], S: [70, 57, 52, 23], M: [72, 60, 54, 24], L: [74, 63, 56, 25] }
        },
        boxy: {
            svg: '/assets/size-charts/boxy_sc.svg',
            desc: ['Remera de corte boxy con calce relajado. Para un calce más ajustado, podés elegir un talle menos.', 'Todas las medidas están tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Pecho', 'C. Hombro', 'D. Manga'],
            rows: { XS: [69, 55, 51, 22], S: [71, 58, 53, 23], M: [73, 61, 55, 24], L: [75, 64, 57, 25] }
        },
        bbyt: {
            svg: '/assets/size-charts/bbyt_sc.svg',
            desc: ['Remera baby tee de mujer, al cuerpo. Calce entallado y corto.', 'Todas las medidas están tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Pecho', 'C. Hombro', 'D. Manga'],
            rows: { XS: [54, 42, 36, 18], S: [56, 45, 38, 19], M: [58, 48, 40, 20], L: [60, 51, 42, 21] }
        },
        termal: {
            svg: '/assets/size-charts/termal_sc.svg',
            desc: ['Remera manga larga termal, pensada para un calce en capas con mangas extra largas.', 'Todas las medidas están tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Pecho', 'C. Hombro', 'D. Manga'],
            rows: { XS: [70, 54, 50, 62], S: [72, 57, 52, 63], M: [74, 60, 54, 64], L: [76, 63, 56, 65] }
        },
        musculosa: {
            svg: '/assets/size-charts/musculosa_sc.svg',
            desc: ['Musculosa oversize sin mangas, calce holgado. Para un calce más ajustado, podés elegir un talle menos.', 'Todas las medidas están tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Pecho', 'C. Hombro'],
            rows: { XS: [70, 56, 40], S: [72, 59, 42], M: [74, 62, 44], L: [76, 65, 46] }
        },
        suelto: {
            svg: '/assets/size-charts/suelto_sc.svg',
            desc: ['Nuestro jean de corte suelto puede usarlo cualquier persona y está diseñado para un calce holgado y amplio. Para un calce más ajustado, podés elegir un talle menos.', 'Para ayudarte a encontrar tu talle, te damos las medidas exactas, tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Cintura', 'C. Cadera', 'D. Tiro', 'E. Botamanga'],
            rows: { XS: [102, 74, 100, 28, 22], S: [104, 78, 104, 29, 23], M: [106, 82, 108, 30, 24], L: [108, 86, 112, 31, 25] }
        },
        regular: {
            svg: '/assets/size-charts/regular_sc.svg',
            desc: ['Nuestro jean de corte regular está diseñado para un calce recto y cómodo. Para un calce más suelto, podés elegir un talle más.', 'Para ayudarte a encontrar tu talle, te damos las medidas exactas, tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Cintura', 'C. Cadera', 'D. Tiro', 'E. Botamanga'],
            rows: { XS: [100, 74, 98, 28, 22], S: [102, 78, 102, 29, 23], M: [104, 82, 106, 30, 24], L: [106, 86, 110, 31, 25] }
        },
        levis: {
            svg: '/assets/size-charts/levis_sc.svg',
            desc: ['Pieza única 1/1 intervenida a mano sobre un jean Levi\'s 517 de corte bootcut.', 'Las medidas corresponden a la prenda intervenida, tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Cintura', 'C. Cadera', 'D. Tiro', 'E. Botamanga'],
            rows: { XS: [104, 76, 100, 29, 24], S: [106, 80, 104, 30, 25], M: [108, 84, 108, 31, 26], L: [110, 88, 112, 32, 27] }
        },
        bermudas: {
            svg: '/assets/size-charts/bermudas_sc.svg',
            desc: ['Bermuda de denim selvedge de inspiración workwear, calce holgado.', 'Todas las medidas están tomadas con la prenda apoyada en plano, en centímetros.'],
            cols: ['A. Largo', 'B. Cintura', 'C. Cadera', 'D. Tiro', 'E. Botamanga'],
            rows: { XS: [52, 76, 100, 28, 30], S: [54, 80, 104, 29, 31], M: [56, 84, 108, 30, 32], L: [58, 88, 112, 31, 33] }
        }
    };

    // Restricción temporal (opción B): estas categorías se muestran en el Shop como
    // teaser (foto atenuada + badge) pero su PDP está bloqueada. Cuando estén listas
    // para lanzarse, se quita la categoría de acá y se retocan sus descripciones.
    const RESTRICTED_CATEGORIES = ['TOPS / MUSCULOSAS', 'BERMUDAS / SHORTS'];
    function isRestricted(product) {
        return !!product && RESTRICTED_CATEGORIES.includes(product.category);
    }

    // Resuelve producto → calce (por prefijo de slug, orden importa) → config
    function getSizeChart(product) {
        const slug = (product && product.slug) || '';
        let fit = null;
        if (slug.startsWith('remera-guido')) fit = 'oversize';
        else if (slug.startsWith('remera-afligida')) fit = 'boxy';
        else if (slug.startsWith('baby-tee')) fit = 'bbyt';
        else if (slug.startsWith('termal')) fit = 'termal';
        else if (slug.startsWith('musculosa')) fit = 'musculosa';
        else if (slug.startsWith('jean-selvedge-suelto')) fit = 'suelto';
        else if (slug.startsWith('jean-selvedge-regular')) fit = 'regular';
        else if (slug.startsWith('jean-pintor') || slug === 'jean-encerado') fit = 'levis';
        else if (slug.startsWith('bermuda')) fit = 'bermudas';
        return fit ? SIZE_CHARTS[fit] : null;
    }

    // Construye el markup del overlay del size chart para un producto.
    // isArchive → tabla completa pero con la fila del talle de la pieza fijada.
    function buildSizeGuide(product, cfg, isArchive, fixedSize) {
        const title = (product.title || product.name).replace(/<br\s*\/?>/gi, ' ');
        const descHTML = cfg.desc.map(p => `<p>${p}</p>`).join('') + `<p>${CONTACTO_TALLES}</p>`;
        const headHTML = `<tr><th>Talle</th>${cfg.cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
        const bodyHTML = Object.keys(cfg.rows).map(size =>
            `<tr data-size="${size}"><th>${size}</th>${cfg.rows[size].map(v => `<td data-cm="${v}">${v}</td>`).join('')}</tr>`
        ).join('');
        const archiveAttr = isArchive ? ` data-archive="1" data-fixed-size="${fixedSize || 'S'}"` : '';
        return `
                <div class="size-guide-overlay" id="size-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
                    <div class="size-guide-panel">
                        <div class="sg-topbar">
                            <span class="sg-label">Tabla de talles</span>
                            <button class="size-guide-close" id="size-guide-close" aria-label="Cerrar">&times;</button>
                        </div>
                        <h2 class="size-guide-title" id="size-guide-title">${title}</h2>
                        <div class="sg-desc">${descHTML}</div>
                        <div class="size-guide-body">
                            <div class="sg-table-wrap">
                                <table class="size-guide-table" id="sg-table"${archiveAttr}>
                                    <thead>${headHTML}</thead>
                                    <tbody>${bodyHTML}</tbody>
                                </table>
                            </div>
                            <figure class="size-guide-diagram" aria-hidden="true">
                                <img src="${cfg.svg}" alt="">
                            </figure>
                        </div>
                    </div>
                </div>`;
    }

    // -------------------------------------------------------------------------
    // 2. HOME ANIMATION LOGIC (Avant-Garde Premium)
    // -------------------------------------------------------------------------

    // Scroll Phase State Machine
    let scrollPhase = 0; // 0: initial, 1: logo morphed, 2: marquee hidden (free scroll)
    let isAnimating = false;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let scrollLocked = !isMobile; // Mobile: never lock scroll; Desktop: lock during phase transitions

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
        if (isMobile) return; // No parallax on mobile — static positioning via CSS

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

    // --- MOBILE: SCROLL POSITION PHASE DETECTION ---
    // On mobile, wheel events don't fire for touch scroll.
    // Instead, detect scroll position to trigger phases.
    function handleMobileScroll() {
        if (!isMobile) return;
        if (!body.classList.contains(STATE_HOME)) return;

        const scrollTop = homeContainer.scrollTop;

        // Forward: trigger phases based on scroll position
        if (scrollTop > 5 && scrollPhase === 0 && !isAnimating) {
            triggerPhase1();
        } else if (scrollPhase === 1 && !isAnimating) {
            // Phase 2 triggers shortly after phase 1 completes
            triggerPhase2();
        }

        // Reverse: when scrolled back to top, reverse phases
        if (scrollTop === 0 && scrollPhase === 2 && !isAnimating) {
            isAnimating = true;
            if (announcementBar) {
                announcementBar.classList.remove('hidden');
                body.classList.remove('announcement-hidden');
            }
            setTimeout(() => {
                scrollPhase = 1;
                isAnimating = false;
                // Continue reversing to phase 0
                setTimeout(() => {
                    if (homeContainer.scrollTop === 0 && scrollPhase === 1 && !isAnimating) {
                        isAnimating = true;
                        if (heroLogo) heroLogo.classList.remove('morphed');
                        if (headerLogo) headerLogo.classList.remove('visible');
                        setTimeout(() => {
                            scrollPhase = 0;
                            isAnimating = false;
                        }, 800);
                    }
                }, 100);
            }, 400);
        }
    }

    // Attach listeners to home container
    if (homeContainer) {
        homeContainer.addEventListener('wheel', handleWheelEvent, { passive: false });
        homeContainer.addEventListener('scroll', handleParallax);
        if (isMobile) {
            homeContainer.addEventListener('scroll', handleMobileScroll);
        }
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
                // Home phase 0: mostrar el logo del centro con CUALQUIER link (no solo
                // Shop) para que se invierta de forma consistente cuando el header se activa.
                if (body.classList.contains(STATE_HOME) && scrollPhase === 0) {
                    if (headerLogo) headerLogo.classList.add('visible');
                }
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

        // Show announcement bar and re-sync marquee animation
        if (announcementBar) {
            announcementBar.classList.remove('hidden');
            // Force restart CSS animation to reset speed after display:none toggle
            const track = document.getElementById('announcement-track');
            if (track) {
                track.style.animation = 'none';
                // eslint-disable-next-line no-unused-expressions
                track.offsetHeight; // force reflow
                track.style.animation = '';
            }
        }
        body.classList.remove('announcement-hidden');

        // Re-init marquee content (recalculates repetitions after returning from hidden state)
        initMarquee();

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

    // --- MOBILE MENU LOGIC ---
    function openMobileMenu() {
        // Reset links before opening
        mobileCatLinks.forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(12px)';
        });
        body.classList.add('mobile-menu-open');
        // Stagger reveal (same pattern as desktop dropdown)
        mobileCatLinks.forEach((link, i) => {
            setTimeout(() => {
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, 200 + i * 60);
        });
    }

    function closeMobileMenu() {
        body.classList.remove('mobile-menu-open');
        // Reset for next open
        mobileCatLinks.forEach(link => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(12px)';
        });
    }

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
                color: product.color,
                colorway: product.colorway || '',
                // SKU completo de la variante: es la clave con la que el checkout
                // resuelve variante_id. `product.sku` es el prefijo (producto +
                // colorway) y el talle lo completa. Ver checkout-logic.js.
                sku: product.sku ? `${product.sku}-${size}` : null
            });
        }
        updateCartCounts();
        // openCart() se llama externamente (PDP: después de la barra de carga)

        // Meta Pixel — AddToCart
        if (window.fbq) {
            window.fbq('track', 'AddToCart', {
                content_name: `${product.name} ${product.color}`,
                content_ids: [product.slug || String(productIndex)],
                content_type: 'product',
                value: parseInt((product.price || '0').replace(/[^0-9]/g, '')) || 0,
                currency: 'ARS'
            });
        }
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

        // Update mobile menu cart count
        // Mobile header cart badge
        if (mobileCartBadge) {
            mobileCartBadge.textContent = totalQty;
            mobileCartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
        }

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

    /* En mobile el botón FILTROS flota fijo sobre la grilla, pero #shop tiene
       un transform (la transición de páginas) que lo convierte en el bloque
       contenedor de position:fixed y lo ancla al alto de la sección en vez
       del viewport. Se mueve el mismo botón al body — así conserva su
       listener — y vuelve a la fila del título en desktop. */
    const filtrosMobileMQ = window.matchMedia('(max-width: 768px)');

    function syncFiltrosPlacement() {
        if (!filtersTriggerBtn) return;
        const titleRow = document.querySelector('.shop-title-row');
        if (filtrosMobileMQ.matches) {
            if (filtersTriggerBtn.parentElement !== body) body.appendChild(filtersTriggerBtn);
        } else if (titleRow && filtersTriggerBtn.parentElement !== titleRow) {
            titleRow.appendChild(filtersTriggerBtn);
        }
    }
    syncFiltrosPlacement();
    filtrosMobileMQ.addEventListener('change', syncFiltrosPlacement);

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

    // --- FILTER APPLICATION LOGIC ---
    function getActiveFilters() {
        // Sort (name="ordenar", values: ultimos, alto-bajo, bajo-alto)
        const sortRadio = filtersDrawer.querySelector('input[name="ordenar"]:checked');
        const sort = sortRadio ? sortRadio.value : 'ultimos';

        // Colors (name="color", dynamically generated)
        const colorChecked = filtersDrawer.querySelectorAll('#filter-color-options input[name="color"]:checked');
        const colors = Array.from(colorChecked).map(c => c.value);

        // Sizes (name="talle" — framework, all products have all sizes for now)
        const sizeChecked = filtersDrawer.querySelectorAll('input[name="talle"]:checked');
        const sizes = Array.from(sizeChecked).map(s => s.value);

        // Categories (name="categoria", only visible in VER TODO)
        const catChecked = filtersDrawer.querySelectorAll('input[name="categoria"]:checked');
        const categories = Array.from(catChecked).map(c => c.value);

        return { sort, colors, sizes, categories };
    }

    function parsePrice(priceStr) {
        // "$50.000" → 50000, "$240.000" → 240000
        return Number(priceStr.replace(/[^0-9]/g, '')) || 0;
    }

    function applyFilters() {
        const { sort, colors, categories } = getActiveFilters();

        // Start with category-filtered products (based on current shop view)
        let filtered = products.slice();
        if (currentShopCategory !== 'VER TODO') {
            filtered = filtered.filter(p => p.category === currentShopCategory);
        }

        // Apply CATEGORIA filter (only in VER TODO, when checkboxes selected)
        // Checkbox values → product.category mapping
        if (currentShopCategory === 'VER TODO' && categories.length > 0) {
            const catMap = {
                'JEANS': 'PANTALONES / JEANS',
                'REMERAS': 'REMERAS',
                'BERMUDAS': 'BERMUDAS / SHORTS',
                'MUSCULOSAS': 'TOPS / MUSCULOSAS',
                'UNISEX': null,  // tag-based, not a category
                'MUJER': null,   // tag-based, not a category
                '1/1': 'INTERVENCIONES'
            };
            // Resolve mapped categories
            const mappedCats = categories.map(c => catMap[c]).filter(Boolean);
            // Special handling for UNISEX / MUJER (tag-based filters)
            const hasUnisex = categories.includes('UNISEX');
            const hasMujer = categories.includes('MUJER');
            filtered = filtered.filter(p => {
                // Category match
                if (mappedCats.length > 0 && mappedCats.includes(p.category)) return true;
                // MUJER: baby tees and items with feminine descriptors
                if (hasMujer && (p.name.includes('BABY TEE') || p.name.includes('MUJER'))) return true;
                // UNISEX: everything except baby tees
                if (hasUnisex && !p.name.includes('BABY TEE') && !p.name.includes('MUJER')) return true;
                return false;
            });
        }

        // Apply COLOR filter (exact match on .color field — evita que "BLANCO LOGO NEGRO" matchee filtro NEGRO)
        if (colors.length > 0) {
            filtered = filtered.filter(p => {
                const productColor = (p.color || '').toUpperCase();
                return colors.some(c => productColor === c.toUpperCase());
            });
        }

        // Apply SORT
        if (sort === 'alto-bajo') {
            filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        } else if (sort === 'bajo-alto') {
            filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        }
        // 'ultimos' = default order, no sort needed

        // Re-render grid
        const grid = document.getElementById('product-grid');

        if (grid) {
            if (filtered.length > 0) {
                grid.innerHTML = groupByProduct(filtered).map(buildProductCard).join('');
            } else {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; font-family: var(--font-condensed); text-transform: uppercase; opacity: 0.5;">No hay productos con estos filtros</div>';
            }
            attachProductClickListeners();
            attachSwatchListeners(grid);
            revealProductCards(grid);
        }
    }

    // Clear all filters (QUITAR TODOS)
    if (filtersClearBtn) {
        filtersClearBtn.addEventListener('click', () => {
            // Reset all radio buttons to first option
            const radios = filtersDrawer.querySelectorAll('input[type="radio"]');
            radios.forEach((radio, index) => {
                radio.checked = index === 0;
            });

            // Uncheck all checkboxes
            const checkboxes = filtersDrawer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });

            // Re-render grid with no filters
            applyFilters();
            closeFilters();
        });
    }

    // Apply filters button (MOSTRAR)
    if (filtersApplyBtn) {
        filtersApplyBtn.addEventListener('click', () => {
            applyFilters();
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
        'INTERVENCIONES': null // No color filter in INTERVENCIONES
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
    window.enableConfirmationState = enableConfirmationState;

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
            case 'archive':
                url = stateObj.archiveSlug
                    ? `${URL_ARCHIVE}/colecciones/${encodeURIComponent(stateObj.archiveSlug)}`
                    : URL_ARCHIVE;
                break;
            default:
                url = URL_HOME;
        }
        history.pushState(stateObj, '', url);
    }

    function getActiveSection() {
        // Archivo no usa una body-class de estado propia: se detecta por visibilidad
        // del contenedor. Debe evaluarse primero para que salir del índice lo oculte.
        const archivoEl = document.getElementById('archivo-container');
        if (archivoEl && archivoEl.style.display && archivoEl.style.display !== 'none') return archivoEl;
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
        if (body.classList.contains(STATE_CONFIRMATION)) return document.getElementById('confirmation-container');
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
        // El Archivo no tiene header (toda su navegación es el botón MENU): al entrar
        // o salir de su contenedor hay que prender/apagar ese chrome. Se hace acá
        // porque transitionState es el único paso obligatorio de todo cambio de sección.
        setArchivoChrome(!!enterEl && enterEl.id === 'archivo-container');
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
        const product = products[productIndex];
        if (!product) return;
        // Restricción temporal (opción B): PDP bloqueada para estas categorías.
        // Cualquier intento de entrar (related, URL directa, popstate) rebota al Shop.
        if (isRestricted(product)) {
            enableShopState(null, 'VER TODO', skipHistory);
            return;
        }
        currentProductIndex = productIndex;
        if (!skipHistory) pushHistory({ state: 'pdp', productIndex: Number(productIndex) });

        const exitEl = getActiveSection();
        const productPage = document.getElementById('product-page');

        // Pre-inyectar contenido ANTES de la animación
        if (productPage) {
            productPage.style.pointerEvents = 'auto';

            const images = product.images && product.images.length > 0 ? product.images : [];
            const absImg = src => (src.startsWith('/') ? src : '/' + src);
            // Galería 2026: carrusel horizontal full-bleed con flechas ‹ › y contador
            // "N/M" arriba a la izquierda (spec: frontend_nuevo/pdp_nuevo_1.svg).
            const slidesHTML = images.length > 0
                ? images.map((src, i) => `<img src="${absImg(src)}" id="pdp-img-${i}" class="pdp-slide" alt="${product.name}">`).join('')
                : '<div class="pdp-slide" style="background:#eff3f4;"></div>';
            const chev = (d) => `<svg viewBox="0 0 12 22" fill="none" aria-hidden="true"><path d="${d}" stroke="#1A1A1A" stroke-width="2.6" stroke-linecap="square"/></svg>`;
            const imagesHTML = `
                        <div class="pdp-slides" id="pdp-slides">${slidesHTML}</div>
                        <span class="pdp-counter" id="pdp-counter">1/${Math.max(images.length, 1)}</span>
                        <button class="pdp-nav pdp-nav--prev" id="pdp-prev" aria-label="Foto anterior">${chev('M10 1 2 11l8 10')}</button>
                        <button class="pdp-nav pdp-nav--next" id="pdp-next" aria-label="Foto siguiente">${chev('M2 1l8 10-8 10')}</button>`;

            // Set page title per product
            document.title = `${product.name} ${product.color} — GÜIDO CAPUZZI`;
            const isArchive = product.category === 'INTERVENCIONES';

            // Meta Pixel — ViewContent
            if (window.fbq) {
                window.fbq('track', 'ViewContent', {
                    content_name: `${product.name} ${product.color}`,
                    content_category: product.category || 'ROPA',
                    content_ids: [product.slug || String(productIndex)],
                    content_type: 'product',
                    value: parseInt((product.price || '0').replace(/[^0-9]/g, '')) || 0,
                    currency: 'ARS'
                });
            }
            const sizeOtherStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';
            const qtyContainerStyle = isArchive ? 'style="opacity: 0.5; pointer-events: none;"' : '';

            // Guía de talles (Feature 1) — trigger + overlay por producto.
            // Archivo: fila del talle habilitado (S en el template) queda fijada.
            const sizeChart = getSizeChart(product);
            const sizeGuideTrigger = sizeChart ? '<button class="size-guide-trigger font-condensed" id="size-guide-open">TABLA DE TALLES</button>' : '';
            const sizeGuideOverlay = sizeChart ? buildSizeGuide(product, sizeChart, isArchive, 'S') : '';

            // Bloque de cuidados (denim) — subtítulo CUIDADO + texto, debajo del botón AÑADIR.
            const careHTML = product.care ? `
                        <div class="pdp-care">
                            <h4 class="pdp-care-title font-condensed">CUIDADO</h4>
                            <p class="pdp-care-text">${product.care}</p>
                        </div>` : '';

            productPage.innerHTML = `
                <div class="pdp-container">
                    <div class="pdp-gallery${images.length > 1 ? '' : ' pdp-gallery--single'}" id="pdp-gallery">${imagesHTML}</div>
                    <div class="pdp-info">
                        <div class="pdp-info-head">
                            <h1 class="pdp-title font-condensed">${product.title || product.name}</h1>
                            <span class="pdp-price font-condensed">${product.price}</span>
                        </div>
                        <div class="pdp-colorway-block">
                            <span class="pdp-colorway font-condensed">COLOR: ${product.colorLabel || product.color || product.colorway}</span>
                            <span class="pdp-colorway-chip" style="--chip: ${product.swatch || SWATCH_COLORS[product.color] || '#1A1A1A'}"></span>
                        </div>
                        <div class="pdp-selectors">
                            <div class="selector-group">
                                <span class="pdp-size-label font-condensed">TALLE:</span>
                                <div class="size-options">
                                    <button class="size-btn" ${sizeOtherStyle}>XS</button>
                                    <button class="size-btn active">S</button>
                                    <button class="size-btn" ${sizeOtherStyle}>M</button>
                                    <button class="size-btn" ${sizeOtherStyle}>L</button>
                                </div>
                                ${sizeGuideTrigger}
                            </div>
                        </div>
                        <button class="add-to-cart-btn font-condensed" id="pdp-add-btn"><span class="hover-fill"></span><span class="btn-label">AÑADIR AL CARRITO</span></button>
                        <p class="pdp-description">${product.description || 'DESCRIPCIÓN NO DISPONIBLE.'}</p>
                        ${careHTML}
                    </div>
                </div>
                <div class="related-section">
                    <div class="related-header"><h3 class="font-condensed">TAMBIÉN TE PUEDE GUSTAR</h3></div>
                    <div class="related-grid" id="related-grid"></div>
                </div>
                <footer class="site-footer shop-footer pdp-footer">
                    <div class="sf-top">
                        <div class="sf-copyright">
                            <p>© <span class="footer-year-range"></span> GÜIDO CAPUZZI, CAPMAT STUDIOS S.R.L. TODOS LOS DERECHOS RESERVADOS. <span class="footer-cuit">CUIT 33-71917919-9</span></p>
                        </div>
                        <nav class="sf-nav">
                            <div class="sf-nav-col">
                                <button type="button" class="sf-nav-title font-condensed">SOPORTE</button>
                                <ul class="sf-nav-list">
                                    <li><a href="#" class="sf-account-link"><span>CUENTA</span></a></li>
                                    <li><a href="#" class="trigger-contact"><span>CONTACTO</span></a></li>
                                    <li><a href="#"><span>FAQ</span></a></li>
                                </ul>
                            </div>
                            <div class="sf-nav-col">
                                <button type="button" class="sf-nav-title font-condensed">LEGALES</button>
                                <ul class="sf-nav-list">
                                    <li><a href="#" class="trigger-legales" data-section="terminos"><span>TÉRMINOS Y CONDICIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="privacidad"><span>POLÍTICA DE PRIVACIDAD</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="devoluciones"><span>DEVOLUCIONES</span></a></li>
                                    <li><a href="#" class="trigger-legales" data-section="cookies"><span>POLÍTICA DE COOKIES</span></a></li>
                                </ul>
                            </div>
                            <div class="sf-nav-col">
                                <button type="button" class="sf-nav-title font-condensed">SOCIALES</button>
                                <ul class="sf-nav-list">
                                    <li><a href="https://www.instagram.com/gu.idocapuzzi/" target="_blank" rel="noopener noreferrer"><span>INSTAGRAM</span></a></li>
                                    <li><a href="https://www.tiktok.com/@gu.idocapuzzi" target="_blank" rel="noopener noreferrer"><span>TIKTOK</span></a></li>
                                    <li><a href="#" data-pending-url="twitter"><span>TWITTER</span></a></li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                    <div class="sf-newsletter">
                        <div class="sf-nl-head">
                            <button type="button" class="sf-nl-title">SUSCRIBITE AL NEWSLETTER</button>
                            <button type="button" class="sf-nl-toggle">CERRAR</button>
                        </div>
                        <p class="sf-nl-sub">REGISTRATE AL NEWSLETTER DE GÜIDO CAPUZZI Y RECIBÍ UN 15% DE DESCUENTO EN TU PRIMERA COMPRA.</p>
                        <form class="sf-nl-form" novalidate>
                            <input type="text" class="sf-nl-field" name="nombre" placeholder="NOMBRE" autocomplete="given-name" />
                            <input type="text" class="sf-nl-field" name="apellido" placeholder="APELLIDO" autocomplete="family-name" />
                            <input type="email" class="sf-nl-field" name="email" placeholder="EMAIL" autocomplete="email" />
                            <div class="sf-nl-foot">
                                <label class="sf-nl-consent">
                                    <input type="checkbox" name="consent" />
                                    <span>Al completar esto, estas aceptando los términos de nuestra política de privacidad.</span>
                                </label>
                                <button type="submit" class="sf-nl-submit">SUSCRIBIRME</button>
                            </div>
                            <p class="sf-nl-msg" role="status" aria-live="polite"></p>
                        </form>
                    </div>
                    <div class="footer-logo-container">
                        <img src="/assets/brand/logo-guido-registrado.svg" class="footer-logo" alt="GÜIDO CAPUZZI" />
                    </div>
                </footer>
                ${sizeGuideOverlay}
            `;

            // (El botón se resetea solo: el template se reinyecta fresco en cada PDP.)

            initPDPInteractions();
            initPDPRelated();
            initFooterLogoReveal();
            initFooterInteractions();
        }

        transitionState(exitEl, productPage, 'block', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
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

        // Talle por defecto: leer el que viene marcado .active en el template (S)
        const activeSizeBtn = productPage.querySelector('.size-btn.active');
        let selectedSize = activeSizeBtn ? activeSizeBtn.textContent : 'S';
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

        // 2. Add to Cart — fill NEGRO (Feature 3): AÑADIENDO → AÑADIDO → drawer.
        //    El botón queda negro (.filled), no se vacía.
        const addBtn = document.getElementById('pdp-add-btn');
        if (addBtn) {
            const label = addBtn.querySelector('.btn-label');
            addBtn.addEventListener('click', async () => {
                if (addBtn.dataset.adding === '1') return;
                addBtn.dataset.adding = '1';

                // Registrar en el carrito
                addToCart(currentProductIndex, selectedSize, selectedQty);

                // FASE 1: fill negro (izq→der, 320ms CSS) + texto AÑADIENDO...
                addBtn.classList.add('filled');
                label.style.transition = 'opacity 120ms ease';
                label.style.opacity = '0';

                await new Promise(r => setTimeout(r, 200));
                label.textContent = 'AÑADIENDO...';
                label.style.opacity = '0.7';

                await new Promise(r => setTimeout(r, 620));

                // FASE 2: confirmación — AÑADIDO — (queda negro)
                label.style.opacity = '0';
                await new Promise(r => setTimeout(r, 130));
                label.textContent = '— AÑADIDO —';
                label.style.opacity = '1';

                // FASE 3: abrir drawer 400ms después
                await new Promise(r => setTimeout(r, 400));
                openCart();

                delete addBtn.dataset.adding;
            });
        }

        // 3. Galería 2026 — carrusel horizontal: flechas ‹ ›, contador N/M,
        //    teclado ← →, swipe táctil. Sin miniaturas (las reemplaza el contador).
        const slides = document.getElementById('pdp-slides');
        if (slides) {
            const total = slides.children.length;
            const counter = document.getElementById('pdp-counter');
            const prev = document.getElementById('pdp-prev');
            const next = document.getElementById('pdp-next');
            let idx = 0;

            const render = () => {
                slides.style.transform = `translateX(${-idx * 100}%)`;
                if (counter) counter.textContent = `${idx + 1}/${total}`;
                if (prev) prev.disabled = idx === 0;
                if (next) next.disabled = idx === total - 1;
            };
            const go = (n) => { idx = Math.max(0, Math.min(total - 1, n)); render(); };

            if (prev) prev.addEventListener('click', () => go(idx - 1));
            if (next) next.addEventListener('click', () => go(idx + 1));

            // Teclado: singleton a nivel document (no acumular entre PDPs).
            // Se ignora si la guía de talles está abierta — ahí manda Escape.
            if (window.__pdpGalleryKeys) document.removeEventListener('keydown', window.__pdpGalleryKeys);
            window.__pdpGalleryKeys = (e) => {
                const guide = document.querySelector('.size-guide-overlay.open');
                if (guide) return;
                if (e.key === 'ArrowLeft') go(idx - 1);
                else if (e.key === 'ArrowRight') go(idx + 1);
            };
            document.addEventListener('keydown', window.__pdpGalleryKeys);

            // Swipe (mobile). Umbral de 40px para no comerse taps ni scroll vertical.
            let x0 = null, y0 = null;
            const gallery = document.getElementById('pdp-gallery');
            gallery.addEventListener('touchstart', (e) => {
                x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
            }, { passive: true });
            gallery.addEventListener('touchend', (e) => {
                if (x0 === null) return;
                const dx = e.changedTouches[0].clientX - x0;
                const dy = e.changedTouches[0].clientY - y0;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
                x0 = y0 = null;
            }, { passive: true });

            render();
        }
        // El scroll-spy del rail viejo ya no existe: si quedó colgado de una PDP
        // anterior, se desengancha.
        if (window.__pdpSpyScroll) {
            window.removeEventListener('scroll', window.__pdpSpyScroll);
            window.__pdpSpyScroll = null;
        }
        if (window.__pdpSpyResize) {
            window.removeEventListener('resize', window.__pdpSpyResize);
            window.__pdpSpyResize = null;
        }

        // 4. Guía de talles (Feature 1) — abrir/cerrar + unidades + cross-highlight
        // El overlay se mueve al <body>: el contenedor de la PDP tiene transform y
        // eso convierte cualquier position:fixed interno en relativo a la sección,
        // no al viewport (mismo bug que el botón FILTROS del Shop). Sin esto el
        // drawer no ancla al borde derecho real de la pantalla.
        document.querySelectorAll('body > .size-guide-overlay').forEach(el => el.remove());
        const overlay = document.getElementById('size-guide-overlay');
        if (overlay) {
            document.body.appendChild(overlay);
            const openBtn = document.getElementById('size-guide-open');
            const closeBtn = document.getElementById('size-guide-close');
            const openGuide = () => overlay.classList.add('open');
            const closeGuide = () => overlay.classList.remove('open');
            if (openBtn) openBtn.addEventListener('click', openGuide);
            if (closeBtn) closeBtn.addEventListener('click', closeGuide);
            overlay.addEventListener('click', e => { if (e.target === overlay) closeGuide(); });

            // Escape: singleton a nivel document (no acumular entre PDPs)
            if (window.__pdpEscClose) document.removeEventListener('keydown', window.__pdpEscClose);
            window.__pdpEscClose = (e) => {
                if (e.key === 'Escape') {
                    const ov = document.getElementById('size-guide-overlay');
                    if (ov) ov.classList.remove('open');
                }
            };
            document.addEventListener('keydown', window.__pdpEscClose);

            // Las medidas van siempre en centimetros: se saco el toggle CM / IN.
            // `data-cm` queda en cada celda documentando la unidad.
            const table = document.getElementById('sg-table');

            if (table.dataset.archive === '1') {
                // INTERVENCIONES: pieza 1/1 — fila del talle de la prenda fijada, sin hover dinámico
                const fixed = table.dataset.fixedSize;
                const row = table.querySelector(`tbody tr[data-size="${fixed}"]`);
                if (row) [...row.children].forEach(c => c.classList.add('sg-hl'));
            } else {
                // Cross-highlight: al hover de una celda se enciende su fila y su columna
                const clearHl = () => table.querySelectorAll('.sg-hl').forEach(c => c.classList.remove('sg-hl'));
                table.addEventListener('mouseover', e => {
                    const cell = e.target.closest('th, td');
                    if (!cell || !table.contains(cell)) return;
                    clearHl();
                    const col = cell.cellIndex;
                    [...cell.parentElement.children].forEach(c => c.classList.add('sg-hl'));
                    [...table.rows].forEach(r => { if (r.cells[col]) r.cells[col].classList.add('sg-hl'); });
                });
                table.addEventListener('mouseleave', clearHl);
            }
        }
    }

    function initPDPRelated() {
        const relatedContainer = document.getElementById('related-grid');
        if (!relatedContainer) return;

        // Random Selection (excluye prendas restringidas — no se sugieren)
        // 3 cards (spec pdp_nuevo_3.svg), antes eran 5
        const shuffled = [...products].filter(p => !isRestricted(p)).sort(() => 0.5 - Math.random()).slice(0, 3);

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
    /* ─── SHOP 2026: card por producto con selector de colorway ───────────
       Spec: frontend_nuevo/shop_nuevo_desktop.svg + shop_nuevo_mobile.svg
       El catálogo sigue siendo plano (una entrada por colorway); acá se
       agrupa por `name` sólo para pintar la grilla. No toca carrito ni
       checkout: el card lleva data-index del colorway activo, así que el
       click abre la PDP que ya existe.
       ──────────────────────────────────────────────────────────────────── */

    // Fill de cada swatch. Los de remera salen del SVG de Naza; los de denim
    // son tentativos — confirmar con las fotos reales.
    const SWATCH_COLORS = {
        'Negro': '#1A1A1A',
        'Blanco': '#FAFAFA',
        'Negro / Rojo': '#96201D',
        'Navy': '#061A66',
        'Índigo': '#2F3E63',
        'Índigo/Negro': '#2F3E63',
        'Azul Lavado': '#7B93B8',
        'Negro Pintado': '#14110F',
        'Verde Encerado': '#23342A',
        'Camo': '#4B5335'
    };

    // Nombre corto para las cards en mobile: los títulos completos se comían
    // 3 y 4 renglones. Se sacan los conectores ("DE DENIM", "FIT") y se deja
    // lo que identifica la prenda. Sólo entran los que difieren del completo.
    const SHORT_NAMES = {
        'JEAN DE DENIM SELVEDGE JAPONES FIT SUELTO': 'JEAN SELVEDGE JAPONES SUELTO',
        'JEAN DE DENIM SELVEDGE JAPONES FIT REGULAR': 'JEAN SELVEDGE JAPONES REGULAR',
        'JEAN DE DENIM SELVEDGE ITALIANO FIT REGULAR': 'JEAN SELVEDGE ITALIANO REGULAR',
        'BERMUDA DE DENIM SELVEDGE DOUBLE KNEE': 'BERMUDA SELVEDGE DOUBLE KNEE',
        'BERMUDA DE DENIM SELVEDGE PATCHWORK': 'BERMUDA SELVEDGE PATCHWORK',
        'MUSCULOSA DOBLE SIMBOLO OVERSIZED': 'MUSCULOSA DOBLE SIMBOLO',
        'REMERA AFLIGIDA BAGGED TEE': 'REMERA AFLIGIDA BAGGED',
        'REMERA LOGO GÜIDO STRASS': 'REMERA LOGO STRASS'
    };

    function groupByProduct(list) {
        const groups = [];
        const byName = new Map();
        list.forEach(product => {
            let g = byName.get(product.name);
            if (!g) {
                g = { name: product.name, price: product.price, colorways: [] };
                byName.set(product.name, g);
                groups.push(g);
            }
            g.colorways.push(product);
        });
        return groups;
    }

    function absUrl(src) {
        if (!src) return '';
        return src.startsWith('/') ? src : '/' + src;
    }

    function buildProductCard(group) {
        const first = group.colorways[0];
        const idx = products.indexOf(first);
        const restricted = isRestricted(first);
        const imageSrc = absUrl(first.images && first.images[0]);
        const hoverSrc = absUrl(first.images && first.images[1]);

        // Un solo colorway → no se dibuja el selector
        const swatches = group.colorways.length > 1 ? `
                        <div class="product-swatches">
                            ${group.colorways.map((cw, i) => `
                                <button type="button"
                                    class="product-swatch${i === 0 ? ' is-active' : ''}"
                                    style="--swatch: ${cw.swatch || SWATCH_COLORS[cw.color] || '#1A1A1A'}"
                                    data-index="${products.indexOf(cw)}"
                                    data-img="${absUrl(cw.images && cw.images[0])}"
                                    data-hover="${absUrl(cw.images && cw.images[1])}"
                                    aria-label="${cw.colorway || cw.color}"></button>
                            `).join('')}
                        </div>` : '';

        return `
                    <div class="product-card${restricted ? ' product-card--restricted' : ''}" data-index="${idx}">
                        <div class="product-image">
                            ${imageSrc ? `
                                <img class="product-img-primary" src="${imageSrc}" alt="${group.name}">
                                ${hoverSrc ? `<img class="product-img-hover" src="${hoverSrc}" alt="${group.name}">` : ''}
                            ` : ''}
                        </div>
                        <div class="product-info">
                            <span class="product-name"><span class="pn-full">${group.name}</span><span class="pn-short">${SHORT_NAMES[group.name] || group.name}</span></span>
                            <span class="product-price">${restricted ? 'PRÓXIMAMENTE' : group.price}</span>
                        </div>${swatches}
                    </div>`;
    }

    /* Selector de colorway del card.
       Hover = preview: cambia la foto mientras el mouse está encima.
       Click = elección: ese colorway queda fijado, así que al salir del card
       la foto vuelve al elegido y no al primero. */
    function attachSwatchListeners(grid) {
        grid.querySelectorAll('.product-card').forEach(card => {
            const swatches = [...card.querySelectorAll('.product-swatch')];
            if (!swatches.length) return;
            const primary = card.querySelector('.product-img-primary');
            const hover = card.querySelector('.product-img-hover');

            const stateOf = (sw) => ({
                index: sw.dataset.index,
                img: sw.dataset.img,
                hover: sw.dataset.hover
            });

            // El colorway fijado arranca en el primero y sólo cambia por click
            let pinned = stateOf(swatches[0]);

            const apply = (st, activeSwatch) => {
                card.dataset.index = st.index;
                if (primary && st.img) primary.setAttribute('src', st.img);
                if (hover) {
                    if (st.hover) {
                        hover.setAttribute('src', st.hover);
                        hover.style.display = '';
                    } else {
                        hover.style.display = 'none';
                    }
                }
                swatches.forEach(s => s.classList.toggle('is-active', s === activeSwatch));
            };

            swatches.forEach(sw => {
                const preview = () => apply(stateOf(sw), sw);
                sw.addEventListener('mouseenter', preview);
                sw.addEventListener('focus', preview);
                // Click fija el colorway (y en mobile, donde no hay hover, es la única vía)
                sw.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pinned = stateOf(sw);
                    apply(pinned, sw);
                });
            });

            // Al salir del card se descarta el preview y queda el fijado
            card.addEventListener('mouseleave', () => {
                const pinnedSwatch = swatches.find(s => s.dataset.index === pinned.index);
                apply(pinned, pinnedSwatch);
            });
        });
    }

    function attachProductClickListeners() {
        // Only target shop grid cards, not related (handled separately)
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        const cards = grid.querySelectorAll('.product-card');
        cards.forEach(card => {
            // Clean slate assignment
            card.onclick = function () {
                const index = card.dataset.index;
                if (index !== undefined && !isRestricted(products[index])) enablePDPState(index);
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

        if (grid) {
            if (filteredProducts.length > 0) {
                grid.innerHTML = groupByProduct(filteredProducts).map(buildProductCard).join('');
            } else {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;">SIN STOCK EN ESTA CATEGORÍA</div>';
            }
            attachProductClickListeners();
            attachSwatchListeners(grid);
            revealProductCards(grid); // A3: stagger reveal
        }
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
            body.classList.remove(STATE_HOME, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
            body.classList.add(STATE_SHOP);
            [
                document.getElementById('account-login'),
                document.getElementById('account-contact'),
                document.getElementById('product-page'),
                document.getElementById('home-container'),
                document.getElementById('confirmation-container'),
                document.getElementById('checkout')
            ].forEach(sec => { if (sec && sec !== exitEl) { sec.style.display = 'none'; sec.style.opacity = '0'; } });
            if (shopSection) shopSection.style.pointerEvents = 'auto';
            header.style.backgroundColor = '';
            header.style.color = '';

            // Re-sync marquee animation (may have been left in stale state after display:none)
            const track = document.getElementById('announcement-track');
            if (track) {
                track.style.animation = 'none';
                // eslint-disable-next-line no-unused-expressions
                track.offsetHeight; // force reflow
                track.style.animation = '';
            }
            initMarquee();
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
            if (typeof STATE_CONFIRMATION !== 'undefined') body.classList.remove(STATE_CONFIRMATION);

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
                document.getElementById('legales-container'),
                document.getElementById('confirmation-container')
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

        // Verificar si hay sesión activa y routear al dashboard o al login
        if (window.supabaseClient) {
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    _showAccountDashboard(session.user);
                } else {
                    _showAccountLogin();
                }
            }).catch(() => {
                _showAccountLogin();
            });
        } else {
            _showAccountLogin();
        }
    }

    function _showAccountLogin() {
        const exitEl = getActiveSection();
        const enterEl = accountLoginSection;

        transitionState(exitEl, enterEl, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
            body.classList.add(STATE_ACCOUNT);
            [
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('home-container'),
                document.getElementById('account-contact'),
                document.getElementById('account-dashboard')
            ].forEach(sec => { if (sec && sec !== exitEl) sec.style.display = 'none'; });
            if (accountLoginSection) accountLoginSection.style.pointerEvents = 'auto';
            if (accountCreateSection) accountCreateSection.style.display = 'none';
            header.style.backgroundColor = '';
            header.style.color = '';
            window.scrollTo(0, 0);
            injectFooterInAccount();
        });
    }

    function _showAccountDashboard(user) {
        const nombre = user?.user_metadata?.nombre || '';
        const apellido = user?.user_metadata?.apellido || '';
        const email = user?.email || '';

        // Poblar datos del dashboard
        const cuentaGreeting = document.getElementById('cuenta-greeting');
        const dashNombre = document.getElementById('dash-nombre');
        const dashApellido = document.getElementById('dash-apellido');
        const dashEmail = document.getElementById('dash-email');
        const accountDashboard = document.getElementById('account-dashboard');

        if (cuentaGreeting) cuentaGreeting.textContent = nombre ? `BIENVENIDO, ${nombre.toUpperCase()}.` : 'MI CUENTA';
        if (dashNombre) dashNombre.textContent = nombre || '—';
        if (dashApellido) dashApellido.textContent = apellido || '—';
        if (dashEmail) dashEmail.textContent = email || '—';

        const exitEl = getActiveSection();

        transitionState(exitEl, accountDashboard, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
            body.classList.add(STATE_ACCOUNT);
            [
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('home-container'),
                document.getElementById('account-login'),
                document.getElementById('account-create'),
                document.getElementById('account-contact')
            ].forEach(sec => { if (sec && sec !== exitEl) sec.style.display = 'none'; });
            if (accountDashboard) accountDashboard.style.pointerEvents = 'auto';
            header.style.backgroundColor = '';
            header.style.color = '';
            window.scrollTo(0, 0);
            injectFooterInAccount();
            _initCuentaNav();
            _initCuentaListeners();
            loadCuentaPedidos();
            loadCuentaDirecciones();
            _loadCuentaPreferencias();
        });
    }

    // Cuenta dashboard nav switching (same pattern as legales)
    let _cuentaNavInitialized = false;
    function _initCuentaNav() {
        if (_cuentaNavInitialized) return;
        _cuentaNavInitialized = true;

        const navLinks = document.querySelectorAll('.cuenta-nav-link');
        const sections = document.querySelectorAll('.cuenta-section');

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const target = link.dataset.section;

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                sections.forEach(s => s.classList.remove('active'));
                const targetSection = document.getElementById('cuenta-' + target);
                if (targetSection) targetSection.classList.add('active');
            });
        });
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            // Sin cliente no hay sesión que cerrar contra Supabase, pero el resto de
            // la limpieza local tiene que correr igual. Antes el TypeError cortaba
            // el handler entero y el botón no hacía absolutamente nada.
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
                console.log('[Auth] Sesión cerrada');
            } else {
                console.error('[Auth] Cliente de Supabase no disponible — logout solo local');
            }
            stopPedidosPolling();
            _cuentaNavInitialized = false;
            _showAccountLogin();
        });
    }

    // =========================================================================
    // CUENTA — PEDIDOS, DATOS, DIRECCIONES, PREFERENCIAS
    // =========================================================================

    let _pedidosPollingTimer = null;
    let _cuentaListenersInitialized = false;

    async function _getAccessToken() {
        if (!window.supabaseClient) return null;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session?.access_token ?? null;
    }

    async function loadCuentaPedidos() {
        const token = await _getAccessToken();
        if (!token) return;
        const listEl = document.getElementById('cuenta-pedidos-list');
        if (!listEl) return;

        try {
            const res = await fetch('/api/cliente/ordenes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar pedidos');
            const { ordenes } = await res.json();

            if (!ordenes || ordenes.length === 0) {
                listEl.innerHTML = '<p class="cuenta-pedidos-empty">TODAVÍA NO TENÉS PEDIDOS. <a href="/shop">EXPLORÁ LA TIENDA</a> PARA HACER TU PRIMERA COMPRA.</p>';
                stopPedidosPolling();
                return;
            }

            listEl.innerHTML = ordenes.map(renderPedidoCard).join('');

            const hasActive = ordenes.some(o =>
                ['en_preparacion', 'en_camino', 'disponible_retiro_sucursal'].includes(o.estado_envio)
            );
            if (hasActive) startPedidosPolling();
        } catch (err) {
            console.error('[Cuenta] Error cargando pedidos:', err);
            if (listEl.querySelector('.cuenta-pedidos-empty')) return;
            listEl.innerHTML = '<p class="cuenta-pedidos-empty">ERROR AL CARGAR TUS PEDIDOS. RECARGÁ LA PÁGINA.</p>';
        }
    }

    function _formatFechaOrden(isoString) {
        if (!isoString) return '—';
        const d = new Date(isoString);
        const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
    }

    function _formatPrecio(centavos) {
        if (centavos == null) return '—';
        return '$' + Math.round(centavos / 100).toLocaleString('es-AR');
    }

    function _getOrdenBadge(estado, estado_envio) {
        if (estado === 'cancelado') return { label: 'CANCELADO', cls: 'status-cancelado' };
        if (estado_envio === 'entregado' || estado === 'entregado') return { label: 'ENTREGADO', cls: 'status-entregado' };
        if (estado_envio === 'no_entregado') return { label: 'INCIDENCIA', cls: 'status-alerta' };
        if (estado_envio === 'en_devolucion') return { label: 'EN DEVOLUCIÓN', cls: 'status-alerta' };
        if (estado_envio === 'en_camino' || estado_envio === 'disponible_retiro_sucursal' || estado === 'enviado') return { label: 'EN CAMINO', cls: 'status-activo' };
        if (estado === 'pagado' || estado === 'preparando' || estado_envio === 'en_preparacion') return { label: 'PROCESANDO', cls: 'status-pagado' };
        return { label: 'PENDIENTE', cls: 'status-pendiente' };
    }

    // ── Cronograma de envío ──────────────────────────────────────────────────

    function _sumarDiasHabiles(fecha, dias) {
        const d = new Date(fecha);
        let added = 0;
        while (added < dias) {
            d.setDate(d.getDate() + 1);
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) added++;
        }
        return d;
    }

    function _calcularEntregaEstimada(pagadoAt, tipoEnvio, provincia) {
        if (!pagadoAt) return null;
        const p = (provincia || '').toLowerCase();
        const cerca = p.includes('caba') || p.includes('capital federal') || p.includes('ciudad autónoma') || p.includes('buenos aires');
        const dias = tipoEnvio === 'sucursal' ? (cerca ? 2 : 4) : (cerca ? 3 : 5);
        return _sumarDiasHabiles(pagadoAt, dias);
    }

    function _formatFechaCorta(isoStr) {
        if (!isoStr) return null;
        const d = new Date(isoStr);
        const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        return `${d.getDate()} ${meses[d.getMonth()]}`;
    }

    function _formatTimestampCronograma(isoStr) {
        if (!isoStr) return null;
        const d = new Date(isoStr);
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const h = String(d.getHours()).padStart(2,'0');
        const m = String(d.getMinutes()).padStart(2,'0');
        return `${d.getDate()} ${meses[d.getMonth()]}, ${h}:${m}`;
    }

    function _eventoParaPaso(eventos, idEstados) {
        return (eventos || [])
            .filter(ev => idEstados.includes(ev.id_estado))
            .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento))[0] || null;
    }

    function _buildCronograma(orden) {
        const esSucursal = (orden.id_sucursal_oca || 0) > 0;
        const ev = orden.eventos_envio_oca || [];
        const estado = orden.estado;
        const estadoEnvio = orden.estado_envio;
        const cancelado = estado === 'cancelado';
        const isAlert = estadoEnvio === 'no_entregado' || estadoEnvio === 'en_devolucion';

        const ev2 = _eventoParaPaso(ev, [1,2,3,4,5,6]);
        const ev3 = _eventoParaPaso(ev, esSucursal ? [7] : [8,9]);
        const ev4 = _eventoParaPaso(ev, [10]);
        const evAlert = _eventoParaPaso(ev, [11,12]);

        // Paso 1 — Orden confirmada
        const paso1Estado = (cancelado && !orden.pagado_at) ? 'pending' : 'done';
        const paso1 = {
            numero: 1,
            label: 'Orden confirmada',
            desc: `Pago recibido — orden #${String(orden.numero_orden || '').padStart(5,'0')} confirmada`,
            estado: paso1Estado,
            timestamp: _formatTimestampCronograma(orden.pagado_at),
        };

        // Paso 2 — Procesando
        let paso2Estado;
        if (cancelado) {
            paso2Estado = 'pending';
        } else if (['entregado','en_camino','disponible_retiro_sucursal','no_entregado','en_devolucion'].includes(estadoEnvio) || estado === 'entregado' || estado === 'enviado') {
            paso2Estado = 'done';
        } else if (estadoEnvio === 'en_preparacion' || estado === 'pagado' || estado === 'preparando') {
            paso2Estado = 'active';
        } else {
            paso2Estado = 'pending';
        }
        const paso2 = {
            numero: 2,
            label: 'Procesando',
            desc: esSucursal ? 'Preparando para despacho a sucursal' : 'Preparando tu pedido',
            estado: paso2Estado,
            timestamp: _formatTimestampCronograma(ev2?.fecha_evento),
        };

        // Paso 3 — En camino / Disponible en sucursal
        let paso3Estado, paso3Motivo;
        if (cancelado) {
            paso3Estado = 'pending';
        } else if (estadoEnvio === 'entregado' || estado === 'entregado') {
            paso3Estado = 'done';
        } else if (isAlert) {
            paso3Estado = 'alert';
            paso3Motivo = evAlert?.motivo || null;
        } else if (estadoEnvio === 'en_camino' || estadoEnvio === 'disponible_retiro_sucursal' || estado === 'enviado') {
            paso3Estado = 'active';
        } else {
            paso3Estado = 'pending';
        }
        // OCA envía el nombre de la sucursal en `descripcion` (no `nombre`).
        const sucursalNombre = (ev3 || evAlert)?.sucursal_info?.descripcion || '';
        let paso3Desc;
        if (isAlert && estadoEnvio === 'en_devolucion') {
            paso3Desc = 'El paquete está en devolución';
        } else if (esSucursal) {
            paso3Desc = sucursalNombre ? `Disponible en ${sucursalNombre}` : 'Disponible en sucursal OCA';
        } else {
            paso3Desc = (paso3Estado === 'done') ? 'El pedido se dirigió hacia tu domicilio' : 'El pedido se dirige hacia tu domicilio';
        }
        const paso3 = {
            numero: 3,
            label: esSucursal ? 'Disponible en sucursal' : 'En camino',
            desc: paso3Desc,
            estado: paso3Estado,
            timestamp: _formatTimestampCronograma((ev3 || evAlert)?.fecha_evento),
            motivo: paso3Motivo,
        };

        // Paso 4 — Entregado / Retirado
        const paso4Estado = (estadoEnvio === 'entregado' || estado === 'entregado') ? 'done' : 'pending';
        const paso4 = {
            numero: 4,
            label: esSucursal ? 'Retirado' : 'Entregado',
            desc: esSucursal ? 'Pedido retirado en sucursal' : (paso4Estado === 'done' ? 'El paquete fue entregado en tu domicilio' : 'El paquete será entregado en tu domicilio'),
            estado: paso4Estado,
            timestamp: _formatTimestampCronograma(ev4?.fecha_evento),
        };

        // Badge global
        let badge;
        if (cancelado)                                                  badge = { label: 'CANCELADO', variant: 'cancelado' };
        else if (estadoEnvio === 'no_entregado')                        badge = { label: 'NO ENTREGADO', variant: 'alerta' };
        else if (estadoEnvio === 'en_devolucion')                       badge = { label: 'EN DEVOLUCIÓN', variant: 'alerta' };
        else if (estadoEnvio === 'entregado' || estado === 'entregado') badge = { label: 'ENTREGADO', variant: 'entregado' };
        else if (estadoEnvio === 'disponible_retiro_sucursal')          badge = { label: 'EN SUCURSAL', variant: 'sucursal' };
        else if (estadoEnvio === 'en_camino' || estado === 'enviado')   badge = { label: 'EN TRÁNSITO', variant: 'transito' };
        else if (estadoEnvio === 'en_preparacion' || estado === 'preparando') badge = { label: 'PROCESANDO', variant: 'transito' };
        else                                                            badge = { label: 'CONFIRMADO', variant: 'transito' };

        // Progreso
        let progreso, alertFill = false;
        if (cancelado)               { progreso = 100; alertFill = true; }
        else if (isAlert)            { progreso = 75;  alertFill = true; }
        else if (paso4Estado === 'done')  progreso = 100;
        else if (paso3Estado === 'done')  progreso = 80;
        else if (paso3Estado === 'active') progreso = 65;
        else if (paso2Estado === 'done')  progreso = 50;
        else if (paso2Estado === 'active') progreso = 35;
        else                              progreso = 15;

        // Etiqueta de entrega estimada
        let estimadaLabel = null;
        if (paso4Estado === 'done' && ev4?.fecha_evento) {
            estimadaLabel = `ENTREGADO el ${_formatFechaCorta(ev4.fecha_evento)}`;
        } else if (orden.pagado_at) {
            const dir = orden.direcciones_envio;
            const tipoEnvio = esSucursal ? 'sucursal' : 'domicilio';
            const fechaEst = _calcularEntregaEstimada(orden.pagado_at, tipoEnvio, dir?.provincia || '');
            if (fechaEst) estimadaLabel = `ENTREGA ESTIMADA: ${_formatFechaCorta(fechaEst)}`;
        }

        return { pasos: [paso1, paso2, paso3, paso4], badge, progreso, alertFill, estimadaLabel };
    }

    function renderCronograma(orden) {
        const { pasos, badge, progreso, alertFill, estimadaLabel } = _buildCronograma(orden);
        const pillMap = {
            done:    ['HECHO',     'hecho'],
            active:  ['ACTIVO',    'activo'],
            pending: ['PENDIENTE', 'pendiente'],
            alert:   ['ALERTA',    'alerta'],
        };
        const stepsHTML = pasos.map(p => {
            let marker;
            if (p.estado === 'done') {
                marker = `<div class="cronograma-dot-done"><svg viewBox="0 0 12 12"><polyline points="2,6.5 5,9.5 10,3"/></svg></div>`;
            } else if (p.estado === 'active') {
                marker = `<div class="cronograma-dot-active"><div class="cronograma-dot-active-inner"></div></div>`;
            } else if (p.estado === 'alert') {
                marker = `<div class="cronograma-dot-alert">⚠</div>`;
            } else {
                marker = `<div class="cronograma-dot-pending"><span>${p.numero}</span></div>`;
            }
            const [pillLabel, pillCls] = pillMap[p.estado] || pillMap.pending;
            const timeHTML  = p.timestamp ? `<time class="cronograma-step-time">${p.timestamp}</time>` : '';
            const motivoHTML = p.motivo ? `<p class="cronograma-step-motivo">MOTIVO: ${p.motivo}</p>` : '';
            return `<li class="cronograma-step cronograma-step--${p.estado}">
                <div class="cronograma-step-marker">${marker}</div>
                <div class="cronograma-step-body">
                    <div class="cronograma-step-row">
                        <span class="cronograma-step-label">${p.label}</span>
                        <span class="cronograma-pill cronograma-pill--${pillCls}">${pillLabel}</span>
                        ${timeHTML}
                    </div>
                    <p class="cronograma-step-desc">${p.desc}</p>
                    ${motivoHTML}
                </div>
            </li>`;
        }).join('');

        const fillCls = alertFill ? ' cronograma-progress-fill--alert' : '';
        return `<div class="cronograma-card">
            <div class="cronograma-header">
                <h3 class="cronograma-title">CRONOGRAMA DE ENVIO</h3>
                <span class="cronograma-badge cronograma-badge--${badge.variant}">
                    <span class="cronograma-badge-dot"></span>${badge.label}
                </span>
            </div>
            <div class="cronograma-divider"></div>
            <ol class="cronograma-steps">${stepsHTML}</ol>
            <div class="cronograma-progress">
                <div class="cronograma-progress-track">
                    <div class="cronograma-progress-fill${fillCls}" style="width:${progreso}%"></div>
                </div>
                <div class="cronograma-progress-labels">
                    <span>${estimadaLabel || '—'}</span>
                    <span>${progreso} % COMPLETADO</span>
                </div>
            </div>
        </div>`;
    }

    function renderProgressBar(orden) {
        const { progreso, alertFill } = _buildCronograma(orden);
        const fillCls = alertFill ? ' cronograma-progress-fill--alert' : '';
        return `<div class="cronograma-progress-mini">
            <div class="cronograma-progress-track">
                <div class="cronograma-progress-fill${fillCls}" style="width:${progreso}%"></div>
            </div>
        </div>`;
    }

    function renderPedidoCard(orden) {
        const { label, cls } = _getOrdenBadge(orden.estado, orden.estado_envio);
        const fecha = _formatFechaOrden(orden.created_at);
        const total = _formatPrecio(orden.total_centavos);
        const numero = String(orden.numero_orden || '').padStart(5, '0');

        const items = (orden.items_orden || []).map(item => {
            const imgs = item.variantes_producto?.productos?.imagenes || [];
            const thumb = imgs[0]
                ? `<img class="cuenta-pedido-thumb" src="${imgs[0]}" alt="${item.nombre_producto}" loading="lazy">`
                : `<div class="cuenta-pedido-thumb cuenta-pedido-thumb--empty"></div>`;
            return `<div class="cuenta-pedido-item">${thumb}<div class="cuenta-pedido-item-info"><span class="cuenta-pedido-item-name">${item.nombre_producto}</span><span class="cuenta-pedido-item-detail">${item.color} · ${item.talle} · ×${item.cantidad}</span></div><span class="cuenta-pedido-item-price">${_formatPrecio(item.precio_unitario_centavos * item.cantidad)}</span></div>`;
        }).join('');

        const progressBar = renderProgressBar(orden);
        const cronogramaHTML = renderCronograma(orden);

        const dir = orden.direcciones_envio;
        const dirStr = dir
            ? `${dir.calle ? dir.calle + ' ' + dir.numero : dir.direccion}, ${dir.ciudad}, ${dir.provincia} ${dir.codigo_postal}`
            : '—';

        const nroEnvioRow = orden.nro_envio_oca
            ? `<div class="cuenta-pedido-detail-row"><span class="cuenta-pedido-detail-label">N° DE SEGUIMIENTO</span><span class="cuenta-pedido-detail-value">${orden.nro_envio_oca}</span></div>`
            : '';

        return `<div class="cuenta-order" id="pedido-${orden.id}">
            <div class="cuenta-order-header" onclick="window._togglePedidoDetail('${orden.id}')">
                <div class="cuenta-order-header-left">
                    <span class="cuenta-order-id">#${numero}</span>
                    <span class="cuenta-order-date">${fecha}</span>
                </div>
                <div class="cuenta-order-header-right">
                    <span class="cuenta-order-status ${cls}">${label}</span>
                    <span class="cuenta-pedido-chevron" id="chevron-${orden.id}">›</span>
                </div>
            </div>
            <div class="cuenta-pedido-items">${items}</div>
            <div class="cuenta-pedido-bottom">${progressBar}<div class="cuenta-pedido-total"><span class="cuenta-pedido-total-label">TOTAL</span><span class="cuenta-pedido-total-value">${total}</span></div></div>
            <div class="cuenta-pedido-detail" id="detail-${orden.id}" style="display:none;">
                ${cronogramaHTML}
                <div class="cronograma-detail-divider"></div>
                <div class="cuenta-pedido-detail-row"><span class="cuenta-pedido-detail-label">DIRECCIÓN DE ENVÍO</span><span class="cuenta-pedido-detail-value">${dirStr}</span></div>
                ${nroEnvioRow}
            </div>
        </div>`;
    }

    function _togglePedidoDetail(ordenId) {
        const detail = document.getElementById('detail-' + ordenId);
        const chevron = document.getElementById('chevron-' + ordenId);
        if (!detail) return;
        const isOpen = detail.style.display !== 'none';
        detail.style.display = isOpen ? 'none' : 'block';
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
    }
    window._togglePedidoDetail = _togglePedidoDetail;

    function startPedidosPolling() {
        if (_pedidosPollingTimer) return;
        _pedidosPollingTimer = setInterval(loadCuentaPedidos, 60000);
        document.addEventListener('visibilitychange', _handlePedidosVisibility);
    }

    function stopPedidosPolling() {
        if (_pedidosPollingTimer) { clearInterval(_pedidosPollingTimer); _pedidosPollingTimer = null; }
        document.removeEventListener('visibilitychange', _handlePedidosVisibility);
    }

    function _handlePedidosVisibility() {
        if (document.hidden) {
            if (_pedidosPollingTimer) { clearInterval(_pedidosPollingTimer); _pedidosPollingTimer = null; }
        } else {
            _pedidosPollingTimer = setInterval(loadCuentaPedidos, 60000);
        }
    }

    // --- DIRECCIONES ---

    async function loadCuentaDirecciones() {
        const token = await _getAccessToken();
        if (!token) return;
        try {
            const res = await fetch('/api/cliente/direcciones', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const { direcciones } = await res.json();
            _renderDirecciones(direcciones || []);
        } catch (err) {
            console.error('[Cuenta] Error cargando direcciones:', err);
        }
    }

    function _renderDirecciones(direcciones) {
        const listEl = document.getElementById('cuenta-direcciones-list');
        const emptyEl = document.getElementById('cuenta-direcciones-empty');
        if (!listEl) return;
        listEl.querySelectorAll('.cuenta-direccion-card').forEach(c => c.remove());
        if (direcciones.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';
        direcciones.forEach(dir => listEl.appendChild(_crearDireccionCardEl(dir)));
    }

    function _crearDireccionCardEl(dir) {
        const el = document.createElement('div');
        el.className = 'cuenta-direccion-card';
        el.id = 'dir-' + dir.id;
        const dirStr = dir.calle
            ? `${dir.calle} ${dir.numero}${dir.piso ? ', Piso ' + dir.piso : ''}${dir.depto ? ' Dpto ' + dir.depto : ''}`
            : dir.direccion;
        el.innerHTML = `
            <button class="cuenta-direccion-dot ${dir.es_predeterminada ? 'is-principal' : ''}" onclick="window._setPrincipalDireccion('${dir.id}')" title="${dir.es_predeterminada ? 'Dirección principal' : 'Marcar como principal'}"></button>
            <div class="cuenta-direccion-info">
                <span class="cuenta-direccion-calle">${dirStr.toUpperCase()}</span>
                <span class="cuenta-direccion-detail">${dir.ciudad.toUpperCase()}, ${dir.provincia.toUpperCase()} · CP ${dir.codigo_postal}</span>
                ${dir.es_predeterminada ? '<span class="cuenta-direccion-principal">Principal</span>' : ''}
            </div>
            <div class="cuenta-direccion-actions">
                <button class="cuenta-direccion-action" onclick="window._editarDireccion('${dir.id}')">EDITAR</button>
                <span class="cuenta-direccion-sep">·</span>
                <button class="cuenta-direccion-action" onclick="window._confirmarEliminarDireccion('${dir.id}')">ELIMINAR</button>
            </div>`;
        return el;
    }

    async function _setPrincipalDireccion(id) {
        const token = await _getAccessToken();
        if (!token) return;
        try {
            await fetch(`/api/cliente/direcciones/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ es_predeterminada: true })
            });
            loadCuentaDirecciones();
        } catch (err) { console.error('[Cuenta] Error seteando dirección principal:', err); }
    }
    window._setPrincipalDireccion = _setPrincipalDireccion;

    async function _editarDireccion(id) {
        const token = await _getAccessToken();
        if (!token) return;
        try {
            const res = await fetch('/api/cliente/direcciones', { headers: { 'Authorization': `Bearer ${token}` } });
            const { direcciones } = await res.json();
            const dir = (direcciones || []).find(d => d.id === id);
            if (!dir) return;
            document.getElementById('modal-direccion-title').textContent = 'EDITAR DIRECCIÓN';
            document.getElementById('edit-direccion-id').value = id;
            document.getElementById('edit-addr-calle').value = dir.calle || '';
            document.getElementById('edit-addr-numero').value = dir.numero || '';
            document.getElementById('edit-addr-piso').value = dir.piso || '';
            document.getElementById('edit-addr-depto').value = dir.depto || '';
            document.getElementById('edit-addr-ciudad').value = dir.ciudad || '';
            document.getElementById('edit-addr-provincia').value = dir.provincia || '';
            document.getElementById('edit-addr-cp').value = dir.codigo_postal || '';
            document.getElementById('edit-addr-principal').checked = !!dir.es_predeterminada;
            _openModal(document.getElementById('modal-direccion'));
        } catch (err) { console.error('[Cuenta] Error cargando dirección:', err); }
    }
    window._editarDireccion = _editarDireccion;

    function _confirmarEliminarDireccion(id) {
        document.getElementById('delete-direccion-id').value = id;
        _openModal(document.getElementById('modal-confirm-delete'));
    }
    window._confirmarEliminarDireccion = _confirmarEliminarDireccion;

    async function _ejecutarEliminarDireccion() {
        const id = document.getElementById('delete-direccion-id')?.value;
        if (!id) return;
        const token = await _getAccessToken();
        if (!token) return;
        const btnConfirm = document.getElementById('btn-confirm-delete');
        if (btnConfirm) { btnConfirm.disabled = true; btnConfirm.querySelector('span').textContent = 'ELIMINANDO...'; }
        try {
            await fetch(`/api/cliente/direcciones/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            _closeModal(document.getElementById('modal-confirm-delete'));
            loadCuentaDirecciones();
        } catch (err) { console.error('[Cuenta] Error eliminando dirección:', err); }
        finally { if (btnConfirm) { btnConfirm.disabled = false; btnConfirm.querySelector('span').textContent = 'ELIMINAR'; } }
    }

    // --- MODALES: SHARED HELPERS ---

    function _openModal(modal) {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'false');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
    }

    function _closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('is-open');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }, 280);
    }

    // --- MODAL: EDITAR DATOS ---

    function _openModalEditDatos() {
        const modal = document.getElementById('modal-edit-datos');
        if (!modal) return;
        const get = id => { const el = document.getElementById(id); return el && el.textContent.trim() !== '—' ? el.textContent.trim() : ''; };
        document.getElementById('edit-nombre').value = get('dash-nombre');
        document.getElementById('edit-apellido').value = get('dash-apellido');
        document.getElementById('edit-telefono').value = get('dash-telefono');
        _openModal(modal);
    }

    async function _submitEditDatos() {
        const token = await _getAccessToken();
        if (!token) return;
        const nombre = document.getElementById('edit-nombre')?.value?.trim();
        const apellido = document.getElementById('edit-apellido')?.value?.trim();
        const telefono = document.getElementById('edit-telefono')?.value?.trim();
        const btnSave = document.getElementById('btn-save-datos');
        if (btnSave) { btnSave.disabled = true; btnSave.querySelector('span').textContent = 'GUARDANDO...'; }
        try {
            const res = await fetch('/api/cliente/datos', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, telefono })
            });
            if (!res.ok) throw new Error('Error al guardar');
            const { cliente } = await res.json();
            if (document.getElementById('dash-nombre')) document.getElementById('dash-nombre').textContent = cliente.nombre || '—';
            if (document.getElementById('dash-apellido')) document.getElementById('dash-apellido').textContent = cliente.apellido || '—';
            if (document.getElementById('dash-telefono')) document.getElementById('dash-telefono').textContent = cliente.telefono || '—';
            const greet = document.getElementById('cuenta-greeting');
            if (greet && cliente.nombre) greet.textContent = `BIENVENIDO, ${cliente.nombre.toUpperCase()}.`;
            _closeModal(document.getElementById('modal-edit-datos'));
        } catch (err) { console.error('[Cuenta] Error guardando datos:', err); }
        finally { if (btnSave) { btnSave.disabled = false; btnSave.querySelector('span').textContent = 'GUARDAR'; } }
    }

    // --- MODAL: DIRECCIÓN ---

    function _openModalAddDireccion() {
        const modal = document.getElementById('modal-direccion');
        if (!modal) return;
        document.getElementById('modal-direccion-title').textContent = 'NUEVA DIRECCIÓN';
        document.getElementById('edit-direccion-id').value = '';
        ['calle','numero','piso','depto','ciudad','provincia','cp'].forEach(f => {
            const el = document.getElementById('edit-addr-' + f);
            if (el) el.value = '';
        });
        document.getElementById('edit-addr-principal').checked = false;
        _openModal(modal);
    }

    async function _submitDireccion() {
        const token = await _getAccessToken();
        if (!token) return;
        const id = document.getElementById('edit-direccion-id')?.value;
        const body = {
            calle: document.getElementById('edit-addr-calle')?.value?.trim(),
            numero: document.getElementById('edit-addr-numero')?.value?.trim(),
            piso: document.getElementById('edit-addr-piso')?.value?.trim() || null,
            depto: document.getElementById('edit-addr-depto')?.value?.trim() || null,
            ciudad: document.getElementById('edit-addr-ciudad')?.value?.trim(),
            provincia: document.getElementById('edit-addr-provincia')?.value?.trim(),
            codigo_postal: document.getElementById('edit-addr-cp')?.value?.trim(),
            es_predeterminada: document.getElementById('edit-addr-principal')?.checked || false,
        };
        if (!body.calle || !body.numero || !body.ciudad || !body.provincia || !body.codigo_postal) {
            alert('Completá calle, número, ciudad, provincia y código postal.');
            return;
        }
        const btnSave = document.getElementById('btn-save-direccion');
        if (btnSave) { btnSave.disabled = true; btnSave.querySelector('span').textContent = 'GUARDANDO...'; }
        try {
            const url = id ? `/api/cliente/direcciones/${id}` : '/api/cliente/direcciones';
            const method = id ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Error al guardar dirección');
            _closeModal(document.getElementById('modal-direccion'));
            loadCuentaDirecciones();
        } catch (err) { console.error('[Cuenta] Error guardando dirección:', err); }
        finally { if (btnSave) { btnSave.disabled = false; btnSave.querySelector('span').textContent = 'GUARDAR'; } }
    }

    // --- PREFERENCIAS ---

    async function _loadCuentaPreferencias() {
        if (!window.supabaseClient) return;
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user?.email) return;
            const { data: cliente } = await window.supabaseClient
                .from('clientes')
                .select('newsletter, telefono')
                .eq('email', user.email)
                .single();
            if (cliente) {
                const toggle = document.getElementById('pref-newsletter');
                if (toggle) toggle.checked = !!cliente.newsletter;
                const telEl = document.getElementById('dash-telefono');
                if (telEl && (!telEl.textContent || telEl.textContent === '—')) {
                    telEl.textContent = cliente.telefono || '—';
                }
            }
        } catch (err) { console.error('[Cuenta] Error cargando preferencias:', err); }
    }

    async function _toggleNewsletter(checked) {
        const token = await _getAccessToken();
        if (!token) return;
        try {
            await fetch('/api/cliente/datos', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ newsletter: checked })
            });
        } catch (err) {
            console.error('[Cuenta] Error actualizando newsletter:', err);
            const toggle = document.getElementById('pref-newsletter');
            if (toggle) toggle.checked = !checked;
        }
    }

    async function _triggerPasswordReset() {
        if (!window.supabaseClient) return;
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user?.email) return;
        try {
            await window.supabaseClient.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/cuenta'
            });
            const btn = document.getElementById('btn-change-password');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = '✓';
                setTimeout(() => { btn.textContent = orig; }, 3000);
            }
        } catch (err) { console.error('[Cuenta] Error enviando reset password:', err); }
    }

    // --- INICIALIZAR LISTENERS DE CUENTA (solo una vez) ---

    function _initCuentaListeners() {
        if (_cuentaListenersInitialized) return;
        _cuentaListenersInitialized = true;

        // Editar datos
        const btnEditDatos = document.getElementById('btn-edit-datos');
        if (btnEditDatos) btnEditDatos.addEventListener('click', _openModalEditDatos);
        const btnSaveDatos = document.getElementById('btn-save-datos');
        if (btnSaveDatos) btnSaveDatos.addEventListener('click', _submitEditDatos);
        const btnCancelDatos = document.getElementById('btn-cancel-edit-datos');
        if (btnCancelDatos) btnCancelDatos.addEventListener('click', () => _closeModal(document.getElementById('modal-edit-datos')));
        const overlayEditDatos = document.getElementById('modal-edit-datos-overlay');
        if (overlayEditDatos) overlayEditDatos.addEventListener('click', () => _closeModal(document.getElementById('modal-edit-datos')));
        const btnCloseDatos = document.getElementById('btn-close-edit-datos');
        if (btnCloseDatos) btnCloseDatos.addEventListener('click', () => _closeModal(document.getElementById('modal-edit-datos')));

        // Agregar dirección
        const btnAddDir = document.getElementById('btn-add-direccion');
        if (btnAddDir) btnAddDir.addEventListener('click', _openModalAddDireccion);
        const btnSaveDir = document.getElementById('btn-save-direccion');
        if (btnSaveDir) btnSaveDir.addEventListener('click', _submitDireccion);
        const btnCancelDir = document.getElementById('btn-cancel-direccion');
        if (btnCancelDir) btnCancelDir.addEventListener('click', () => _closeModal(document.getElementById('modal-direccion')));
        const overlayDir = document.getElementById('modal-direccion-overlay');
        if (overlayDir) overlayDir.addEventListener('click', () => _closeModal(document.getElementById('modal-direccion')));
        const btnCloseDir = document.getElementById('btn-close-direccion');
        if (btnCloseDir) btnCloseDir.addEventListener('click', () => _closeModal(document.getElementById('modal-direccion')));

        // Confirmar eliminar
        const btnConfirmDel = document.getElementById('btn-confirm-delete');
        if (btnConfirmDel) btnConfirmDel.addEventListener('click', _ejecutarEliminarDireccion);
        const btnCancelDel = document.getElementById('btn-cancel-delete');
        if (btnCancelDel) btnCancelDel.addEventListener('click', () => _closeModal(document.getElementById('modal-confirm-delete')));
        const overlayDel = document.getElementById('modal-confirm-delete-overlay');
        if (overlayDel) overlayDel.addEventListener('click', () => _closeModal(document.getElementById('modal-confirm-delete')));
        const btnCloseDel = document.getElementById('btn-close-confirm-delete');
        if (btnCloseDel) btnCloseDel.addEventListener('click', () => _closeModal(document.getElementById('modal-confirm-delete')));

        // Preferencias
        const newsletter = document.getElementById('pref-newsletter');
        if (newsletter) newsletter.addEventListener('change', (e) => _toggleNewsletter(e.target.checked));
        const btnChangePwd = document.getElementById('btn-change-password');
        if (btnChangePwd) btnChangePwd.addEventListener('click', _triggerPasswordReset);

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                ['modal-edit-datos','modal-direccion','modal-confirm-delete'].forEach(id => {
                    const m = document.getElementById(id);
                    if (m && m.classList.contains('is-open')) _closeModal(m);
                });
            }
        });
    }

    // =========================================================================

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
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
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
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_CHECKOUT, STATE_CONFIRMATION);
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

    // --- CONFIRMACIÓN DE PEDIDO ---
    function enableConfirmationState(ordenId, skipHistory = false) {
        if (!skipHistory) pushHistory({ state: 'confirmation', ordenId: ordenId });
        document.title = 'Pedido confirmado — GÜIDO CAPUZZI';

        const confirmContainer = document.getElementById('confirmation-container');
        if (!confirmContainer) return;

        const exitEl = getActiveSection();

        transitionState(exitEl, confirmContainer, 'flex', () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_CHECKOUT, STATE_LEGALES);
            body.classList.add(STATE_CONFIRMATION);

            [
                document.getElementById('home-container'),
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('checkout'),
                document.getElementById('legales-container')
            ].forEach(sec => {
                if (sec && sec !== exitEl) {
                    sec.style.display = 'none';
                    sec.style.opacity = '0';
                }
            });

            window.scrollTo(0, 0);

            // Populate confirmation data (async when cart is empty — redirect from NAVE)
            populateConfirmation(ordenId).then(runConfirmationAnimation);
        });
    }

    // Formatea el numero_orden igual que el panel /cuenta y los emails: #00061
    function _formatNumeroOrden(numero) {
        return `Orden #${String(numero ?? '').padStart(5, '0')}`;
    }

    async function populateConfirmation(ordenId) {
        // Número de orden = numero_orden (consistente con panel /cuenta y emails).
        // Fast path: sessionStorage (flujo carrito + redirect NAVE). La API lo confirma luego.
        const ordenEl = document.getElementById('confirmacion-orden');
        if (ordenEl) {
            const stored = sessionStorage.getItem('checkout_numero_orden');
            ordenEl.textContent = stored ? _formatNumeroOrden(stored) : 'Orden #—————';
        }

        if (cart.length > 0) {
            // ── Carrito en memoria (flujo normal sin redirección) ──
            _populateConfirmationFromCart();
        } else {
            // ── Carrito vacío: venimos de redirección NAVE, cargar desde API ──
            await _populateConfirmationFromAPI(ordenId);
        }

        // Volver al shop button
        const btnVolver = document.getElementById('confirmacion-btn-volver');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                cart.length = 0;
                renderCart();
                enableShopState(null, 'VER TODO');
            });
        }
    }

    function _populateConfirmationFromCart() {
        // Products
        const productosContainer = document.getElementById('confirmacion-productos');
        if (productosContainer) {
            productosContainer.innerHTML = '';
            cart.forEach(item => {
                const row = document.createElement('div');
                row.className = 'confirmacion-producto confirmacion-anim-row';

                const imgSrc = item.image || '';
                const imgHTML = imgSrc
                    ? `<img class="producto-confirm-thumb" src="${imgSrc}" alt="${item.name}">`
                    : `<div class="producto-confirm-thumb" style="display:flex;align-items:center;justify-content:center;font-family:'Helvetica Neue Condensed';font-size:0.55rem;letter-spacing:0.08em;text-transform:uppercase;color:rgba(32,32,32,0.25);">IMG</div>`;

                row.innerHTML = `
                    <div class="producto-confirm-info">
                        <div class="producto-confirm-thumb-wrapper">
                            ${imgHTML}
                            <span class="producto-confirm-qty-badge">${item.qty}</span>
                        </div>
                        <div>
                            <div class="producto-confirm-nombre">${item.name}</div>
                            <div class="producto-confirm-detalle">${item.color || ''} &middot; ${item.size || ''}</div>
                        </div>
                    </div>
                    <div class="producto-confirm-precio">$${(item.priceValue * item.qty).toLocaleString('es-AR')}</div>
                `;
                productosContainer.appendChild(row);
            });
        }

        // Shipping
        const envioEl = document.getElementById('confirmacion-envio-value');
        if (envioEl) {
            const checkoutEnvio = document.querySelector('.checkout-envio-selected');
            envioEl.textContent = checkoutEnvio ? checkoutEnvio.textContent : 'OCA';
        }

        // Address
        const dirEl = document.getElementById('confirmacion-direccion-value');
        if (dirEl) {
            const calle = document.getElementById('checkout-calle');
            const ciudad = document.getElementById('checkout-ciudad');
            dirEl.textContent = (calle ? calle.value : '') + (ciudad ? ', ' + ciudad.value : '');
        }

        // Contact
        const contactoEl = document.getElementById('confirmacion-contacto-value');
        if (contactoEl) {
            const emailEl = document.getElementById('checkout-email');
            contactoEl.textContent = emailEl ? emailEl.value : '';
        }

        // Payment
        const pagoEl = document.getElementById('confirmacion-pago-value');
        if (pagoEl) pagoEl.textContent = 'Tarjeta';

        // Total
        const totalEl = document.getElementById('confirmacion-total-value');
        if (totalEl) {
            const cartTotal = cart.reduce((sum, item) => sum + (item.priceValue * item.qty), 0);
            totalEl.textContent = `$${cartTotal.toLocaleString('es-AR')}`;
        }

        // Note
        const notaEl = document.getElementById('confirmacion-nota');
        if (notaEl) {
            const emailEl = document.getElementById('checkout-email');
            const email = emailEl ? emailEl.value : 'tu email';
            notaEl.textContent = `DETALLES ENVIADOS A ${email.toUpperCase()}`;
        }
    }

    async function _populateConfirmationFromAPI(ordenId) {
        if (!ordenId) return;

        try {
            // Polling: el webhook de NAVE puede tardar unos segundos en setear el payment_id real.
            // Reintentamos hasta 5 veces (cada 3s) si la orden sigue en pago_pendiente.
            var orden = null;
            var maxRetries = 5;
            for (var attempt = 0; attempt <= maxRetries; attempt++) {
                var res = await fetch(`/api/ordenes/${encodeURIComponent(ordenId)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                var jsonData = await res.json();
                orden = jsonData.orden;

                if (orden.estado !== 'pago_pendiente' || attempt === maxRetries) break;
                console.log('[confirmacion] Orden aún pago_pendiente, reintentando en 3s... (' + (attempt + 1) + '/' + maxRetries + ')');
                await new Promise(function(r) { setTimeout(r, 3000); });
            }

            if (orden.estado === 'pago_pendiente') {
                console.log('[confirmacion] Orden sigue en pago_pendiente tras ' + maxRetries + ' reintentos');
                // Mostrar mensaje de procesamiento en vez de datos vacíos
                var pendingNotaEl = document.getElementById('confirmacion-nota');
                if (pendingNotaEl) pendingNotaEl.textContent = 'TU PAGO ESTÁ SIENDO PROCESADO. RECIBIRÁS UN EMAIL DE CONFIRMACIÓN EN BREVE.';
            }

            // Número de orden autoritativo desde la API (numero_orden)
            const ordenNumEl = document.getElementById('confirmacion-orden');
            if (ordenNumEl && orden.numero_orden != null) {
                ordenNumEl.textContent = _formatNumeroOrden(orden.numero_orden);
            }

            // Products from items_orden
            const productosContainer = document.getElementById('confirmacion-productos');
            if (productosContainer && Array.isArray(orden.items_orden)) {
                productosContainer.innerHTML = '';
                orden.items_orden.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'confirmacion-producto confirmacion-anim-row';
                    const precioItem = Math.round(item.precio_unitario_centavos / 100);
                    const precioTotal = precioItem * item.cantidad;

                    // Intentar obtener imagen del producto vía join
                    const imagenes = item.variantes_producto?.productos?.imagenes;
                    const rawSrc = (Array.isArray(imagenes) && imagenes.length > 0) ? imagenes[0] : '';
                    const imgSrc = rawSrc ? (rawSrc.startsWith('/') ? rawSrc : '/' + rawSrc) : '';
                    const imgHTML = imgSrc
                        ? `<img class="producto-confirm-thumb" src="${imgSrc}" alt="${item.nombre_producto}">`
                        : `<div class="producto-confirm-thumb" style="display:flex;align-items:center;justify-content:center;font-family:'Helvetica Neue Condensed';font-size:0.55rem;letter-spacing:0.08em;text-transform:uppercase;color:rgba(32,32,32,0.25);">GÜIDO</div>`;

                    row.innerHTML = `
                        <div class="producto-confirm-info">
                            <div class="producto-confirm-thumb-wrapper">
                                ${imgHTML}
                                <span class="producto-confirm-qty-badge">${item.cantidad}</span>
                            </div>
                            <div>
                                <div class="producto-confirm-nombre">${item.nombre_producto}</div>
                                <div class="producto-confirm-detalle">${item.color || ''} &middot; ${item.talle || ''}</div>
                            </div>
                        </div>
                        <div class="producto-confirm-precio">$${precioTotal.toLocaleString('es-AR')}</div>
                    `;
                    productosContainer.appendChild(row);
                });

            }

            // Shipping — tipo + precio en la misma línea
            const envioEl = document.getElementById('confirmacion-envio-value');
            if (envioEl) {
                const tipoEnvio = orden.tipo_envio === 'sucursal' ? 'OCA — Sucursal' : 'OCA — Domicilio';
                const enviocentavos = orden.costo_envio_centavos || 0;
                if (enviocentavos > 0) {
                    const envioPesos = Math.round(enviocentavos / 100);
                    envioEl.textContent = `${tipoEnvio} — $${envioPesos.toLocaleString('es-AR')}`;
                } else {
                    envioEl.textContent = tipoEnvio;
                }
            }

            // Address
            const dirEl = document.getElementById('confirmacion-direccion-value');
            if (dirEl && orden.direcciones_envio) {
                const d = orden.direcciones_envio;
                dirEl.textContent = [d.calle + (d.numero ? ' ' + d.numero : ''), d.ciudad, d.provincia, d.codigo_postal].filter(Boolean).join(', ');
            }

            // Contact
            const contactoEl = document.getElementById('confirmacion-contacto-value');
            if (contactoEl && orden.clientes) {
                contactoEl.textContent = orden.clientes.email || '';
            }

            // Payment
            const pagoEl = document.getElementById('confirmacion-pago-value');
            if (pagoEl) pagoEl.textContent = 'Tarjeta';

            // Total
            const totalEl = document.getElementById('confirmacion-total-value');
            if (totalEl && orden.total_centavos) {
                const total = Math.round(orden.total_centavos / 100);
                totalEl.textContent = `$${total.toLocaleString('es-AR')}`;
            }

            // Note
            const notaEl = document.getElementById('confirmacion-nota');
            if (notaEl) {
                const email = orden.clientes?.email || 'tu email';
                notaEl.textContent = `DETALLES ENVIADOS A ${email.toUpperCase()}`;
            }

            // Meta Pixel — Purchase (dedup con localStorage para evitar doble-fire en reload)
            const pixelKey = `pixel_purchase_${ordenId}`;
            if (window.fbq && !localStorage.getItem(pixelKey)) {
                const pixelItems = Array.isArray(orden.items_orden) ? orden.items_orden : [];
                window.fbq('track', 'Purchase', {
                    value: (orden.total_centavos || 0) / 100,
                    currency: 'ARS',
                    content_ids: pixelItems.map(function(i) { return i.variante_id || i.nombre_producto || ''; }),
                    content_type: 'product',
                    num_items: pixelItems.reduce(function(sum, i) { return sum + (i.cantidad || 0); }, 0),
                });
                localStorage.setItem(pixelKey, '1');
            }

        } catch (err) {
            console.error('[Confirmación] Error al cargar datos de la orden:', err);
        }
    }

    function runConfirmationAnimation() {
        const container = document.getElementById('confirmacion-inner');
        const line = document.getElementById('confirmacion-line');
        const ordenEl = document.getElementById('confirmacion-orden');
        const rows = document.querySelectorAll('.confirmacion-anim-row');

        if (!container) return;

        // T=0: Container fades in
        setTimeout(() => { container.classList.add('visible'); }, 200);

        // T=500: Line expands
        setTimeout(() => { if (line) line.classList.add('expand'); }, 500);

        // T=900: Order number
        setTimeout(() => { if (ordenEl) ordenEl.classList.add('visible'); }, 900);

        // T=1080+: Staggered rows
        rows.forEach((el, i) => {
            setTimeout(() => { el.classList.add('visible'); }, 1080 + (i * 160));
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

        // Meta Pixel — InitiateCheckout
        if (window.fbq) {
            const cartValue = cart.reduce((sum, item) => sum + (item.priceValue * item.qty), 0);
            window.fbq('track', 'InitiateCheckout', {
                num_items: cart.reduce((sum, item) => sum + item.qty, 0),
                value: cartValue,
                currency: 'ARS'
            });
        }

        // Update State Classes
        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES, STATE_CONFIRMATION);
        body.classList.add(STATE_CHECKOUT);

        // Hide ALL other containers
        const sectionsToHide = [
            document.getElementById('shop'),
            document.getElementById('product-page'),
            document.getElementById('home-container'),
            accountLoginSection,
            accountCreateSection,
            accountContactSection,
            document.getElementById('account-dashboard')
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

        // On mobile: move accordion from sidebar to slot inside main (after breadcrumb)
        // matchMedia matches exactly what CSS sees (reliable in DevTools simulation too)
        if (window.matchMedia('(max-width: 768px)').matches) {
            const slot = document.getElementById('checkout-summary-slot');
            const summaryToggle = document.getElementById('checkout-summary-toggle');
            const summaryContent = document.getElementById('checkout-summary-content');
            if (slot && summaryToggle && summaryContent && !slot.contains(summaryToggle)) {
                slot.appendChild(summaryToggle);
                slot.appendChild(summaryContent);
            }
        }

        // Populate checkout sidebar with cart items
        renderCheckoutCart();

        // Si el cliente de Supabase no se pudo crear (el script de la librería no
        // cargó), avisarlo acá y no dejar que el usuario complete todo el formulario
        // para recién chocarse contra el error al apretar CONTINUAR.
        if (window.avisarCheckoutSinConexion) window.avisarCheckoutSinConexion();

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
        // Sync mobile accordion total preview
        const summaryTotalPreview = document.getElementById('checkout-summary-total-preview');
        if (summaryTotalPreview) summaryTotalPreview.textContent = formattedSubtotal;
    }

    function initFooterYearRange() {
        const currentYear = new Date().getFullYear();
        const yearText = currentYear >= 2027 ? `2026\u20132${currentYear}` : '2026';
        document.querySelectorAll('.footer-year-range').forEach(el => {
            el.textContent = yearText;
        });
    }

    // Footer 2026: newsletter desplegable (desktop) + acordeones (mobile).
    // Idempotente vía data-sf-init — los footers se re-inyectan al navegar.
    function initFooterInteractions() {
        document.querySelectorAll('.sf-newsletter:not([data-sf-init])').forEach(nl => {
            nl.dataset.sfInit = 'true';
            const open = () => nl.classList.add('is-open');
            const close = () => nl.classList.remove('is-open');

            nl.querySelector('.sf-nl-title')?.addEventListener('click', () => {
                nl.classList.contains('is-open') ? close() : open();
            });
            nl.querySelector('.sf-nl-toggle')?.addEventListener('click', close);

            nl.querySelector('.sf-nl-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const msg = nl.querySelector('.sf-nl-msg');
                const email = nl.querySelector('input[name="email"]');
                const consent = nl.querySelector('input[name="consent"]');
                if (!email?.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
                    if (msg) msg.textContent = 'INGRESÁ UN EMAIL VÁLIDO.';
                    return;
                }
                if (!consent?.checked) {
                    if (msg) msg.textContent = 'TENÉS QUE ACEPTAR LA POLÍTICA DE PRIVACIDAD.';
                    return;
                }
                // TODO: conectar al proveedor de email cuando esté definido.
                if (msg) msg.textContent = 'LISTO. TE VAMOS A ESCRIBIR.';
            });
        });

        // Acordeones mobile: el <button> del título abre/cierra su columna.
        document.querySelectorAll('.sf-nav-title:not([data-sf-init])').forEach(btn => {
            btn.dataset.sfInit = 'true';
            btn.addEventListener('click', () => {
                btn.closest('.sf-nav-col')?.classList.toggle('is-open');
            });
        });

        // CUENTA del footer reusa el trigger del header (que es un id único).
        document.querySelectorAll('.sf-account-link:not([data-sf-init])').forEach(link => {
            link.dataset.sfInit = 'true';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('account-trigger')?.click();
            });
        });
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
                parent.appendChild(clone);
            }
        };

        if (accountLoginSection) appendAndReset(accountLoginSection);
        if (accountCreateSection) appendAndReset(accountCreateSection);
        if (accountContactSection) appendAndReset(accountContactSection);

        // Re-initialize logo reveal + year range + accordion para footers clonados
        setTimeout(() => {
            initFooterLogoReveal();
            initFooterInteractions();
            initFooterYearRange();
            initFooterAccordion();
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

    // --- ARCHIVO: wiring ---
    const archivoTrigger = document.getElementById('archivo-trigger');
    if (archivoTrigger) archivoTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (avCollectionOpen) closeCollection(/* skipHistory */ true);
        showArchiveLanding(false);
    });
    const mobileArchivoLink = document.querySelector('.mobile-archivo-link');
    if (mobileArchivoLink) mobileArchivoLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        if (avCollectionOpen) closeCollection(/* skipHistory */ true);
        showArchiveLanding(false);
    });
    // Botón MENU + CERRAR del drawer.
    const avMenuBtn = document.getElementById('av-menu-btn');
    if (avMenuBtn) avMenuBtn.addEventListener('click', () => openArchiveMenu());
    document.addEventListener('click', (e) => {
        if (e.target.closest('.av-menu-close')) closeArchiveMenu();
    });
    // Ítems del menú (delegado: CONTENIDO / SHOP / SOBRE).
    document.addEventListener('click', (e) => {
        const item = e.target.closest('[data-av-nav]');
        if (!item) return;
        e.preventDefault();
        archiveMenuNavigate(item.getAttribute('data-av-nav'));
    });
    // Accesos rápidos de la barra de la colección (LOOKS / DETALLES / FILM).
    document.addEventListener('click', (e) => {
        const goto = e.target.closest('[data-av-goto]');
        if (!goto) return;
        e.preventDefault();
        collectionScrollTo(goto.getAttribute('data-av-goto'));
    });
    // El wordmark de la colección vuelve a la landing.
    const avColBrand = document.getElementById('av-col-brand');
    if (avColBrand) avColBrand.addEventListener('click', (e) => {
        e.preventDefault();
        closeCollection(false);
    });
    // Escape: primero cierra el menú; si no hay menú, sale de la colección.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (avMenuOpen) { closeArchiveMenu(); return; }
        if (avCollectionOpen) closeCollection(false);
    });

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

    // Botones del home → Shop por categoría (CAMPAÑA "VER TODO", SELVEDGE "COMPRAR AHORA")
    document.querySelectorAll('[data-shop-cat]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const category = el.getAttribute('data-shop-cat');
            header.classList.remove('menu-open');
            enableShopState(null, category);
            setShopCategory(category);
        });
    });

    // Botones pendientes (ARCHIVO / VER LOOKBOOK → futura página de fotos de campaña,
    // aún no creada). No-op temporal para que no salten al top.
    document.querySelectorAll('[data-pending]').forEach(el => {
        el.addEventListener('click', (e) => e.preventDefault());
    });

    // Mobile Menu (hamburger → categories only)
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);

    // Mobile menu: category links (direct, no sub-view)
    mobileCatLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.dataset.cat;
            closeMobileMenu();
            enableShopState(null, category);
            setShopCategory(category);
        });
    });

    // Mobile header icons (search, account, cart)
    if (mobileSearchIcon) {
        mobileSearchIcon.addEventListener('click', () => {
            openSearch();
        });
    }
    if (mobileAccountIcon) {
        mobileAccountIcon.addEventListener('click', (e) => {
            enableAccountState(e);
        });
    }
    if (mobileCartIcon) {
        mobileCartIcon.addEventListener('click', () => {
            openCart();
        });
    }

    // Checkout Summary Accordion (mobile only)
    const summaryToggle = document.getElementById('checkout-summary-toggle');
    const summaryContent = document.getElementById('checkout-summary-content');
    if (summaryToggle && summaryContent) {
        summaryToggle.addEventListener('click', () => {
            const isOpen = summaryContent.classList.toggle('open');
            const chevron = summaryToggle.querySelector('.checkout-summary-chevron');
            if (chevron) chevron.classList.toggle('open', isOpen);
        });
    }

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

                let step1Success = false;
                try {
                    const resultado = await window.procesarCheckoutStep1(cart);

                    if (resultado.success) {
                        console.log('[Checkout] ✅ Orden pendiente creada:', resultado.numeroOrden, '| ID:', resultado.ordenId);
                        // Guardar el UUID de la orden para usarlo en Step 3 (NAVE)
                        // NAVE external_payment_id acepta máx 36 chars — un UUID tiene exactamente 36
                        window._currentCheckoutOrdenId = resultado.ordenId;
                        window._currentCheckoutNumeroOrden = resultado.numeroOrden;
                        step1Success = true;
                        if (window.setBotonCargando) setBotonCargando(false);
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
                    if (!step1Success && window.setBotonCargando) setBotonCargando(false);
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

                console.log('[Checkout] ✅ Envío seleccionado:', selectedEnvio.value, '→ persistiendo en Supabase');

                // Activar estado de carga en el botón
                const _btnContinuar = document.getElementById('checkout-continue-btn');
                if (_btnContinuar) {
                    _btnContinuar.dataset.originalText = _btnContinuar.textContent;
                    _btnContinuar.textContent = 'REDIRIGIENDO...';
                    _btnContinuar.disabled = true;
                    _btnContinuar.style.opacity = '0.6';
                    _btnContinuar.style.cursor = 'wait';
                }

                const ordenId = window._currentCheckoutOrdenId;

                // ── PATCH /api/ordenes/{id} — Persistir envío en Supabase ──
                if (ordenId) {
                    try {
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
                            if (_btnContinuar) {
                                _btnContinuar.textContent = _btnContinuar.dataset.originalText || 'CONTINUAR AL PAGO';
                                _btnContinuar.disabled = false;
                                _btnContinuar.style.opacity = '1';
                                _btnContinuar.style.cursor = 'pointer';
                            }
                            return;
                        }

                        console.log('[Checkout] ✅ Envío persistido en Supabase → redirigiendo a NAVE');
                    } catch (patchErr) {
                        console.error('[Checkout] Error de red PATCH ordenes:', patchErr);
                        alert('Error de conexión. Intentá nuevamente.');
                        if (_btnContinuar) {
                            _btnContinuar.textContent = _btnContinuar.dataset.originalText || 'CONTINUAR AL PAGO';
                            _btnContinuar.disabled = false;
                            _btnContinuar.style.opacity = '1';
                            _btnContinuar.style.cursor = 'pointer';
                        }
                        return;
                    }
                }

                // ── Redirigir a NAVE (sin mostrar Step 3) ──
                if (typeof window.redirigirPagoNave === 'function') {
                    try {
                        await window.redirigirPagoNave({
                            ordenId: ordenId || `orden-${Date.now()}`,
                            totalARS: totalARS,
                            cartItems: cart
                        });
                    } catch (naveErr) {
                        alert('No se pudo inicializar el proceso de pago. Intentá nuevamente.');
                        if (_btnContinuar) {
                            _btnContinuar.textContent = _btnContinuar.dataset.originalText || 'CONTINUAR AL PAGO';
                            _btnContinuar.disabled = false;
                            _btnContinuar.style.opacity = '1';
                            _btnContinuar.style.cursor = 'pointer';
                        }
                    }
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
        const ubicacionStr = ubicacionParts.join(', ') || '—';
        if (resumenEmail) resumenEmail.textContent = email;
        if (resumenUbicacion) resumenUbicacion.textContent = ubicacionStr;

        // 1b. Sync mobile accordion contact block + show it
        const resumenMobileEmail = document.getElementById('resumen-mobile-email');
        const resumenMobileUbi = document.getElementById('resumen-mobile-ubicacion');
        const contactBlock = document.getElementById('checkout-summary-contact-block');
        if (resumenMobileEmail) resumenMobileEmail.textContent = email;
        if (resumenMobileUbi) resumenMobileUbi.textContent = ubicacionStr;
        if (contactBlock) contactBlock.style.display = 'block';

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
        const subtotalPesos = cart.reduce((acc, item) => acc + (item.priceValue * item.qty), 0);

        // Show loading state in shipping section
        const headerEl = metodoEnvioSection.querySelector('.checkout-section-header');
        const existingOptions = metodoEnvioSection.querySelectorAll('.envio-opcion');
        existingOptions.forEach(el => el.style.opacity = '0.4');

        // Create a loading indicator if not present
        let loadingEl = metodoEnvioSection.querySelector('.envio-loading');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'envio-loading';
            loadingEl.style.cssText = 'text-align:center;padding:20px 0;font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#888;';
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
                                <div class="envio-loading" style="text-align:center;padding:10px 0;font-family:Helvetica,sans-serif;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#888;">
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

        container.innerHTML = '<div class="envio-loading" style="text-align:center;padding:10px 0;font-family:Helvetica,sans-serif;font-size:0.7rem;letter-spacing:0.08em;text-transform:uppercase;color:#888;">Cargando sucursales...</div>';

        try {
            const res = await fetch(`/api/oca/sucursales?cp=${encodeURIComponent(cp)}`);
            const data = await res.json();

            if (!data.success || !data.sucursales || data.sucursales.length === 0) {
                container.innerHTML = '<p style="font-family:Helvetica,sans-serif;font-size:0.75rem;color:#888;padding:10px 0;">No se encontraron sucursales para tu código postal.</p>';
                return;
            }

            // Limitar a 5 sucursales (las más cercanas al CP)
            const sucursales = data.sucursales.slice(0, 5);

            container.innerHTML = sucursales.map((suc, i) => `
                <div class="envio-sucursal-item${i === 0 ? ' active' : ''}">
                    <input type="radio" name="sucursal" id="sucursal-${suc.id}" value="${suc.id}"
                        ${i === 0 ? 'checked' : ''}
                        data-nombre="${suc.nombre}" data-direccion="${suc.calle} ${suc.nro}, ${suc.localidad}">
                    <label for="sucursal-${suc.id}">${suc.nombre}, ${suc.calle} ${suc.nro}, ${suc.localidad}</label>
                </div>
            `).join('');

            console.log('[OCA] ✅ Sucursales cargadas:', sucursales.length, 'de', data.sucursales.length, 'disponibles');

        } catch (err) {
            console.error('[OCA] Error cargando sucursales:', err);
            container.innerHTML = '<p style="font-family:Helvetica,sans-serif;font-size:0.75rem;color:#888;padding:10px 0;">Error al cargar sucursales.</p>';
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

        // 2b. Hide mobile accordion contact block (Step 2+ exclusive)
        const contactBlock = document.getElementById('checkout-summary-contact-block');
        if (contactBlock) contactBlock.style.display = 'none';

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

        const formatted = '$' + formatearPrecioARS(total);
        totalEl.textContent = formatted;
        // Sync mobile accordion total preview
        const summaryPreview = document.getElementById('checkout-summary-total-preview');
        if (summaryPreview) summaryPreview.textContent = formatted;
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

            if (!supabaseListoParaAuth(document.querySelector('#account-contact .login-container'))) return;

            await runLoadBar(btnContactSubmit, 'ENVIANDO...');

            try {
                const { error } = await window.supabaseClient
                    .from('consultas')
                    .insert([{ nombre, email, mensaje }]);

                if (error) throw new Error(error.message);

                console.log('[Contact] ✅ Consulta enviada con éxito');

                const fields = document.querySelector('#account-contact .login-fields');
                const successHtml = `<span style="font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;line-height:1.5;">Tu consulta fue enviada. Nos comunicamos a la brevedad.</span>`;

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

    // --- HELPER FUNC: Guard de disponibilidad del cliente Supabase ---
    // Sin cliente de Supabase (la librería no cargó) ninguna acción de cuenta puede
    // funcionar. Antes cada handler llegaba igual hasta la llamada, se comía el
    // TypeError en su catch y mostraba "ERROR DE CONEXIÓN" recién después de correr
    // toda la barra de carga: mensaje engañoso, porque no es que falló la red del
    // usuario contra Supabase, es que la librería nunca llegó (y recargar puede
    // resolverlo). Este guard corta antes y lo dice.
    const MSG_SIN_LIBRERIA_SUPABASE = 'NO PUDIMOS CARGAR EL SISTEMA. RECARGÁ LA PÁGINA O DESACTIVÁ EL BLOQUEADOR DE ANUNCIOS.';

    /**
     * @param {Element|null} container - .login-container donde mostrar el error
     * @returns {boolean} true si se puede operar contra Supabase
     */
    function supabaseListoParaAuth(container) {
        if (window.supabaseClient) return true;
        console.error('[Auth] Cliente de Supabase no disponible — acción cancelada');
        if (container) showFormError(container, MSG_SIN_LIBRERIA_SUPABASE);
        return false;
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

            if (!supabaseListoParaAuth(container)) return;

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
                    const nombre = data.user?.user_metadata?.nombre || '';
                    const nombreUpper = nombre ? nombre.toUpperCase() : '';
                    const saludoText = nombreUpper ? `¡BIENVENIDO/A, ${nombreUpper}!` : '¡BIENVENIDO/A!';
                    console.log(`[Login] ✅ Bienvenido, ${nombre || data.user.email}`);

                    const fields = document.querySelector('#account-login .login-fields');
                    const successHtml = `<span style="font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;line-height:1.5;">SESIÓN INICIADA CORRECTAMENTE.</span>`;

                    await animateButtonAndForm(btnLoginSubmit, fields, 'ENTRAR', saludoText, successHtml);

                    // Navegar al dashboard sin recargar la página
                    setTimeout(() => { _showAccountDashboard(data.user); }, 600);
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

            if (!supabaseListoParaAuth(container)) return;

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
                    const successHtml = `<span style="font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;line-height:1.6;">TE ENVIAMOS UN EMAIL PARA VERIFICAR TU CUENTA.<br>REVISÁ TU BANDEJA Y HACÉ CLICK EN EL LINK DE CONFIRMACIÓN.</span>`;

                    await animateButtonAndForm(btnFinalCreate, fields, 'CREAR UNA CUENTA', 'MAIL ENVIADO', successHtml);

                    // Después de un momento, volver al login para que el usuario sepa el siguiente paso
                    setTimeout(() => { switchToLogin(); }, 4000);
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

            if (!supabaseListoParaAuth(container)) return;

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
                    const successHtml = `<span style="font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;line-height:1.5;">TE ENVIAMOS UN EMAIL CON LAS INSTRUCCIONES.</span>`;

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
                    // Cuenta verificada — enableAccountState detecta la sesión y muestra el dashboard
                    window.history.replaceState(null, '', window.location.pathname);
                    enableAccountState(null);
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

        body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
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

            if (!supabaseListoParaAuth(container)) return;

            await runLoadBar(btnNewPwdSubmit, 'GUARDANDO...');

            try {
                const { error } = await window.supabaseClient.auth.updateUser({ password: pwd });

                if (error) throw new Error(error.message);

                const fields = document.querySelector('#account-new-password .login-fields');
                const successHtml = `<span style="font-family:Helvetica,sans-serif;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;line-height:1.5;">¡CONTRASEÑA ACTUALIZADA! YA PODÉS INICIAR SESIÓN.</span>`;
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
    // COOKIE CONSENT
    // Muestra banner al primer ingreso. Guarda preferencia en localStorage.
    // Al aceptar → hook para activar analytics/Meta Pixel (futuro).
    // Al rechazar → solo cookies esenciales.
    // =========================================================================
    (function initCookieConsent() {
        const banner = document.getElementById('cookie-consent');
        if (!banner) return;

        const stored = localStorage.getItem('guido_cookie_consent');
        if (stored) {
            banner.classList.add('cookie-hidden');
            // Si ya aceptó, activar tracking
            if (stored === 'accepted') activateTracking();
            return;
        }

        const acceptBtn = document.getElementById('cookie-accept');
        const declineBtn = document.getElementById('cookie-decline');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                banner.classList.add('cookie-accepted');
                localStorage.setItem('guido_cookie_consent', 'accepted');
                activateTracking();
                setTimeout(() => banner.remove(), 500);
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                banner.classList.add('cookie-accepted');
                localStorage.setItem('guido_cookie_consent', 'declined');
                setTimeout(() => banner.remove(), 500);
            });
        }

        function activateTracking() {
            // Meta Pixel — Consent Mode v2
            // El pixel ya está inicializado en layout.tsx con consent revocado.
            // Al aceptar cookies: grant consent + disparar primer PageView.
            if (window.fbq) {
                window.fbq('consent', 'grant');
                window.fbq('track', 'PageView');
            }
            console.log('[Cookies] Tracking activado');
        }
    })();

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

        const BASE_TEXT = 'HASTA 6 CUOTAS SIN INTERÉS • ENVÍOS A TODO EL PAÍS • DENIM ÚNICO SIN RE-STOCK • PRENDAS ÚNICAS 1/1 • HECHO EN ARGENTINA • ';

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

    // Footer logo clip-path reveal + copyright year
    initFooterLogoReveal();
    initFooterInteractions();
    initFooterYearRange();

    // Footer accordion (mobile only)
    function initFooterAccordion(root) {
        const container = root || document;
        container.querySelectorAll('.footer-nav-title').forEach(title => {
            if (title.dataset.accordionInit) return;
            title.dataset.accordionInit = 'true';
            title.addEventListener('click', () => {
                if (window.innerWidth > 768) return;
                const column = title.closest('.footer-nav-column');
                column.classList.toggle('open');
            });
        });
    }
    initFooterAccordion();

    // =========================================================================
    // HOME — material por plataforma (hero, video de Selvedge, gráficas)
    // -------------------------------------------------------------------------
    // El shoot vino en dos relaciones de aspecto, así que desktop y mobile usan
    // piezas distintas. El breakpoint es el mismo 768px que usa el CSS.
    //
    // Se re-evalúa cada vez que se cruza el breakpoint (rotar el teléfono,
    // redimensionar la ventana). La primera versión leía matchMedia UNA sola vez
    // al cargar, así que si el ancho cambiaba después quedaba montado el material
    // de la otra plataforma.
    // =========================================================================
    const MQ_MOBILE = window.matchMedia("(max-width: 768px)");

    const HERO_GRAFICA = {
        desktop: "assets/images/graficas/grafica-3.webp",
        mobile: "assets/images/graficas/grafica-4.webp"
    };
    const SELVEDGE_VIDEO = {
        desktop: { mp4: "assets/video/selvedge-loop.mp4", poster: "assets/video/selvedge-loop.jpg" },
        mobile: { mp4: "assets/video/selvedge-loop-mobile.mp4", poster: "assets/video/selvedge-loop-mobile.jpg" }
    };
    const GRAFICAS_POR_PLATAFORMA = {
        desktop: [
            { src: "assets/images/graficas/grafica-8.webp", alt: "GÜIDO CAPUZZI — campaña, piso a cuadros" },
            { src: "assets/images/graficas/grafica-15.webp", alt: "GÜIDO CAPUZZI — campaña, sillón rojo" }
        ],
        mobile: [
            { src: "assets/images/graficas/grafica-1.webp", alt: "GÜIDO CAPUZZI — campaña" },
            { src: "assets/images/graficas/grafica-5.webp", alt: "GÜIDO CAPUZZI — campaña" }
        ]
    };
    const GRAFICAS_INTERVALO = 5000;

    // Fondo del hero. El <picture> del HTML ya elige bien en la carga inicial; esto
    // corrige el caso de cruzar el breakpoint después. Se fuerza el `media` del
    // <source> a all / not all en vez de confiar en que el navegador vuelva a
    // evaluar la media query solo, que al redimensionar no siempre pasa.
    function aplicarHero(esMobile) {
        const img = document.querySelector(".campaign-media");
        if (!img) return;
        const source = img.parentElement && img.parentElement.querySelector("source");
        if (source) {
            source.srcset = absUrl(HERO_GRAFICA.mobile);
            source.media = esMobile ? "all" : "not all";
        }
        const src = absUrl(esMobile ? HERO_GRAFICA.mobile : HERO_GRAFICA.desktop);
        if (img.getAttribute("src") !== src) img.src = src;
    }

    // El <video> de Selvedge viene sin src en el HTML a propósito: con los dos
    // <source> el navegador se bajaría también el que no corresponde.
    function aplicarSelvedgeVideo(esMobile) {
        const v = document.getElementById("selvedge-video");
        if (!v) return;
        const cfg = esMobile ? SELVEDGE_VIDEO.mobile : SELVEDGE_VIDEO.desktop;
        const mp4 = absUrl(cfg.mp4);
        if (v.getAttribute("src") === mp4) return;
        v.poster = absUrl(cfg.poster);
        v.src = mp4;
        v.load();
        // autoplay no siempre dispara si el src se asigna después del parseo.
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(function () { /* queda el poster */ });
    }

    // Monta el bloque de gráficas y devuelve la función que lo desarma, para poder
    // reconstruirlo cuando cambia la plataforma sin dejar timers ni listeners vivos.
    function montarGraficas(lista) {
        const stage = document.getElementById("graficas-stage");
        if (!stage || lista.length < 2) return null;

        stage.innerHTML = "";
        stage.classList.remove("is-medido");
        stage.style.height = "";

        const slides = lista.map(function (g, i) {
            const img = document.createElement("img");
            img.className = "grafica-slide" + (i === 0 ? " is-active" : "");
            img.src = absUrl(g.src);
            img.alt = g.alt || "";
            // Sólo la primera es prioritaria: el resto entra a medida que rota.
            img.loading = i === 0 ? "eager" : "lazy";
            img.decoding = "async";
            stage.appendChild(img);
            return img;
        });

        let actual = 0;
        let timer = null;

        // El stage toma la relación de aspecto de la gráfica activa, así ocupa el
        // ancho completo sin recorte ni franjas. Se mide con naturalWidth/Height,
        // que sirve para cualquier gráfica futura sin hardcodear nada.
        function ajustarAltoStage() {
            const img = slides[actual];
            if (!img.naturalWidth || !img.naturalHeight) return;
            stage.classList.add("is-medido");
            stage.style.height = (stage.clientWidth * img.naturalHeight / img.naturalWidth) + "px";
        }

        function avanzar() {
            slides[actual].classList.remove("is-active");
            actual = (actual + 1) % slides.length;
            slides[actual].classList.add("is-active");
            ajustarAltoStage();
        }
        function arrancar() { if (timer === null) timer = setInterval(avanzar, GRAFICAS_INTERVALO); }
        function frenar() { if (timer !== null) { clearInterval(timer); timer = null; } }

        // Sólo rota mientras el bloque se ve Y la pestaña está al frente.
        // enPantalla se guarda aparte porque el IntersectionObserver no vuelve a
        // disparar al recuperar el foco: sin esa bandera, ocultar la pestaña con el
        // bloque a la vista dejaba el timer frenado para siempre.
        let enPantalla = false;
        function sincronizar() {
            if (enPantalla && !document.hidden) { arrancar(); } else { frenar(); }
        }
        let observer = null;
        if (typeof IntersectionObserver === "function") {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) { enPantalla = e.isIntersecting; });
                sincronizar();
            }, { threshold: 0.15 });
            observer.observe(stage);
        } else {
            enPantalla = true;
            sincronizar();
        }
        document.addEventListener("visibilitychange", sincronizar);

        // Primera medición: si la portada ya está en cache, mide ya; si no, al load.
        if (slides[0].complete) { ajustarAltoStage(); }
        else { slides[0].addEventListener("load", ajustarAltoStage, { once: true }); }
        window.addEventListener("resize", ajustarAltoStage);

        return function desmontar() {
            frenar();
            if (observer) observer.disconnect();
            document.removeEventListener("visibilitychange", sincronizar);
            window.removeEventListener("resize", ajustarAltoStage);
        };
    }

    let plataformaMontada = null;
    let desmontarGraficas = null;

    // Sólo hace trabajo cuando realmente se cruza el breakpoint; si no, sale.
    // Eso permite colgarla del  sin costo.
    function aplicarPlataforma() {
        const esMobile = MQ_MOBILE.matches;
        if (plataformaMontada === esMobile) return;
        plataformaMontada = esMobile;

        aplicarHero(esMobile);
        aplicarSelvedgeVideo(esMobile);
        if (desmontarGraficas) desmontarGraficas();
        desmontarGraficas = montarGraficas(
            esMobile ? GRAFICAS_POR_PLATAFORMA.mobile : GRAFICAS_POR_PLATAFORMA.desktop
        );
    }
    aplicarPlataforma();

    // Dos disparadores a propósito. El evento change de matchMedia es el correcto,
    // pero no llega en todos los entornos (el preview headless cambia el viewport
    // sin emitirlo, y algunos navegadores viejos tampoco lo mandan al rotar). El
    // evento resize sí llega siempre; la guarda de arriba hace que no cueste nada.
    if (typeof MQ_MOBILE.addEventListener === "function") {
        MQ_MOBILE.addEventListener("change", aplicarPlataforma);
    } else if (typeof MQ_MOBILE.addListener === "function") {
        MQ_MOBILE.addListener(aplicarPlataforma);   // Safari viejo
    }
    window.addEventListener("resize", aplicarPlataforma);
    window.addEventListener("orientationchange", aplicarPlataforma);
    // =========================================================================
    // MARQUEE — sincroniza body.header-active cuando el header se activa (negro)
    // =========================================================================
    if (header) {
        const headerClassObserver = new MutationObserver(() => {
            const isActive = header.classList.contains('header-hover') ||
                header.classList.contains('menu-open');
            body.classList.toggle('header-active', isActive);
            // Home y Archivo (fondo oscuro): al activar el header, invertir a esquema
            // claro (header/dropdown #FAFAFA, tipografía #1A1A1A, marquee #1A1A1A).
            const archivoEl = document.getElementById('archivo-container');
            const isDarkPage = body.classList.contains(STATE_HOME) ||
                (archivoEl && archivoEl.style.display && archivoEl.style.display !== 'none');
            body.classList.toggle('header-invert', isActive && isDarkPage);
        });
        headerClassObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
    }

    console.log("GÜIDO CAPUZZI system fully re-initialized.");

    // =========================================================================
    // HISTORY API — popstate listener + deep link restore
    // =========================================================================

    // Restore state from a history state object (called by popstate)
    // =========================================================================
    // --- ARCHIVO ---
    // Tres pantallas, sin header (toda la navegación es el botón MENU):
    //   1. Landing (/archivo): el fashion film arranca cubriendo el viewport y
    //      decrece radialmente hacia el centro, revelando el grid disperso de
    //      fotos del shoot (blurreadas; el blur se va en hover) y el wordmark.
    //   2. Menú: drawer que sube, con los ítems revelándose enmascarados.
    //   3. Colección (/archivo/colecciones/<slug>): hero full-viewport, panel
    //      blanco con barra sticky LOOKS/DETALLES/FILM y grid de 3 columnas.
    // No usa una body-class de estado propia para el ruteo: getActiveSection lo
    // detecta por visibilidad del contenedor (así no hay que tocar remove-lists).
    // =========================================================================
    const ARCHIVE = (typeof window !== 'undefined' && Array.isArray(window.ARCHIVE_DATA))
        ? window.ARCHIVE_DATA : [];
    const ARCHIVE_LANDING = (typeof window !== 'undefined' && window.ARCHIVE_LANDING)
        ? window.ARCHIVE_LANDING : { film: {}, grid: [] };

    function findArchiveCollection(slug) {
        return ARCHIVE.find(c => c.slug === slug) || null;
    }

    // Tile placeholder on-brand (fondo #1A1A1A, marco rojo, número) mientras no
    // haya fotos reales. Se reemplaza poniendo `src` en archive-data.js.
    function archivePlaceholderSrc(n, w, h) {
        const W = w || 800, H = h || 1000;
        const num = String(n).padStart(2, '0');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
            + `<rect width="100%" height="100%" fill="#1A1A1A"/>`
            + `<rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="#AD1C1C" stroke-width="3"/>`
            + `<text x="50%" y="50%" fill="#FAFAFA" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(Math.min(W, H) * 0.2)}" font-weight="bold" text-anchor="middle" dominant-baseline="central" opacity="0.8">${num}</text>`
            + `</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // Los paths de archive-data.js se normalizan a absolutos: en /archivo/colecciones/ss26
    // un 'assets/...' relativo resolvería contra /archivo/colecciones/ y daría 404.
    function archiveImgSrc(img, i, w, h) {
        if (img && img.src) return absUrl(img.src);
        return archivePlaceholderSrc(i + 1, w, h);
    }

    // Prende/apaga el chrome propio del Archivo: sin header, con botón MENU.
    // Lo llama transitionState en cada cambio de sección.
    function setArchivoChrome(on) {
        body.classList.toggle('archivo-active', !!on);
        const btn = document.getElementById('av-menu-btn');
        if (btn) btn.style.display = on ? 'block' : 'none';
        if (!on) { closeArchiveMenu(/* immediate */ true); avDesiredTitle = null; }
    }

    // En un deep-link, Next aplica la metadata del layout DESPUÉS de hidratar y
    // pisa el título que seteamos al restaurar la ruta. Lo reponemos una vez.
    let avDesiredTitle = null;
    function avSetTitle(t) {
        avDesiredTitle = t;
        document.title = t;
        setTimeout(() => { if (avDesiredTitle === t) document.title = t; }, 600);
    }

    // ── Landing ──────────────────────────────────────────────────────────────
    let archiveLandingRendered = false;

    function renderArchiveLanding() {
        if (archiveLandingRendered) return;
        const host = document.getElementById('av-grid');
        const video = document.getElementById('av-film-video');
        if (!host) return;

        const grid = Array.isArray(ARCHIVE_LANDING.grid) ? ARCHIVE_LANDING.grid : [];
        host.innerHTML = grid.map((g, i) => {
            const src = archiveImgSrc(g, i, 800, 1200);
            // El stagger arranca cuando el film ya empezó a achicarse.
            const delay = (0.55 + i * 0.1).toFixed(2);
            return `<div class="av-grid-item" style="left:${g.x}%;top:${g.y}%;width:${g.w}%;height:${g.h}%;transition-delay:0s,${delay}s,${delay}s">`
                + `<img src="${src}" alt="${g.alt || ''}" loading="eager" decoding="async" draggable="false">`
                + `</div>`;
        }).join('');

        const film = ARCHIVE_LANDING.film || {};
        if (video && film.src) {
            if (film.poster) video.setAttribute('poster', absUrl(film.poster));
            video.src = absUrl(film.src);
        }

        // Parallax: sólo con mouse fino y sin reduced-motion. El listener va en el
        // contenedor, que sólo recibe eventos mientras el Archivo está visible.
        const container = document.getElementById('archivo-container');
        const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches
            && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (container && conMouse) {
            container.addEventListener('mousemove', avOnPointerMove, { passive: true });
        }
        archiveLandingRendered = true;
    }

    // El decrecimiento radial: el film arranca escalado lo suficiente para cubrir
    // el viewport, se queda así unos segundos, y recién ahí vuelve a 1 (su caja de
    // 40.51vw). El factor se calcula sobre offsetWidth/Height, que son las medidas
    // SIN transform aplicado.
    const AV_HOLD_MS = 2500; // cuánto se queda en pantalla completa antes de decrecer
    let avIntroTimer = null;

    function playLandingIntro() {
        const landing = document.getElementById('av-landing');
        const film = document.getElementById('av-film');
        const video = document.getElementById('av-film-video');
        if (!landing || !film) return;

        if (avIntroTimer) { clearTimeout(avIntroTimer); avIntroTimer = null; }
        landing.classList.remove('is-revealed');

        const w = film.offsetWidth, h = film.offsetHeight;
        if (w > 0 && h > 0) {
            const cover = Math.max(window.innerWidth / w, window.innerHeight / h);
            film.style.transition = 'none';
            film.style.setProperty('--av-film-scale', String(cover));
            void film.offsetWidth; // flush: fija el estado inicial sin animarlo
            film.style.transition = '';
        }
        if (video) {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay bloqueado: queda el poster */ });
        }

        avIntroTimer = setTimeout(() => {
            avIntroTimer = null;
            // Soltamos el valor inline en vez de escribir '1': el CSS lo devuelve a 1
            // con su transición Y deja de pisar al :hover, que también escribe la
            // variable (un inline style le gana a cualquier regla).
            film.style.removeProperty('--av-film-scale');
            landing.classList.add('is-revealed');
        }, AV_HOLD_MS);
    }

    // Parallax del mouse sobre las imágenes. Medido en la referencia: los contenedores
    // se desplazan ~2.4% de lo que se corre el cursor respecto del centro, y el
    // wordmark no se mueve (por eso la capa .av-parallax lo deja afuera).
    const AV_PARALLAX = 0.024;
    let avPx = 0, avPy = 0, avPxTarget = 0, avPyTarget = 0, avParallaxRaf = null;

    function avParallaxTick() {
        const layer = document.getElementById('av-parallax');
        if (!layer) { avParallaxRaf = null; return; }
        avPx += (avPxTarget - avPx) * 0.08;
        avPy += (avPyTarget - avPy) * 0.08;
        layer.style.setProperty('--av-px', avPx.toFixed(2) + 'px');
        layer.style.setProperty('--av-py', avPy.toFixed(2) + 'px');
        if (Math.abs(avPxTarget - avPx) < 0.1 && Math.abs(avPyTarget - avPy) < 0.1) {
            avParallaxRaf = null;
            return;
        }
        avParallaxRaf = requestAnimationFrame(avParallaxTick);
    }

    function avOnPointerMove(e) {
        avPxTarget = (e.clientX - window.innerWidth / 2) * AV_PARALLAX;
        avPyTarget = (e.clientY - window.innerHeight / 2) * AV_PARALLAX;
        if (!avParallaxRaf) avParallaxRaf = requestAnimationFrame(avParallaxTick);
    }

    function showArchiveLanding(skipHistory) {
        avSetTitle('Archivo — GÜIDO CAPUZZI');
        const container = document.getElementById('archivo-container');
        if (!container) return;
        renderArchiveLanding();
        const active = container.style.display && container.style.display !== 'none';

        const enter = () => {
            body.classList.remove(STATE_HOME, STATE_SHOP, STATE_PDP, STATE_ACCOUNT, STATE_CONTACT, STATE_LEGALES, STATE_CHECKOUT, STATE_CONFIRMATION);
            [
                document.getElementById('home-container'),
                document.getElementById('shop'),
                document.getElementById('product-page'),
                document.getElementById('checkout'),
                document.getElementById('legales-container'),
                document.getElementById('confirmation-container'),
                accountLoginSection, accountCreateSection, accountContactSection,
                accountRecoverSection, accountNewPasswordSection
            ].forEach(sec => {
                if (sec && sec !== container) { sec.style.display = 'none'; sec.style.opacity = '0'; }
            });
            window.scrollTo(0, 0);
            // Después de que termine la transición de entrada de la sección (420ms).
            setTimeout(playLandingIntro, 440);
        };

        if (!active) {
            transitionState(getActiveSection(), container, 'block', enter);
        } else {
            setArchivoChrome(true);
            playLandingIntro();
        }
        if (!skipHistory) pushHistory({ state: 'archive', archiveSlug: null });
    }

    // ── Menú (drawer) ────────────────────────────────────────────────────────
    let avMenuOpen = false;

    function openArchiveMenu() {
        const menu = document.getElementById('av-menu');
        if (!menu || avMenuOpen) return;
        menu.style.display = 'block';
        menu.setAttribute('aria-hidden', 'false');
        void menu.offsetWidth; // fuerza reflow para que la transición arranque
        menu.classList.add('is-open');
        avMenuOpen = true;
    }

    function closeArchiveMenu(immediate) {
        const menu = document.getElementById('av-menu');
        if (!menu || !avMenuOpen) return;
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        avMenuOpen = false;
        if (immediate) {
            menu.style.display = 'none';
        } else {
            setTimeout(() => { if (!avMenuOpen) menu.style.display = 'none'; }, 880);
        }
    }

    function archiveMenuNavigate(target) {
        closeArchiveMenu();
        // Si el menú se abrió desde la colección, hay que bajar ese overlay antes de
        // navegar: es un fixed con z-index 8000 y taparía la sección de destino.
        // skipHistory=true porque el destino empuja su propia entrada de historial.
        if ((target === 'home' || target === 'shop') && avCollectionOpen) {
            closeCollection(/* skipHistory */ true);
        }
        if (target === 'home') {
            // El wordmark del menú vuelve al home. Sale del Archivo, así que
            // transitionState apaga solo el chrome propio (header y marquee vuelven).
            enableHomeState(null, /* skipHistory */ false);
            return;
        }
        if (target === 'shop') {
            enableShopState(null, 'VER TODO', /* skipHistory */ false);
            return;
        }
        if (target === 'sobre') {
            // La página SOBRE (historia de GÜIDO) todavía no existe — pendiente.
            console.info('[archivo] SOBRE: página pendiente de crear');
            return;
        }
        if (target === 'contenido') {
            const first = ARCHIVE[0];
            if (first) openCollection(first.slug, /* skipHistory */ false);
        }
    }

    // ── Colección ────────────────────────────────────────────────────────────
    let avCollectionOpen = false;
    let avCollectionSlug = null;

    function renderCollection(col) {
        const heroMedia = document.getElementById('av-col-hero-media');
        const heroTitle = document.getElementById('av-col-hero-title');
        const barTitle = document.getElementById('av-col-bar-title');
        const looks = document.getElementById('av-looks');
        const detalles = document.getElementById('av-detalles');
        const filmHost = document.getElementById('av-col-film');

        if (heroTitle) heroTitle.textContent = col.titulo || '';
        if (barTitle) barTitle.textContent = col.titulo || '';

        if (heroMedia) {
            const hero = col.hero || {};
            if (hero.src) {
                heroMedia.innerHTML = `<video src="${absUrl(hero.src)}"${hero.poster ? ` poster="${absUrl(hero.poster)}"` : ''} muted loop playsinline autoplay></video>`;
            } else if (hero.poster) {
                heroMedia.innerHTML = `<img src="${absUrl(hero.poster)}" alt="${hero.alt || ''}" decoding="async">`;
            } else {
                heroMedia.innerHTML = '';
            }
        }

        const tiles = (arr, w, h) => (arr || []).map((img, i) => {
            const src = archiveImgSrc(img, i, w, h);
            const loading = i < 3 ? 'eager' : 'lazy';
            return `<figure><img src="${src}" alt="${(img && img.alt) || ''}" width="${(img && img.w) || w}" height="${(img && img.h) || h}" loading="${loading}" decoding="async" draggable="false"></figure>`;
        }).join('');

        if (looks) looks.innerHTML = tiles(col.looks, 1200, 1500);
        if (detalles) detalles.innerHTML = tiles(col.detalles, 1500, 1200);

        if (filmHost) {
            const film = col.film || {};
            filmHost.innerHTML = film.src
                ? `<video src="${absUrl(film.src)}"${film.poster ? ` poster="${absUrl(film.poster)}"` : ''} muted loop playsinline preload="none" controls></video>`
                : '';
        }
    }

    function openCollection(slug, skipHistory) {
        const col = findArchiveCollection(slug);
        const el = document.getElementById('av-collection');
        if (!col || !el) { showArchiveLanding(false); return; }

        renderCollection(col);
        avSetTitle(`${col.titulo} — Archivo — GÜIDO CAPUZZI`);

        el.style.display = 'block';
        el.setAttribute('aria-hidden', 'false');
        body.classList.add('av-collection-open');
        el.scrollTop = 0;
        avCollectionOpen = true;
        avCollectionSlug = slug;

        // El botón MENU sigue disponible dentro de la colección.
        const btn = document.getElementById('av-menu-btn');
        if (btn) btn.style.display = 'block';

        bindCollectionScroll(el);
        if (!skipHistory) pushHistory({ state: 'archive', archiveSlug: slug });
    }

    function closeCollection(skipHistory) {
        const el = document.getElementById('av-collection');
        if (!el) return;
        const wasOpen = avCollectionOpen;
        unbindCollectionScroll(el);
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        body.classList.remove('av-collection-open');
        avCollectionOpen = false;
        avCollectionSlug = null;
        avSetTitle('Archivo — GÜIDO CAPUZZI');
        if (!skipHistory && wasOpen) history.back();
    }

    // ── Scroll suavizado de la colección ─────────────────────────────────────
    // Réplica del ritmo de la referencia (Locomotive Scroll con lerp 0.05 y
    // multiplier 0.5: poco recorrido por click de rueda y una cola larguísima).
    // Diferencia deliberada: allá se transforma el contenido y se rompe el scroll
    // nativo (adiós Ctrl+F, position:sticky, teclado y mobile — su propia página
    // cae a nativo en celular). Acá el lerp maneja el scrollTop del contenedor,
    // así el ritmo es el mismo pero no se rompe nada.
    const AV_EASE = 0.05;   // factor de interpolación por frame
    const AV_MULT = 0.5;    // multiplier del sitio de referencia
    const AV_MOUSE_MULT = (navigator.platform || '').indexOf('Win') > -1 ? 1 : 0.4;
    const AV_STOP_EPS = 0.5;

    let avTarget = 0, avCurrent = 0, avRaf = null, avStartTs = 0, avSelfScroll = false;

    function avSmoothEnabled() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        // En touch la inercia nativa ya es buena y el jacking la arruina.
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    function avOnWheel(e) {
        const el = document.getElementById('av-collection');
        if (!el) return;
        e.preventDefault();
        let d = e.wheelDeltaY || -1 * e.deltaY;
        if (e.deltaMode === 1) d *= 16; // deltaMode en líneas (Firefox)
        d *= AV_MOUSE_MULT;
        avTarget -= d * AV_MULT;
        avClampTarget(el);
        avStartLoop();
    }

    function avClampTarget(el) {
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        if (avTarget < 0) avTarget = 0;
        if (avTarget > max) avTarget = max;
    }

    function avStartLoop() {
        if (avRaf) return;
        avStartTs = Date.now();
        avRaf = requestAnimationFrame(avTick);
    }

    function avTick() {
        const el = document.getElementById('av-collection');
        if (!el || !avCollectionOpen) { avRaf = null; return; }
        avCurrent = (1 - AV_EASE) * avCurrent + AV_EASE * avTarget;
        avSelfScroll = true;
        el.scrollTop = avCurrent;
        avSelfScroll = false;
        if (Math.abs(avTarget - avCurrent) < AV_STOP_EPS && Date.now() - avStartTs > 100) {
            avCurrent = Math.round(avTarget);
            avSelfScroll = true;
            el.scrollTop = avCurrent;
            avSelfScroll = false;
            avRaf = null;
            return;
        }
        avRaf = requestAnimationFrame(avTick);
    }

    // Si el scroll lo movió otra cosa (teclado, barra, Ctrl+F, touch), resincronizar
    // para que el próximo movimiento de rueda arranque de donde está de verdad.
    function avOnScroll() {
        if (avSelfScroll || avRaf) return;
        const el = document.getElementById('av-collection');
        if (!el) return;
        avCurrent = avTarget = el.scrollTop;
    }

    function collectionScrollTo(key) {
        const el = document.getElementById('av-collection');
        if (!el) return;
        const map = { looks: 'av-looks', detalles: 'av-detalles', film: 'av-col-film' };
        const section = document.getElementById(map[key]);
        const bar = document.getElementById('av-col-bar');
        if (!section) return;
        const barH = bar ? bar.offsetHeight : 0;
        const dest = section.offsetTop - barH;
        if (!avSmoothEnabled()) {
            el.scrollTo({ top: dest, behavior: 'smooth' });
            return;
        }
        avCurrent = el.scrollTop;
        avTarget = dest;
        avClampTarget(el);
        avStartLoop();
    }

    function bindCollectionScroll(el) {
        avCurrent = avTarget = 0;
        el.addEventListener('scroll', avOnScroll, { passive: true });
        if (avSmoothEnabled()) el.addEventListener('wheel', avOnWheel, { passive: false });
    }

    function unbindCollectionScroll(el) {
        el.removeEventListener('scroll', avOnScroll);
        el.removeEventListener('wheel', avOnWheel);
        if (avRaf) { cancelAnimationFrame(avRaf); avRaf = null; }
    }

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
            case 'confirmation':
                enableConfirmationState(stateObj.ordenId || '', /* skipHistory */ true);
                break;
            case 'archive':
                if (stateObj.archiveSlug) {
                    showArchiveLanding(/* skipHistory */ true);
                    openCollection(stateObj.archiveSlug, /* skipHistory */ true);
                } else {
                    closeCollection(/* skipHistory */ true);
                    showArchiveLanding(/* skipHistory */ true);
                }
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
                // Restricción temporal (opción B): PDP bloqueada → mandamos al Shop.
                if (isRestricted(products[idx])) {
                    enableShopState(null, 'VER TODO', /* skipHistory */ true);
                    history.replaceState({ state: 'shop', category: 'VER TODO' }, '', '/shop');
                    return;
                }
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
        if (path === '/archivo' || path.startsWith('/archivo/')) {
            // /archivo/colecciones/<slug>, con soporte del formato viejo ?archive=<slug>
            const m = path.match(/^\/archivo\/colecciones\/([^/]+)\/?$/);
            const archiveSlug = (m && decodeURIComponent(m[1])) || params.get('archive');
            showArchiveLanding(/* skipHistory */ true);
            // La landing queda como entrada base para que CERRAR/back siempre vuelva a ella.
            history.replaceState({ state: 'archive', archiveSlug: null }, '', URL_ARCHIVE);
            if (archiveSlug && findArchiveCollection(archiveSlug)) {
                openCollection(archiveSlug, /* skipHistory */ false);
            }
            return;
        }
        if (path.startsWith('/checkout/confirmacion')) {
            // Limpiar clase de pre-routing (usada para evitar flash de home)
            document.documentElement.classList.remove('route-confirmation');
            const ordenId = params.get('orden') || '';
            enableConfirmationState(ordenId, /* skipHistory */ true);
            history.replaceState({ state: 'confirmation', ordenId: ordenId }, '', window.location.href);
            return;
        }

        // Default: home — register initial state
        history.replaceState({ state: 'home' }, '', URL_HOME);
    }

    restoreFromURL();
});
