import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Código de terceros y generado — no lo escribimos nosotros, no tiene
    // sentido lintearlo y aportaba 52 de los 56 errores del repo, que era
    // exactamente lo que hacía imposible poner `lint` como gate del CI.
    // `public/vendor/` lo regenera scripts/vendor-supabase.mjs en cada build.
    "public/vendor/**",
    ".antigravity/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
