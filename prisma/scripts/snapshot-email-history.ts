import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const client = new PrismaClient();
try {
  const [emails, opens] = await Promise.all([
    client.applicationEmail.findMany(),
    client.applicationEmailOpen.findMany(),
  ]);
  const directory = path.resolve("scratch/email-history-backups");
  await mkdir(directory, { recursive: true });
  const backup = path.join(directory, `before-resend-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backup, JSON.stringify({ capturedAt: new Date(), emails, opens }, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ backup, emails: emails.length, opens: opens.length }));
} finally {
  await client.$disconnect();
}
