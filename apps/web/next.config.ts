import type { NextConfig } from "next";
import { STORE_LOCALE_CODES } from "./src/i18n/store-locales";

const localeSegment = STORE_LOCALE_CODES.join("|");

const nextConfig: NextConfig = {
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
    return [
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
