/**
 * Validates that MONGODB_URI includes a database name (required by Prisma for MongoDB).
 * Run before `prisma db push` / `db seed` to surface P1013 with a clear message.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
if (existsSync(resolve(root, ".env"))) {
  config({ path: resolve(root, ".env") });
}
if (existsSync(resolve(root, ".env.local"))) {
  config({ path: resolve(root, ".env.local"), override: true });
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

/** Path segment after host must be the database name, e.g. ...mongodb.net/portfolio_e2e */
const hasDatabaseName = /mongodb(\+srv)?:\/\/[^/?#]+\/[^/?#]+/.test(uri);

if (!hasDatabaseName) {
  console.error(
    [
      "Invalid MONGODB_URI: Prisma requires a database name in the connection string (P1013).",
      "",
      "Wrong (no database name):",
      "  mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority",
      "",
      "Correct:",
      "  mongodb+srv://user:pass@cluster.mongodb.net/portfolio_e2e?retryWrites=true&w=majority",
      "",
      "Add the database name after the host, before the query string.",
      "Update GitHub Environment Preview and Vercel Preview with the corrected URI.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("MONGODB_URI includes a database name.");
