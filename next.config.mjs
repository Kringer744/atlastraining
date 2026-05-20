/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    const securityHeaders = [
      // HSTS — força HTTPS pra próximos 2 anos
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Não permite ser embedado em iframes (clickjacking)
      { key: "X-Frame-Options", value: "DENY" },
      // Browser não infere MIME (anti-XSS via type confusion)
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Limita referer enviado pra outros domínios
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Permissions: libera só mic (sono) e screen-wake-lock
      {
        key: "Permissions-Policy",
        value:
          "camera=(), geolocation=(), payment=(), usb=(), microphone=(self), screen-wake-lock=(self)",
      },
      // CSP básico — Next App Router precisa de unsafe-inline pra inline scripts dele
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "img-src 'self' data: blob: https:",
          "media-src 'self' blob:",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "connect-src 'self' https://*.nocodb.com https://*.easypanel.host wss://*.easypanel.host",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
