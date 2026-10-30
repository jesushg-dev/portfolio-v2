import { createRouteHandler } from "uploadthing/next";

import { auth } from "@/lib/auth";
import { getTenantUploadThingClient } from "@/lib/uploadthing/tenant-uploadthing";

import { ourFileRouter } from "./core";

interface UploadThingRouteHandlers {
  GET: (req: Request) => Response | Promise<Response>;
  POST: (req: Request) => Response | Promise<Response>;
}

async function createTenantRouteHandler(
  req: Request,
): Promise<UploadThingRouteHandlers | Response> {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user?.id;

  if (typeof userId !== "string" || userId.length === 0) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getTenantUploadThingClient(userId);
  if (!client) {
    return Response.json(
      {
        error:
          "UploadThing is not configured. Connect it in Admin → Credentials first.",
      },
      { status: 503 },
    );
  }

  return createRouteHandler({
    router: ourFileRouter,
    config: { token: client.token },
  }) as UploadThingRouteHandlers;
}

export async function GET(req: Request): Promise<Response> {
  const handler = await createTenantRouteHandler(req);
  if (handler instanceof Response) return handler;
  return handler.GET(req);
}

export async function POST(req: Request): Promise<Response> {
  const handler = await createTenantRouteHandler(req);
  if (handler instanceof Response) return handler;
  return handler.POST(req);
}
