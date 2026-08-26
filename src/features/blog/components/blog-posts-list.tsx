"use client";

import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import type { BlogPostEditorDTO } from "@/features/blog/lib/blog-editor-dto";

interface BlogPostsListProps {
  initialPosts: BlogPostEditorDTO[];
}

export function BlogPostsList({ initialPosts }: BlogPostsListProps) {
  const t = useTranslations("admin.blog");
  const utils = api.useUtils();

  const { data } = api.blogAdmin.getMine.useQuery(
    { page: 1, perPage: 50 },
    { initialData: { data: initialPosts, pageCount: 1, totalCount: initialPosts.length } },
  );

  const deletePost = api.blogAdmin.deleteItem.useMutation({
    onSuccess: () => {
      toast.success(t("deleted"));
      void utils.blogAdmin.getMine.invalidate();
    },
  });
  const moveInSeries = api.blogAdmin.moveInSeries.useMutation({
    onSuccess: async () => {
      await utils.blogAdmin.getMine.invalidate();
      toast.success(t("reordered"));
    },
  });

  const posts = data?.data ?? initialPosts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {t("count", { count: posts.length })}
        </p>
        <Link href={{ pathname: "/admin/blog/new" }}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t("newPost")}
          </Button>
        </Link>
      </div>

      <div className="divide-border divide-y rounded-lg border">
        {posts.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center text-sm">
            {t("empty")}
          </p>
        ) : (
          posts.map((post) => {
            const primaryTitle =
              Object.values(post.translations).find((t) => t.title)?.title ??
              post.slug;
            return (
              <div
                key={post.id}
                className="flex items-center justify-between p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-medium">
                    {primaryTitle}
                  </p>
                  <div className="text-muted-foreground mt-1 flex gap-3 text-xs">
                    <span className="bg-muted rounded px-1.5 py-0.5">
                      {post.status}
                    </span>
                    <span>{post.slug}</span>
                    {post.tags.length > 0 && (
                      <span>{post.tags.join(", ")}</span>
                    )}
                    {post.seriesName ? (
                      <span className="bg-muted rounded px-1.5 py-0.5">
                        {t("seriesLabel", { name: post.seriesName })}
                        {post.seriesOrder ? ` · #${post.seriesOrder}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {post.seriesName ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          moveInSeries.mutate({
                            id: post.id,
                            direction: "up",
                          })
                        }
                        disabled={moveInSeries.isPending}
                        aria-label={t("moveUp")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          moveInSeries.mutate({
                            id: post.id,
                            direction: "down",
                          })
                        }
                        disabled={moveInSeries.isPending}
                        aria-label={t("moveDown")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                  <Link href={{ pathname: "/admin/blog/[id]/edit", params: { id: post.id } }}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePost.mutate({ id: post.id })}
                    disabled={deletePost.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
