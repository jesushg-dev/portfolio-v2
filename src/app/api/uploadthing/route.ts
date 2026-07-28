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
): Promise<UploadThingRouteHandlers> {
  const session = await auth.api.getSession({ headers: req.headers });
  const userId = session?.user?.id;

  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Unauthorized");
  }

  const client = await getTenantUploadThingClient(userId);
  if (!client) {
    throw new Error(
      "UploadThing is not configured. Connect it in Admin → Credentials first.",
    );
  }

  return createRouteHandler({
    router: ourFileRouter,
    config: { token: client.token },
  }) as UploadThingRouteHandlers;
}

export async function GET(req: Request): Promise<Response> {
  const { GET: handleGet } = await createTenantRouteHandler(req);
  return handleGet(req);
}

export async function POST(req: Request): Promise<Response> {
  const { POST: handlePost } = await createTenantRouteHandler(req);
  return handlePost(req);
}
