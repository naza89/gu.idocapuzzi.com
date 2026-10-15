/* =============================================================================
   VISOR DE ZOOM — PDP (2026-10-12)
   -----------------------------------------------------------------------------
   Pantalla completa sobre las fotos de producto. Antes no había zoom en ningún
   lado, y el argumento de venta del selvedge es la textura del tejido.

   Mouse:  click = zoom 2,5× donde clickeaste; con zoom, la foto sigue al mouse;
           la rueda ajusta el zoom; ← → cambian de foto; Esc cierra.
   Touch:  pellizcar = zoom (hasta 4×); doble toque = zoom 2,5× en ese punto;
           con zoom, un dedo arrastra; sin zoom, deslizar cambia de foto y
           deslizar hacia abajo cierra.

   Alta resolución: cada foto puede traer una versión `zoom` (3000px, ver
   scripts/procesar-fotos.mjs --solo-zoom). Se baja recién la primera vez que
   alguien hace zoom sobre esa foto; mientras tanto se ve la del catálogo.

   API:  GuidoZoom.open(fotos, indice)      — fotos: [src] o [{src, zoom}]
         GuidoZoom.bind(contenedor, selector) — un click en cualquier `selector`
                                              dentro del contenedor abre el visor
                                              con todas las de ese contenedor.
   No depende de start.js. Los estilos van en globals.css (bloque VISOR DE ZOOM).
   ============================================================================= */
