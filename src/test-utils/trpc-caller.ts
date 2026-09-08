import type { ResolvedTenant } from "@/lib/tenant/resolve";
import type { createTRPCContext } from "@/server/api/trpc";

export type TrpcTestContext = Awaited<ReturnType<typeof createTRPCContext>>;

export const MOCK_OWNER_USER = {
  id: "user-1",
  email: "owner@example.com",
  name: "Owner",
  emailVerified: false,
  twoFactorEnabled: false,
  createdAt: new Date("2020-01-01T00:00:00.000Z"),
  updatedAt: new Date("2020-01-01T00:00:00.000Z"),
  image: null,
};

export const mockOwnerTenant: ResolvedTenant = {
  userId: MOCK_OWNER_USER.id,
  username: "owner",
  defaultLocale: "en",
  isPrimary: true,
  isPublished: true,
  displayName: "Owner",
  logoInitials: "OW",
  logoImageUrl: null,
};

export function createTrpcTestContext(options: {
  db: unknown;
  user?: TrpcTestContext["user"] | null;
  tenant?: ResolvedTenant | null;
  headers?: Headers;
}): TrpcTestContext {
  const user = options.user === undefined ? MOCK_OWNER_USER : options.user;

  return {
    db: options.db as TrpcTestContext["db"],
    session: user
      ? {
          user,
          session: {
            id: "sess-1",
            userId: user.id,
            expiresAt: new Date("2099-01-01T00:00:00.000Z"),
            createdAt: new Date("2020-01-01T00:00:00.000Z"),
            updatedAt: new Date("2020-01-01T00:00:00.000Z"),
            token: "test-token",
            ipAddress: "127.0.0.1",
            userAgent: "jest",
          },
        }
      : null,
    user,
    tenant: options.tenant === undefined ? mockOwnerTenant : options.tenant,
    headers: options.headers ?? new Headers(),
  };
}

export function createRouterCaller<
  TRouter extends {
    createCaller: (ctx: TrpcTestContext) => unknown;
  },
>(router: TRouter, ctx: TrpcTestContext): ReturnType<TRouter["createCaller"]> {
  return router.createCaller(ctx) as ReturnType<TRouter["createCaller"]>;
}
