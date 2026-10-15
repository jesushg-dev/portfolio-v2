import { hashEmailOpenTrackingToken } from "@/features/job-tracker/lib/email-open-tracking";
import { db } from "@/server/db";

const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
  "base64",
);
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function imageResponse(status = 200): Response {
  return new Response(TRACKING_PIXEL, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
      "Content-Length": String(TRACKING_PIXEL.byteLength),
      "Content-Type": "image/gif",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !TOKEN_PATTERN.test(token)) return imageResponse();

  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1"
  ) {
    return imageResponse();
  }

  try {
    const email = await db.applicationEmail.findFirst({
      where: {
        trackingTokenHash: hashEmailOpenTrackingToken(token),
        trackingEnabled: true,
      },
      select: { id: true, firstOpenedAt: true },
    });

    if (email) {
      const observedAt = new Date();
      const userAgent = request.headers.get("user-agent") ?? undefined;
      const forwarded = request.headers.get("x-forwarded-for");
      const ipAddress = forwarded
        ? forwarded.split(",")[0]?.trim()
        : (request.headers.get("x-real-ip") ?? undefined);

      await Promise.all([
        db.applicationEmailOpen.create({
          data: {
            emailId: email.id,
            openedAt: observedAt,
            userAgent,
            ipAddress,
          },
        }),
        db.applicationEmail.update({
          where: { id: email.id },
          data: {
            openCount: { increment: 1 },
            lastOpenedAt: observedAt,
            ...(email.firstOpenedAt ? {} : { firstOpenedAt: observedAt }),
          },
        }),
      ]);
    }

    return imageResponse();
  } catch (error) {
    console.error("[email-open-tracking] Could not record image load", error);
    return imageResponse(503);
  }
}
