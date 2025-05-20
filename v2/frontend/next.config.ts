import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_PISTON_URL: process.env.REACT_APP_PISTON_URL || 'https://emkc.org/api/v2/piston',
  },
  async rewrites() {
    return [
      {
        source: '/api/piston/:path*',
        destination: `${process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Allow CORS for local development and API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  }
};

export default nextConfig;
