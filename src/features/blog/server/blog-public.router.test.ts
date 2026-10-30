import { blogPublicRouter } from "./blog-public.router";
import {
  createRouterCaller,
  createTrpcTestContext,
} from "@/test-utils/trpc-caller";

function setup() {
  const db = {
    appLanguage: { findUnique: jest.fn().mockResolvedValue({ id: "lang-es" }) },
    blogPost: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return {
    db,
    caller: createRouterCaller(blogPublicRouter, createTrpcTestContext({ db })),
  };
}

describe("public blog browsing", () => {
  it("uses the last returned post as cursor with a deterministic publication order", async () => {
    const { db, caller } = setup();
    db.blogPost.findMany.mockResolvedValue(
      ["older-id", "newer-id", "extra-id"].map((id) => ({
        id,
        slug: id,
        tags: [],
        translations: [],
        publishedAt: new Date("2026-10-01"),
      })),
    );
    const page = await caller.list({ locale: "es", limit: 2 });
    expect(page.posts.map((post) => post.id)).toEqual(["older-id", "newer-id"]);
    expect(page.nextCursor).toBe("newer-id");
    await caller.list({ locale: "es", limit: 2, cursor: page.nextCursor });
    expect(db.blogPost.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cursor: { id: "newer-id" },
        skip: 1,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        where: { userId: "user-1", status: "PUBLISHED" },
      }),
    );
  });

  it("searches on the server in the requested language and keeps tenant and tag filters", async () => {
    const { db, caller } = setup();
    await caller.list({ locale: "es", search: "Gaceta", tag: "nicaragua" });
    expect(db.blogPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: "PUBLISHED",
          tags: { has: "nicaragua" },
          OR: expect.arrayContaining([
            expect.objectContaining({
              translations: {
                some: {
                  appLanguageId: "lang-es",
                  OR: [
                    { title: { contains: "Gaceta", mode: "insensitive" } },
                    { excerpt: { contains: "Gaceta", mode: "insensitive" } },
                  ],
                },
              },
            }),
          ]),
        }),
      }),
    );
  });

  it("loads stable tags across published posts and hides series metadata", async () => {
    const { db, caller } = setup();
    db.blogPost.findMany.mockResolvedValue([
      { tags: ["telegram", "series:Guide"] },
      { tags: ["nicaragua", "telegram"] },
    ]);
    expect(await caller.getTags({})).toEqual(["nicaragua", "telegram"]);
    expect(db.blogPost.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "PUBLISHED" },
      select: { tags: true },
    });
  });

  it("returns no posts or tags without a resolved tenant", async () => {
    const { db } = setup();
    const caller = createRouterCaller(
      blogPublicRouter,
      createTrpcTestContext({ db, tenant: null }),
    );
    expect(await caller.list({})).toEqual({ posts: [], nextCursor: null });
    expect(await caller.getTags({})).toEqual([]);
    expect(db.blogPost.findMany).not.toHaveBeenCalled();
  });
});
