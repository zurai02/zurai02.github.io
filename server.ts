import express, { Request, Response } from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self';",
    "base-uri 'self';",
    "object-src 'none';",
    "frame-ancestors 'none';",
    "form-action 'self' https:;",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://*.cloudflareinsights.com;",
    "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://*.cloudflareinsights.com;",
    "style-src 'self' 'unsafe-inline' https:;",
    "img-src 'self' data: https:;",
    "font-src 'self' data: https:;",
    "connect-src 'self' https://api.github.com https://cloudflare-dns.com https://dns.google https://*.cloudflare.com https://*.cloudflareinsights.com https://*.github.io https://*.githubusercontent.com;",
    "media-src 'self' data:;",
    "worker-src 'self' blob:;",
    "upgrade-insecure-requests;"
  ].join(" "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "cross-origin"
};

app.use((_req, res, next) => {
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value);
  });
  next();
});

// Serve static assets (css, js, svg, glsl, etc.)
app.use(express.static(ROOT, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    // Service worker needs exact scope
    if (filePath.endsWith("sw.js")) {
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache");
    }
    // GLSL shader files
    if (filePath.endsWith(".glsl")) {
      res.setHeader("Content-Type", "text/plain");
    }
    // PWA manifest
    if (filePath.endsWith("manifest.json")) {
      res.setHeader("Content-Type", "application/manifest+json");
    }
  }
}));

// Fallback → index.html
app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n zurai02.github.io running at http://localhost:${PORT}\n`);
});
