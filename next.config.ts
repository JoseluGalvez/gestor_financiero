import type { NextConfig } from "next";

function configuredSupabaseOrigins(): string[] {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) return [];

  try {
    const url = new URL(rawUrl);
    const websocketProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    const websocketUrl = new URL(url.toString());
    websocketUrl.protocol = websocketProtocol;
    return [url.origin, websocketUrl.origin];
  } catch {
    return [];
  }
}

const supabaseOrigins = configuredSupabaseOrigins();
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  `connect-src 'self' ${supabaseOrigins.join(" ")}`.trim(),
].join("; ");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
