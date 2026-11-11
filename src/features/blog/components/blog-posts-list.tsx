"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  FileText,
  Search,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import type { BlogPostEditorDTO } from "@/features/blog/lib/blog-editor-dto";

interface BlogPostsListProps {
  initialPosts: BlogPostEditorDTO[];
}

type BlogTranslations = ReturnType<typeof useTranslations<"admin.blog">>;

interface SeriesCardProps {
  seriesName: string;
  items: BlogPostEditorDTO[];
  onMove: (id: string, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
  isMovePending: boolean;
  isDeletePending: boolean;
  t: BlogTranslations;
}

function SeriesCard({
  seriesName,
  items,
  onMove,
  onDelete,
  isMovePending,
  isDeletePending,
  t,
}: SeriesCardProps) {
  return (
    <section
      aria-label={seriesName}
      className="bg-card border-border rounded-2xl border p-5 shadow-2xs"
    >
      <div className="border-border/60 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Layers className="size-4.5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-foreground text-base font-bold tracking-tight">
              {seriesName}
            </h2>
            <p className="text-muted-foreground text-xs">
              {t("chaptersCount", { count: items.length })}
            </p>
          </div>
        </div>

        <Link
          href={{
            pathname: "/admin/blog/new",
          }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
          <span>{t("addChapter")}</span>
        </Link>
      </div>

      <div className="divide-border/50 divide-y">
        {items.map((post, idx) => {
          const primaryTitle =
            Object.values(post.translations).find((tr) => tr.title)?.title ??
            post.slug;
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;

          return (
            <div
              key={post.id}
              className="group flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="bg-muted text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold">
                  #{post.seriesOrder ?? idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {primaryTitle}
                  </p>
                  <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant={
                        post.status === "PUBLISHED" ? "default" : "secondary"
                      }
                      className="px-1.5 py-0 text-[0.625rem]"
                    >
                      {post.status === "PUBLISHED"
                        ? t("statusPublished")
                        : t("statusDraft")}
                    </Badge>
                    <span className="font-mono text-[0.6875rem]">
                      /{post.slug}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove(post.id, "up")}
                  disabled={isFirst || isMovePending}
                  aria-label={t("moveUp")}
                  className="size-8 p-0"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMove(post.id, "down")}
                  disabled={isLast || isMovePending}
                  aria-label={t("moveDown")}
                  className="size-8 p-0"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Link
                  href={{
                    pathname: "/admin/blog/[id]/edit",
                    params: { id: post.id },
                  }}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "size-8 p-0",
                  })}
                  aria-label={t("edit")}
                >
                  <Pencil className="size-4" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(post.id)}
                  disabled={isDeletePending}
                  aria-label={t("deleted")}
                  className="text-destructive hover:text-destructive size-8 p-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface PostRowProps {
  post: BlogPostEditorDTO;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  t: BlogTranslations;
  showSeries?: boolean;
}

function PostRow({
  post,
  onDelete,
  isDeletePending,
  t,
  showSeries = true,
}: PostRowProps) {
  const primaryTitle =
    Object.values(post.translations).find((tr) => tr.title)?.title ?? post.slug;

  return (
    <div className="group flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {primaryTitle}
          </p>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant={post.status === "PUBLISHED" ? "default" : "secondary"}
              className="px-1.5 py-0 text-[0.625rem]"
            >
              {post.status === "PUBLISHED"
                ? t("statusPublished")
                : t("statusDraft")}
            </Badge>

            {showSeries && post.seriesName ? (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[0.6875rem] font-medium">
                {post.seriesName}
                {post.seriesOrder ? ` · #${post.seriesOrder}` : ""}
              </span>
            ) : null}

            <span className="font-mono text-[0.6875rem]">/{post.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        <Link
          href={{
            pathname: "/admin/blog/[id]/edit",
            params: { id: post.id },
          }}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "size-8 p-0",
          })}
          aria-label={t("edit")}
        >
          <Pencil className="size-4" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(post.id)}
          disabled={isDeletePending}
          aria-label={t("deleted")}
          className="text-destructive hover:text-destructive size-8 p-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function BlogPostsList({ initialPosts }: BlogPostsListProps) {
  const t = useTranslations("admin.blog");
  const utils = api.useUtils();
  const [search, setSearch] = useState("");

  const { data } = api.blogAdmin.getMine.useQuery(
    { page: 1, perPage: 100 },
    {
      initialData: {
        data: initialPosts,
        pageCount: 1,
        totalCount: initialPosts.length,
      },
    },
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

  const grouped = useMemo(() => {
    const seriesMap = new Map<string, BlogPostEditorDTO[]>();
    const standalone: BlogPostEditorDTO[] = [];

    for (const post of posts) {
      const sName = post.seriesName?.trim();
      if (sName) {
        const list = seriesMap.get(sName) ?? [];
        list.push(post);
        seriesMap.set(sName, list);
      } else {
        standalone.push(post);
      }
    }

    for (const list of seriesMap.values()) {
      list.sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
    }

    return {
      series: Array.from(seriesMap.entries()).map(([name, items]) => ({
        name,
        items,
      })),
      standalone,
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const title = Object.values(p.translations)
        .map((tr) => tr.title)
        .join(" ")
        .toLowerCase();
      const slug = p.slug.toLowerCase();
      const sName = (p.seriesName ?? "").toLowerCase();
      return title.includes(q) || slug.includes(q) || sName.includes(q);
    });
  }, [posts, search]);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            {t("count", { count: posts.length })}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {grouped.series.length} series
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {grouped.standalone.length} standalone
          </span>
        </div>

        <Link
          href={{ pathname: "/admin/blog/new" }}
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 size-4" />
          <span>{t("newPost")}</span>
        </Link>
      </div>

      {/* Tabs organizing Series, Standalone, and All */}
      <Tabs defaultValue="series" className="space-y-6">
        <TabsList variant="line" className="border-border w-full border-b">
          <TabsTrigger value="series" className="flex items-center gap-2">
            <Layers className="size-4" aria-hidden="true" />
            <span>{t("tabSeries")}</span>
            <Badge variant="secondary" className="text-[0.6875rem]">
              {grouped.series.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="standalone" className="flex items-center gap-2">
            <FileText className="size-4" aria-hidden="true" />
            <span>{t("tabStandalone")}</span>
            <Badge variant="secondary" className="text-[0.6875rem]">
              {grouped.standalone.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="size-4" aria-hidden="true" />
            <span>{t("tabAll")}</span>
            <Badge variant="secondary" className="text-[0.6875rem]">
              {posts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Structured by Series */}
        <TabsContent value="series" className="space-y-6 focus:outline-hidden">
          {grouped.series.length === 0 ? (
            <div className="bg-card border-border rounded-2xl border p-12 text-center">
              <p className="text-muted-foreground text-sm">{t("noSeries")}</p>
            </div>
          ) : (
            grouped.series.map((series) => (
              <SeriesCard
                key={series.name}
                seriesName={series.name}
                items={series.items}
                onMove={(id, direction) =>
                  moveInSeries.mutate({ id, direction })
                }
                onDelete={(id) => deletePost.mutate({ id })}
                isMovePending={moveInSeries.isPending}
                isDeletePending={deletePost.isPending}
                t={t}
              />
            ))
          )}
        </TabsContent>

        {/* Tab 2: Standalone Posts */}
        <TabsContent
          value="standalone"
          className="space-y-4 focus:outline-hidden"
        >
          {grouped.standalone.length === 0 ? (
            <div className="bg-card border-border rounded-2xl border p-12 text-center">
              <p className="text-muted-foreground text-sm">
                {t("noStandalone")}
              </p>
            </div>
          ) : (
            <div className="bg-card border-border divide-border/60 divide-y rounded-2xl border">
              {grouped.standalone.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  onDelete={(id) => deletePost.mutate({ id })}
                  isDeletePending={deletePost.isPending}
                  t={t}
                  showSeries={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: All Posts with Search */}
        <TabsContent value="all" className="space-y-4 focus:outline-hidden">
          <div className="relative max-w-sm">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="bg-card border-border divide-border/60 divide-y rounded-2xl border">
            {filteredPosts.length === 0 ? (
              <p className="text-muted-foreground p-8 text-center text-sm">
                {t("empty")}
              </p>
            ) : (
              filteredPosts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  onDelete={(id) => deletePost.mutate({ id })}
                  isDeletePending={deletePost.isPending}
                  t={t}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
