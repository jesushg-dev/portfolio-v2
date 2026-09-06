export const PROCESS_PAGE_PATHNAME = "/process/[slug]" as const;

export function processPageHref(slug: string) {
  return {
    pathname: PROCESS_PAGE_PATHNAME,
    params: { slug },
  };
}
