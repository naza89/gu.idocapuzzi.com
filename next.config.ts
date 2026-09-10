import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/shop', destination: '/' },
      { source: '/shop/producto', destination: '/' },
      { source: '/shop/:slug', destination: '/' },
      { source: '/archivo', destination: '/' },
      { source: '/archivo/colecciones/:slug', destination: '/' },
      { source: '/cuenta', destination: '/' },
      { source: '/contacto', destination: '/' },
      // start.js empuja '/legales' al History API (URL_LEGALES), pero no había
      // rewrite: entrar directo, recargar o compartir el link daba 404.
      { source: '/legales', destination: '/' },
      { source: '/checkout/confirmacion', destination: '/' },
    ];
  },
};

export default nextConfig;
