import { Resend } from "resend";
import { z } from "zod";
import { db } from "@/server/db";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";

const schema = z.object({ type: z.string(), created_at: z.string().datetime({ offset: true }), data: z.object({ email_id: z.string(), to: z.array(z.string()), tags: z.record(z.string(), z.string()).optional() }) });
const states: Record<string, { status: string; rank: number }> = {
  "email.sent": { status: "SENT", rank: 1 },
  "email.delivery_delayed": { status: "DELAYED", rank: 2 },
  "email.delivered": { status: "DELIVERED", rank: 3 },
  "email.failed": { status: "FAILED", rank: 4 },
  "email.suppressed": { status: "FAILED", rank: 4 },
  "email.bounced": { status: "BOUNCED", rank: 5 },
  "email.complained": { status: "COMPLAINED", rank: 6 },
};

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(userId)) return new Response(null, { status: 404 });
  const config = await getTenantIntegrationConfig(userId, "resend");
  if (!config?.webhookSecret) return new Response(null, { status: 404 });
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return new Response(null, { status: 400 });
  let verified: unknown;
  try {
    verified = new Resend(config.apiKey).webhooks.verify({ payload: await request.text(), headers: { id, timestamp, signature }, webhookSecret: config.webhookSecret });
  } catch { return new Response(null, { status: 401 }); }
  const parsed = schema.safeParse(verified);
  if (!parsed.success) return new Response(null, { status: 200 });
  const event = parsed.data;
  if (!states[event.type] && event.type !== "email.opened") return new Response(null, { status: 200 });
  try {
    await db.$transaction(async (tx) => {
      if (await tx.applicationEmailEvent.findUnique({ where: { userId_providerEventId: { userId, providerEventId: id } } })) return;
      const tag = event.data.tags?.application_email_id;
      const email = await tx.applicationEmail.findFirst({ where: { userId, OR: [{ providerMessageId: event.data.email_id }, ...(tag && /^[a-f0-9]{24}$/i.test(tag) ? [{ id: tag }] : [])] } });
      if (!email) return; // Events from unrelated portfolio/auth emails are outside Job Tracker.
      if ((email.providerMessageId && email.providerMessageId !== event.data.email_id) || !event.data.to.some((recipient) => recipient.toLowerCase() === email.recipientEmail.toLowerCase())) throw new Error("Webhook message does not match its local record");
      const occurredAt = new Date(event.created_at);
      await tx.applicationEmailEvent.create({ data: { userId, emailId: email.id, providerEventId: id, providerMessageId: event.data.email_id, type: event.type, occurredAt } });
      const events = await tx.applicationEmailEvent.findMany({ where: { emailId: email.id }, orderBy: { occurredAt: "asc" } });
      const opens = events.filter((item) => item.type === "email.opened");
      const delivered = events.find((item) => item.type === "email.delivered");
      const delivery = events.reduce<(typeof events)[number] | undefined>((current, item) => {
        const rank = states[item.type]?.rank ?? 0;
        return rank > 0 && rank >= (current ? states[current.type]?.rank ?? 0 : 0) ? item : current;
      }, undefined);
      if (event.type === "email.opened") await tx.applicationEmailOpen.create({ data: { emailId: email.id, openedAt: occurredAt } });
      await tx.applicationEmail.update({ where: { id: email.id }, data: {
        providerMessageId: event.data.email_id, trackingSource: "RESEND",
        ...(delivery ? { deliveryStatus: states[delivery.type]!.status, deliveryUpdatedAt: delivery.occurredAt } : {}),
        ...(delivered ? { deliveredAt: delivered.occurredAt } : {}),
        ...(opens.length ? { trackingEnabled: true, openCount: opens.length, firstOpenedAt: opens[0]!.occurredAt, lastOpenedAt: opens[opens.length - 1]!.occurredAt } : {}),
      } });
    });
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("[resend-webhook] Processing failed", error);
    return new Response(null, { status: 503 });
  }
}
