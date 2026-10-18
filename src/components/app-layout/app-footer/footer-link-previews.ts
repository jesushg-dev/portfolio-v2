/** Local optimized WebP previews for LinkPreview cards (served directly from Vercel Edge CDN with multi-locale support). */
export const SITE_PREVIEWS = {
  certificates: "/previews/certificates.webp",
  curriculum: "/previews/curriculum.webp",
  timeline: "/previews/timeline.webp",
  cvGenerator: "/previews/cv-generator.webp",
  projects: "/previews/projects.webp",
  colophon: "/previews/colophon.webp",
  stats: "/previews/stats.webp",
  uses: "/previews/uses.webp",
  now: "/previews/now.webp",
  howIUseAi: "/previews/process-how-i-use-ai.webp",
  qaCollaboration: "/previews/process-qa-collaboration.webp",
} as const;

export const FOOTER_LINK_PREVIEWS = SITE_PREVIEWS;
