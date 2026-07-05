import express, { Request, Response } from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

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
