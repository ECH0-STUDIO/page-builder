import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
