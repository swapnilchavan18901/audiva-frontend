import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
      ],
    }, {
      source: "/calendar-inbox",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "no-store" },
      ],
    }];
  },
  experimental: {
    agentUpgrade: "security",
  },
};
export default config;
