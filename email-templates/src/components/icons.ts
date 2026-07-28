function svgDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const icons = {
  linkedin: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><rect width="24" height="24" rx="5" fill="#2E5AEB"/><path fill="#fff" d="M7.2 9.6h2.6V17H7.2V9.6Zm1.3-4.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.4 9.6h2.5v1h.03c.35-.63 1.2-1.3 2.47-1.3 2.64 0 3.13 1.66 3.13 3.82V17h-2.6v-3.5c0-.83-.02-1.9-1.2-1.9-1.2 0-1.38.9-1.38 1.84V17h-2.6V9.6Z"/></svg>`,
  ),
  linkedinMuted: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><rect width="24" height="24" rx="5" fill="#9CA3AF"/><path fill="#fff" d="M7.2 9.6h2.6V17H7.2V9.6Zm1.3-4.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.4 9.6h2.5v1h.03c.35-.63 1.2-1.3 2.47-1.3 2.64 0 3.13 1.66 3.13 3.82V17h-2.6v-3.5c0-.83-.02-1.9-1.2-1.9-1.2 0-1.38.9-1.38 1.84V17h-2.6V9.6Z"/></svg>`,
  ),
  globe: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4B5563" stroke-width="1.6"><circle cx="12" cy="12" r="8.4"/><ellipse cx="12" cy="12" rx="3.6" ry="8.4"/><path d="M3.8 12h16.4"/></svg>`,
  ),
  phone: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="#fff"><path d="M6.6 2.3c.5-.1 1 .1 1.3.5l1.9 2.6c.3.4.3.9.1 1.3L8.6 8.9c.9 2 2.5 3.6 4.5 4.5l1.2-1.3c.4-.2.9-.2 1.3.1l2.6 1.9c.4.3.6.8.5 1.3l-.5 2.2c-.1.6-.7 1-1.3.9-6.6-.9-11.8-6.1-12.7-12.7-.1-.6.3-1.2.9-1.3l2.2-.5Z"/></svg>`,
  ),
  phoneMuted: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#9CA3AF"><path d="M6.6 2.3c.5-.1 1 .1 1.3.5l1.9 2.6c.3.4.3.9.1 1.3L8.6 8.9c.9 2 2.5 3.6 4.5 4.5l1.2-1.3c.4-.2.9-.2 1.3.1l2.6 1.9c.4.3.6.8.5 1.3l-.5 2.2c-.1.6-.7 1-1.3.9-6.6-.9-11.8-6.1-12.7-12.7-.1-.6.3-1.2.9-1.3l2.2-.5Z"/></svg>`,
  ),
  github: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="#fff"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.6-.1-.3-.5-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.6 0 3.8-2.4 4.6-4.6 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>`,
  ),
  githubMuted: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#9CA3AF"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.6-.1-.3-.5-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.6 0 3.8-2.4 4.6-4.6 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>`,
  ),
};