(function () {
    'use strict';

    const ZOOM_TOQUE = 2.5;
    const ZOOM_MAX = 4;
    const UMBRAL_SWIPE = 0.18;   // fracción del ancho para pasar de foto
    const UMBRAL_CIERRE = 110;   // px hacia abajo para cerrar

    let root, stage, track, countEl, barsEl, prevBtn, nextBtn, closeBtn;
    let srcs = [], idx = 0, abierto = false, focoPrevio = null;
    let s = 1, tx = 0, ty = 0;           // transform de la foto activa
    const punteros = new Map();
    let gesto = null;                    // estado del gesto touch en curso
    let ultimoToque = { t: 0, x: 0, y: 0 };
    const conMouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function construir() {
        if (root) return;
        root = document.createElement('div');
        root.className = 'gz';
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', 'Fotos del producto');
        root.innerHTML = `
            <div class="gz-top">
                <span class="gz-count"></span>
                <button type="button" class="gz-close">CERRAR</button>
            </div>
            <div class="gz-stage"><div class="gz-track"></div></div>
            <div class="gz-bars" aria-hidden="true"></div>
            <button type="button" class="gz-nav gz-nav--prev" aria-label="Foto anterior"><svg viewBox="0 0 12 22" fill="none" aria-hidden="true"><path d="M10 1 2 11l8 10" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg></button>
            <button type="button" class="gz-nav gz-nav--next" aria-label="Foto siguiente"><svg viewBox="0 0 12 22" fill="none" aria-hidden="true"><path d="M2 1l8 10-8 10" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg></button>`;
        document.body.appendChild(root);
        stage = root.querySelector('.gz-stage');
        track = root.querySelector('.gz-track');
        countEl = root.querySelector('.gz-count');
        barsEl = root.querySelector('.gz-bars');
        prevBtn = root.querySelector('.gz-nav--prev');
        nextBtn = root.querySelector('.gz-nav--next');
        closeBtn = root.querySelector('.gz-close');

        closeBtn.addEventListener('click', cerrar);
        prevBtn.addEventListener('click', () => ir(idx - 1));
        nextBtn.addEventListener('click', () => ir(idx + 1));
        stage.addEventListener('pointerdown', onDown);
        stage.addEventListener('pointermove', onMove);
        stage.addEventListener('pointerup', onUp);
        stage.addEventListener('pointercancel', onUp);
        stage.addEventListener('mousemove', seguirMouse);
        stage.addEventListener('wheel', onWheel, { passive: false });
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', () => { if (abierto) { aplicarTrack(false); limitar(); aplicar(false); } });
    }

    // ── Geometría ────────────────────────────────────────────────────────────
    function imgActiva() { return track.children[idx] && track.children[idx].querySelector('img'); }

    // Tamaño de la foto tal como se ve a escala 1 (object-fit: contain).
    function tamañoBase() {
        const img = imgActiva();
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!img || !img.naturalWidth) return { w: W, h: H, W, H };
        const r = Math.min(W / img.naturalWidth, H / img.naturalHeight);
        return { w: img.naturalWidth * r, h: img.naturalHeight * r, W, H };
    }

    function limites(escala) {
        const b = tamañoBase();
        return { x: Math.max(0, (b.w * escala - b.W) / 2), y: Math.max(0, (b.h * escala - b.H) / 2) };
    }

    function limitar() {
        const l = limites(s);
        tx = Math.max(-l.x, Math.min(l.x, tx));
        ty = Math.max(-l.y, Math.min(l.y, ty));
    }

    // Zoom a `nueva` manteniendo fijo el punto (px, py) de la pantalla.
    function zoomEn(nueva, px, py) {
        const r = stage.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const qx = (px - cx - tx) / s, qy = (py - cy - ty) / s;
        s = nueva;
        tx = px - cx - s * qx;
        ty = py - cy - s * qy;
        limitar();
    }

    function aplicar(animar) {
        const img = imgActiva();
        if (!img) return;
        img.classList.toggle('gz-anim', !!animar);
        img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
        root.classList.toggle('is-zoomed', s > 1.01);
        if (s > 1.01) cargarHD(img);
    }

    // Misma foto, misma proporción: cambiar el src no mueve nada en pantalla.
    function cargarHD(img) {
        const hd = img.dataset.zoom;
        if (!hd) return;
        delete img.dataset.zoom;
        const pre = new Image();
        pre.onload = () => { img.src = hd; };
        pre.src = hd;
    }

    function aplicarTrack(animar, extraX = 0) {
        track.classList.toggle('gz-anim', !!animar);
        track.style.transform = `translate3d(calc(${-idx * 100}% + ${extraX}px), 0, 0)`;
    }

    function resetZoom(animar) { s = 1; tx = 0; ty = 0; aplicar(animar); }

    // ── Navegación ───────────────────────────────────────────────────────────
    function ir(n) {
        const destino = Math.max(0, Math.min(srcs.length - 1, n));
        if (destino !== idx) resetZoom(false);
        idx = destino;
        aplicarTrack(true);
        actualizarUI();
    }

    function actualizarUI() {
        countEl.textContent = `${idx + 1}/${srcs.length}`;
        [...barsEl.children].forEach((b, i) => b.classList.toggle('is-on', i <= idx));
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx === srcs.length - 1;
        const unica = srcs.length < 2;
        barsEl.hidden = unica; prevBtn.hidden = unica; nextBtn.hidden = unica;
    }

    function open(lista, inicio) {
        construir();
        srcs = (lista || []).filter(Boolean).map(f => (typeof f === 'string' ? { src: f, zoom: null } : f));
        if (!srcs.length) return;
        idx = Math.max(0, Math.min(srcs.length - 1, inicio || 0));
        track.replaceChildren(...srcs.map(src => {
            const slide = document.createElement('div');
            slide.className = 'gz-slide';
            const img = document.createElement('img');
            img.src = src.src; img.alt = ''; img.draggable = false;
            if (src.zoom) img.dataset.zoom = src.zoom;
            slide.appendChild(img);
            return slide;
        }));
        barsEl.innerHTML = srcs.map(() => '<span></span>').join('');
        track.querySelectorAll('img').forEach(img => img.addEventListener('load', () => { if (img === imgActiva()) { limitar(); aplicar(false); } }));
        s = 1; tx = 0; ty = 0;
        aplicarTrack(false);
        actualizarUI();
        aplicar(false);
        focoPrevio = document.activeElement;
        root.style.removeProperty('--gz-drag');
        root.classList.add('is-open');
        document.documentElement.classList.add('gz-lock');
        abierto = true;
        closeBtn.focus({ preventScroll: true });
    }

    function cerrar() {
        if (!abierto) return;
        abierto = false;
        root.classList.remove('is-open', 'is-zoomed');
        document.documentElement.classList.remove('gz-lock');
        punteros.clear(); gesto = null;
        if (focoPrevio && focoPrevio.focus) focoPrevio.focus({ preventScroll: true });
    }

    // ── Mouse ────────────────────────────────────────────────────────────────
    // Con zoom, la foto sigue al mouse: borde izquierdo del visor = borde
    // izquierdo de la foto. Es el patrón de las tiendas de lujo y no pide arrastrar.
    function seguirMouse(e) {
        if (!conMouse() || s <= 1.01) return;
        const r = stage.getBoundingClientRect();
        const l = limites(s);
        tx = l.x * (1 - 2 * (e.clientX - r.left) / r.width);
        ty = l.y * (1 - 2 * (e.clientY - r.top) / r.height);
        aplicar(false);
    }

    function onWheel(e) {
        if (!conMouse()) return;
        e.preventDefault();
        const nueva = Math.max(1, Math.min(ZOOM_MAX, s * Math.exp(-e.deltaY * 0.002)));
        zoomEn(nueva, e.clientX, e.clientY);
        if (nueva > 1.01) seguirMouse(e); else { tx = 0; ty = 0; }
        aplicar(false);
    }

    function onKey(e) {
        if (!abierto) return;
        if (e.key === 'Escape') cerrar();
        else if (e.key === 'ArrowLeft') ir(idx - 1);
        else if (e.key === 'ArrowRight') ir(idx + 1);
    }

    // ── Pointer (mouse y touch) ──────────────────────────────────────────────
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    function onDown(e) {
        if (e.target.closest('button')) return;
        try { stage.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado */ }
        punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const ps = [...punteros.values()];
        if (ps.length === 2) {
            gesto = { tipo: 'pinch', d0: dist(ps[0], ps[1]) || 1, s0: s, m0: medio(ps[0], ps[1]), tx0: tx, ty0: ty };
        } else if (ps.length === 1) {
            gesto = { tipo: 'uno', x0: e.clientX, y0: e.clientY, tx0: tx, ty0: ty, t0: performance.now(), movio: false, eje: null, mouse: e.pointerType === 'mouse' };
        }
    }

    function onMove(e) {
        if (!punteros.has(e.pointerId) || !gesto) return;
        punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const ps = [...punteros.values()];

        if (gesto.tipo === 'pinch' && ps.length >= 2) {
            const m = medio(ps[0], ps[1]);
            const nueva = Math.max(0.85, Math.min(ZOOM_MAX * 1.15, gesto.s0 * dist(ps[0], ps[1]) / gesto.d0));
            // Pellizco + arrastre con dos dedos: el punto bajo los dedos queda fijo.
            const r = stage.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const qx = (gesto.m0.x - cx - gesto.tx0) / gesto.s0, qy = (gesto.m0.y - cy - gesto.ty0) / gesto.s0;
            s = nueva; tx = m.x - cx - s * qx; ty = m.y - cy - s * qy;
            aplicar(false);
            return;
        }
        if (gesto.tipo !== 'uno' || gesto.mouse) return;

        const dx = e.clientX - gesto.x0, dy = e.clientY - gesto.y0;
        if (Math.abs(dx) + Math.abs(dy) > 6) gesto.movio = true;

        if (s > 1.01) {                       // con zoom: arrastrar la foto
            tx = gesto.tx0 + dx; ty = gesto.ty0 + dy;
            limitar(); aplicar(false);
            return;
        }
        // Sin zoom: se decide el eje una vez y se respeta.
        if (!gesto.eje && gesto.movio) gesto.eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (gesto.eje === 'x') {
            const borde = (idx === 0 && dx > 0) || (idx === srcs.length - 1 && dx < 0);
            aplicarTrack(false, borde ? dx * 0.3 : dx);
        } else if (gesto.eje === 'y' && dy > 0) {
            root.style.setProperty('--gz-drag', `${dy}px`);
            root.style.setProperty('--gz-fade', String(Math.max(0.4, 1 - dy / 600)));
        }
    }

    function onUp(e) {
        if (!punteros.has(e.pointerId)) return;
        punteros.delete(e.pointerId);
        const g = gesto;

        if (g && g.tipo === 'pinch') {
            if (punteros.size === 1) {          // queda un dedo: sigue como arrastre
                const p = [...punteros.values()][0];
                gesto = { tipo: 'uno', x0: p.x, y0: p.y, tx0: tx, ty0: ty, t0: performance.now(), movio: true, eje: null, mouse: false };
            } else gesto = null;
            if (s < 1) resetZoom(true);
            else { s = Math.min(s, ZOOM_MAX); limitar(); aplicar(true); }
            return;
        }
        if (punteros.size > 0 || !g) return;
        gesto = null;

        const dx = e.clientX - g.x0, dy = e.clientY - g.y0;

        if (g.mouse) {                         // mouse: click = alternar zoom
            if (Math.abs(dx) + Math.abs(dy) > 6) return;
            if (s > 1.01) resetZoom(true);
            else { zoomEn(ZOOM_TOQUE, e.clientX, e.clientY); seguirMouse(e); aplicar(true); }
            return;
        }

        if (!g.movio) {                        // toque: doble toque = alternar zoom
            const ahora = performance.now();
            if (ahora - ultimoToque.t < 300 && Math.hypot(e.clientX - ultimoToque.x, e.clientY - ultimoToque.y) < 30) {
                if (s > 1.01) resetZoom(true);
                else { zoomEn(ZOOM_TOQUE, e.clientX, e.clientY); aplicar(true); }
                ultimoToque.t = 0;
            } else ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
            return;
        }

        if (s > 1.01) return;
        const vel = Math.abs(dx) / Math.max(1, performance.now() - g.t0);
        if (g.eje === 'x') {
            if (Math.abs(dx) > stage.clientWidth * UMBRAL_SWIPE || vel > 0.5) ir(idx + (dx < 0 ? 1 : -1));
            else aplicarTrack(true);
        } else if (g.eje === 'y') {
            root.classList.add('gz-snap');
            if (dy > UMBRAL_CIERRE) cerrar();
            root.style.removeProperty('--gz-drag');
            root.style.removeProperty('--gz-fade');
            setTimeout(() => root.classList.remove('gz-snap'), 260);
        }
    }

    function bind(contenedor, selector) {
        if (!contenedor) return;
        contenedor.addEventListener('click', e => {
            const el = e.target.closest(selector);
            if (!el || !contenedor.contains(el)) return;
            const todas = [...contenedor.querySelectorAll(selector)];
            open(todas.map(n => ({ src: n.currentSrc || n.src, zoom: n.dataset.zoom || null })), todas.indexOf(el));
        });
    }

    window.GuidoZoom = { open, close: cerrar, bind };
})();
