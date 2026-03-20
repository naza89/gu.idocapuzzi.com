import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/shop', destination: '/' },
      { source: '/shop/producto', destination: '/' },
      { source: '/shop/:slug', destination: '/' },
      { source: '/cuenta', destination: '/' },
      { source: '/contacto', destination: '/' },
      { source: '/checkout/confirmacion', destination: '/' },
    ];
  },
};

export default nextConfig;
