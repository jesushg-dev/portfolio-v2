# Media and images

Stored CMS media must already be a **local path** (`/…`) or an **absolute `http(s)` URL**. Public ids and other Cloudinary shorthand are not rewritten at runtime.

## Classification

`src/utils/tools/image.ts`:

| `classifyMediaSrc` | Meaning |
| --- | --- |
| `local` | starts with `/` |
| `remote-url` | valid `http://` or `https://` URL |
| `empty` | blank, invalid URL, or shorthand id (`portf-1_bkhwxr`, `react`, …) |

`isRenderableProjectImage` / `isAbsoluteOrLocalImagePath` gate cards so a leftover public id does not render a broken `next/image`.

## Rendering

`MediaImage` (`src/components/shared/media-image.tsx`) wraps `next/image`:

- Remote URLs default to `unoptimized` so tenant CDNs are not forced through the Vercel optimizer.
- Local `/public` files still go through the optimizer.

There is **no** `cloudinaryLoader` mapping public ids into `res.cloudinary.com/js-media`. Owner seed assets that still live on that cloud use **full URLs** in JSON/UI (hero photo, some chrome). Tenants should store UploadThing (or their own CDN) URLs from Admin.

## Config

`next.config.ts` `images.remotePatterns` allows `https://**` (any HTTPS host) plus known hosts (Cloudinary, Spotify, Simple Icons, UploadThing). HTTP catch-all is disabled.

See also [`tenant-credentials.md`](./tenant-credentials.md) (platform Cloudinary cost is seed/chrome URLs only) and [`security.md`](./security.md) (open HTTPS optimizer).
