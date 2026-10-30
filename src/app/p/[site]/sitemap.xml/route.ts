import {
  getSeoTenant,
  getTenantSitemap,
  serializeSitemap,
} from "@/lib/seo/tenant-seo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ site: string }> },
) {
  const tenant = await getSeoTenant((await params).site);
  if (!tenant) return new Response(null, { status: 404 });
  return new Response(serializeSitemap(await getTenantSitemap(tenant)), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
