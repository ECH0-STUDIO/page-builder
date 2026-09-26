import type { NextConfig } from "next";
import { STORE_LOCALE_CODES } from "./src/i18n/store-locales";

const localeSegment = STORE_LOCALE_CODES.join("|");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        // Keep [locale] off the app-root sibling of [slug]. Next cannot have
        // two different param names at the same path depth, and /{slug}/order
        // was matching [locale]/[slug] (QR + custom-domain diner 404).
        {
          source: `/:locale(${localeSegment})/:slug/:path*`,
          destination: `/loc/:locale/:slug/:path*`,
        },
      ],
    };
  },
  async headers() {
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    return [
      {
        source: '/:path*',
        headers: security,
      },
      {
        // Webflow CSS, JS, and images. Filenames change only on deploy.
        source: '/marketing/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/sw-push.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  experimental: {
    serverActions: {
      // Images are compressed client-side before upload, but this prevents
      // hard crashes if other server actions accidentally receive large payloads.
      bodySizeLimit: '4mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lwupkuhygzybnkoaoenr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow placeholder images via generic pattern for backwards compatibility or remote links
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
