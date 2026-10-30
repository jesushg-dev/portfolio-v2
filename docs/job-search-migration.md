# JobSearch rollout

`Application.jobSearchId` is nullable in the schema during the rollout so databases with older applications remain readable before migration. New applications always receive a search ID. Reads fail clearly if they encounter unassigned applications; they never change historical data.

For each database, generate the Prisma client, then run the backfill in dry-run mode:

```sh
pnpm db:generate
pnpm db:backfill:job-search
```

Review the application and user counts. To apply, pass the exact database name from `MONGODB_URI`:

```sh
pnpm db:backfill:job-search --apply --expect-database=portfolio_prod
pnpm db:push
```

The apply step first saves every `Application` and `JobSearch` document to an ignored JSON backup under `scratch/job-search-backups/`. It then assigns only applications without a search ID, using a transaction per user. It verifies that the application count is unchanged and every application points to a search. Rerunning the command after a successful migration makes no assignment changes.

Do not change `jobSearchId` to required until every database that contains applications has completed this migration.
