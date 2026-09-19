/** @type {import('next').NextConfig} */

// Security response headers (stress test 2026-09-19, S6).
//
// The hard headers below are enforced from day one -- they cannot break
// rendering: nothing in this app is framed by another site, sniffed, or needs
// camera / microphone / geolocation.
//
// The Content-Security-Policy ships in REPORT-ONLY mode first. Enforcing a CSP
// blind on a page that loads the PayPal SDK (script + popup + iframes) and
// talks to Supabase could silently break payments; report-only surfaces every
// violation in the browser console without blocking anything, so it can be
// tightened to an enforced policy after the real flows (login, checkout,
// Assistant, University) have been observed clean.
const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; nonce-based CSP would force every
  // page to dynamic rendering, so 'unsafe-inline' stays for now. React dev mode
  // needs eval. PayPal's SDK is the only third-party script.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.paypal.com https://www.sandbox.paypal.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.paypalobjects.com https://www.paypal.com https://www.sandbox.paypal.com",
  "font-src 'self' data:",
  // Supabase (REST + realtime websocket) and PayPal checkout XHR. Gemini and
  // Resend are called server-side only and never from the browser.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.paypal.com https://www.sandbox.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com",
  // PayPal renders its buttons / card fields in iframes.
  "frame-src https://www.paypal.com https://www.sandbox.paypal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
  // Nobody may embed this site in a frame (clickjacking); modern equivalent of X-Frame-Options.
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // One year, no includeSubDomains / preload: those are hard to undo and this
  // project does not control every subdomain of its host.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
