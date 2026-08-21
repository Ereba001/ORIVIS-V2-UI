import {routes, type VercelConfig} from '@vercel/config/v1'

// Backend (Laravel) origin used for the same-origin /api/* proxy, e.g.
// 'https://api.orivis.ng'. Set ORIVIS_API_ORIGIN in the Vercel project
// settings (Settings -> Environment Variables); vercel.json cannot read env
// vars, so this file (vercel.ts) is required for env-driven routing.
const API_ORIGIN = process.env.ORIVIS_API_ORIGIN

// Fail closed: a production deployment behind the /api/* proxy MUST have
// ORIVIS_API_ORIGIN set. Silently proxying to a placeholder origin would ship
// a broken API to production, so abort the build instead of falling back.
if (!API_ORIGIN) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    throw new Error(
      'ORIVIS_API_ORIGIN is required for the /api/* proxy. Set it in Vercel ' +
      'project settings (Settings -> Environment Variables) — e.g. ' +
      'https://api.orivis.ng — and redeploy.',
    )
  }
  // Local development only: no proxy target configured, rewrites are inert.
  console.warn(
    '[vercel.ts] ORIVIS_API_ORIGIN is unset; /api/* rewrites will not proxy ' +
    'in this (non-production) environment.',
  )
}

export const config: VercelConfig = {
  rewrites: [
    // Proxy /api/* to the backend so the SPA can use the same-origin
    // '/api/v1' base (see src/constants/api.ts) without a VITE_API_URL.
    // When VITE_API_URL IS set at build time, the app bypasses this rewrite
    // and calls the API origin directly (cross-origin cookies then require
    // SESSION_SECURE_COOKIE=true, SESSION_SAME_SITE=none and SESSION_DOMAIN).
    routes.rewrite('/api/:path*', `${API_ORIGIN ?? 'http://localhost'}/api/:path*`),
    // SPA fallback: every other route serves the app shell.
    routes.rewrite('/(.*)', '/index.html'),
  ],
}
