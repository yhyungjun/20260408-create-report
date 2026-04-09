import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk', 'puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
};

export default nextConfig;
