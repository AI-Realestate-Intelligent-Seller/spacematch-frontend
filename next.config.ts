import type { NextConfig } from "next";

/**
 * The FastAPI backend. The browser never calls it directly: /api/* on this app is proxied there, so the
 * backend's session cookie stays first-party (no CORS). Rewrites are fixed at build time, so set
 * BACKEND_URL before `npm run build` in production.
 */
const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

// On Vercel a missing BACKEND_URL would silently send every API call to 127.0.0.1 - fail the build instead.
if (process.env.VERCEL && !process.env.BACKEND_URL) {
  throw new Error("Set BACKEND_URL (the backend's https URL) in Vercel: Project Settings -> Environment Variables, then redeploy");
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // "/" has no page of its own; signed-out visitors then go on to /login from the app shell.
    return [{ source: "/", destination: "/properties", permanent: false }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
