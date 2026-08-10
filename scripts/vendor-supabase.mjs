// =============================================================================
// VENDORIZAR @supabase/supabase-js
// =============================================================================
// Copia el build UMD de @supabase/supabase-js desde node_modules a public/vendor/,
// para servir la librería desde nuestro propio dominio en vez del CDN de jsdelivr.
//
// ¿POR QUÉ?
// page.tsx cargaba <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">.
// Si ese pedido fallaba —CDN caído o lento, red corporativa que lo bloquea, un
// adblocker— la global `supabase` nunca existía, window.supabaseClient nunca se
// creaba y el checkout entero quedaba inutilizable. Encima el tag pedía `@2` sin
// pinear: jsdelivr podía servirle cualquier 2.x nuevo a producción sin revisión.
// Sirviéndola desde /vendor/ el único punto de falla pasa a ser el mismo que ya
// tiene el resto del sitio, y la versión la fija package.json.
//
// El build UMD expone exactamente la misma global (`var supabase = ...`) que el
// del CDN, así que supabase-config.js no necesita ningún cambio.
//
// ¿CUÁNDO CORRE?
// Solo, vía los scripts `predev` y `prebuild` de package.json. El archivo
// generado se commitea igual, para que un `next start` en limpio funcione sin
// haber corrido el script.
//
// Para actualizar la librería: npm update @supabase/supabase-js && npm run build
// (el diff de public/vendor/supabase-js.umd.js queda visible en el commit).
// =============================================================================

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const raizProyecto = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
    const pkgPath = require.resolve('@supabase/supabase-js/package.json');
    const version = JSON.parse(readFileSync(pkgPath, 'utf8')).version;

    const origen = join(dirname(pkgPath), 'dist', 'umd', 'supabase.js');
    const destinoDir = join(raizProyecto, 'public', 'vendor');
    const destino = join(destinoDir, 'supabase-js.umd.js');

    mkdirSync(destinoDir, { recursive: true });
    copyFileSync(origen, destino);

    const kb = Math.round(statSync(destino).size / 1024);
    console.log(`[vendor] @supabase/supabase-js@${version} → public/vendor/supabase-js.umd.js (${kb} KB)`);
} catch (err) {
    // Fallar ruidoso: si no se copia, el <script> de page.tsx devuelve 404 y el
    // checkout queda muerto. Mejor romper el build que deployar eso.
    console.error('[vendor] ❌ No se pudo vendorizar @supabase/supabase-js:', err.message);
    console.error('[vendor] Probá con: npm install');
    process.exit(1);
}
