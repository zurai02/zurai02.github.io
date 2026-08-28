# zurai02 blog

A dark, minimal blog matching the [zurai02.github.io](https://zurai02.github.io) portfolio aesthetic — particle backgrounds, liquid glass cards, terminal vibes, and smooth animations.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Blog homepage with post list |
| `post.html` | Individual post reader |
| `admin.html` | Admin panel (go to `/admin.html`) |
| `style.css` | All styling — liquid glass, particles, animations |
| `site.js` | Frontend engine — particles, typewriter, markdown, admin |
| `posts.json` | **Your posts data** — edit this to add posts |
| `.env` | **Admin credentials** — set your password & email here |

## Quick Start

1. **Set your admin credentials** in `.env`:
   ```
   ADMIN_PASSWORD=your_secure_password
   ADMIN_EMAIL=your@email.com
   ```

2. **Add posts** by editing `posts.json`:
   ```json
   {
     "id": "my-post-url",
     "title": "My Post Title",
     "date": "2026-08-28",
     "tags": ["luau", "roblox"],
     "content": "Your post content here...\n\nSupports markdown."
   }
   ```

3. **Open `index.html`** in a browser or deploy to any static host (GitHub Pages, Vercel, Netlify, etc.)

4. **Go to `/admin.html`** to manage posts via the UI.

## Post Format

`posts.json` is an array of post objects:

- `id` — URL-safe identifier (no spaces, used in URLs like `post.html?id=my-post`)
- `title` — Post title
- `date` — ISO date string `YYYY-MM-DD`
- `tags` — Array of tag strings
- `content` — Markdown content (supports `# headers`, `**bold**`, `` `code` ``, ``` code blocks, lists, blockquotes)

## Admin Panel

Navigate to `admin.html`. Enter the credentials from `.env`. The admin panel lets you:

- View all posts
- Add new posts
- Edit existing posts
- Delete posts

**Note:** Since this is a static site, saving posts downloads an updated `posts.json` file. Replace your old `posts.json` with the downloaded one and redeploy.

## Deployment

Drop all files on any static host:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- Any web server (nginx, Apache, etc.)

No build step required.

## Security Note

The `.env` file and `posts.json` are **public** on static hosting. For production use, you should:

- Move admin auth to a serverless function (Vercel/Netlify Functions, Cloudflare Workers)
- Store `.env` secrets server-side only
- Use a backend API to read/write posts.json

The current setup works perfectly for personal blogs where admin access is low-risk.
