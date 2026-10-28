# Resend events for Job Tracker

Each user's Resend integration has a separate webhook signing secret, encrypted with the other integration credentials.

## Setup

1. Generate the Prisma client with `pnpm db:generate`.
2. Back up the target database's email history using `pnpm exec tsx prisma/scripts/snapshot-email-history.ts`. Check the database name before running any database command. This script loads dotenv's default environment, not Next.js environment precedence.
3. Apply the Prisma indexes with `pnpm db:push` against the intended database. The unique index on ApplicationEmailEvent(userId, providerEventId) is required for concurrent duplicate protection. Do not bypass data-loss warnings.
4. Deploy the receiver and open Integrations > Resend. Copy the displayed webhook URL.
5. In the matching Resend account, create a webhook subscribing to email.sent, email.delivered, email.delivery_delayed, email.failed, email.suppressed, email.bounced, email.complained, and email.opened.
6. Paste its signing secret into that user's Resend integration and save.
7. Configure open tracking on the Resend domain. The application cannot toggle Resend's domain tracking per individual message.

Sending remains available without a webhook secret, but delivery and opening events will not be recorded until the webhook is configured.

## Processing

- Every outgoing message is tagged with the pre-existing ApplicationEmail identifier. This allows a verified webhook to arrive before the send API response has been stored.
- The receiving route verifies the exact raw body with the tenant's signing secret and checks the recipient, tenant and provider message identifier.
- Event receipt, opening detail and counters are written in one MongoDB transaction. Failed transactions return 503 so the provider can retry. Duplicate events do not increment counters.
- Delivery state and opening activity are independent. Late sent/delayed events cannot downgrade a delivered or failed message.
- Company and copy messages have separate records and provider IDs. Resend may track copies at domain level, but company metrics exclude them.
- A delivered message reached the receiving mail server; it is not proof of inbox placement. An opening is approximate and is not proof that the attached CV was read.

## Historical data

Existing ApplicationEmail and ApplicationEmailOpen records remain intact. Missing trackingSource identifies historical custom-pixel data in the UI. Do not populate historical delivery states or Resend identifiers without verifiable provider data.

The old pixel endpoint and token generator have been removed. Already sent custom-pixel emails no longer add opening observations. Their stored observations remain available.

MongoDB does not need old documents rewritten for these optional fields. The retired token field is no longer in the Prisma model; this change does not delete raw historical fields or records from MongoDB.

## Verification gate

Before release, verify signature rejection, duplicate and concurrent event delivery, out-of-order delivery, tenant isolation, a webhook arriving before the send response, and company/copy separation. Do not send a test message to a real employer.
