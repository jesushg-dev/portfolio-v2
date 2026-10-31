import { getSeoTenant } from "@/lib/seo/tenant-seo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ site: string }> },
) {
  const tenant = await getSeoTenant((await params).site);
  if (!tenant) return new Response(null, { status: 404 });
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${tenant.origin}/sitemap.xml\n`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}
