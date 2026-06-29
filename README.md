# zurai02.github.io

Personal portfolio site for **zurai02** — Roblox Scripting & Engine Optimization Specialist.

Live at **[zurai02.github.io](https://zurai02.github.io)**

---

## Stack

| File | Role |
|---|---|
| `index.html` | Structure & markup |
| `style.css` | Visual layer — layout, animations, liquid glass |
| `site.js` | Frontend engine — particles, typewriter, terminal, copy |
| `maintenance.js` | Maintenance mode system |
| `sw.js` | Service Worker — offline caching, PWA |
| `manifest.json` | PWA manifest — installable app config |
| `tsconfig.json` | TypeScript compiler config |
| `site.ts` | TypeScript source (compiles to `site.js`) |
| `icons.svg` | SVG icon sprite sheet |
| `particle.glsl` | GLSL shader source for WebGL particle upgrade |
| `sitemap.xml` | XML sitemap for search engines |
| `robots.txt` | Search bot crawl instructions |
| `deploy.sh` | Shell deployment script |

---

## Features

- Particle background with per-particle sine pulse
- Smooth cursor glow with lerp RAF (desktop)
- Hero typewriter cycling through 4 phrases
- Scroll reveal with IntersectionObserver
- Animated counter (100% client-side focus)
- Terminal typewriter with Luau syntax highlighting
- Discord username copy with toast notification
- Time-based greeting + first-visit welcome overlay
- Visit counter via localStorage
- Maintenance mode system with admin bypass
- Liquid glass cards with backdrop-filter
- PWA — installable, offline-capable via Service Worker
- Full security headers via CSP meta tags
- `prefers-reduced-motion` respected throughout

---

## Maintenance Mode

**Enable (instant, no commit):**
```js
MAINT.enable()
```

**Disable:**
```js
MAINT.disable()
```

**Admin bypass while site is down:**
```
https://zurai02.github.io/?admin=zurai02
```

**Enable permanently (via GitHub):**
Open `maintenance.js`, set `enabled: true`, commit and push.

---

## Deployment

```bash
chmod +x deploy.sh   # first time only
./deploy.sh          # auto commit message
./deploy.sh "update hero copy"  # custom message
```

The script checks all required files exist, runs TypeScript compile if Node is available, reports file sizes, stages everything, commits, and pushes to `main`.

---

## TypeScript

`site.ts` is the fully typed source. Compile it to regenerate `site.js`:

```bash
npx tsc --project tsconfig.json
```

---

## File Structure

```
zurai02.github.io/
├── index.html
├── style.css
├── site.js
├── site.ts
├── maintenance.js
├── sw.js
├── manifest.json
├── tsconfig.json
├── icons.svg
├── particle.glsl
├── sitemap.xml
├── robots.txt
└── deploy.sh
```

---

## Contact

- DevForum: [zurai02 Scripting Portfolio](https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442)
- DevForum Profile: [@zurai02](https://devforum.roblox.com/u/zurai02)
- Roblox: [Profile](https://www.roblox.com/users/5674181802/profile)
- Discord: `lol066351`
