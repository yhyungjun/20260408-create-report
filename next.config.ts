import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@anthropic-ai/sdk', 'puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'pdf-parse'],
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
};

export default nextConfig;
