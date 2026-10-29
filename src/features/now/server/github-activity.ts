import "server-only";
import { z } from "zod";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";
import type {
  GitHubActivity,
  GitHubActivityKind,
} from "../lib/github-activity";

const eventSchema = z.object({
  type: z.string(),
  public: z.boolean(),
  actor: z.object({ login: z.string() }),
  repo: z.object({
    name: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/),
  }),
  created_at: z.string().datetime(),
});
const kinds: Record<string, GitHubActivityKind> = {
  PushEvent: "push",
  PullRequestEvent: "pullRequest",
  IssuesEvent: "issue",
  WatchEvent: "star",
  ForkEvent: "fork",
  ReleaseEvent: "release",
  CreateEvent: "create",
};
export async function getGitHubActivity(
  userId: string,
  username: string | null,
): Promise<GitHubActivity> {
  if (!username) return { status: "unconfigured", username };
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username))
    return { status: "unavailable", username };
  try {
    const config = await getTenantIntegrationConfig(userId, "github");
    if (!config?.accessToken) return { status: "unconfigured", username };
    if (config.login.toLowerCase() !== username.toLowerCase())
      return { status: "unavailable", username };
    const response = await fetch(
      "https://api.github.com/users/" +
        encodeURIComponent(username) +
        "/events/public?per_page=10",
      {
        headers: {
          Authorization: "Bearer " + config.accessToken,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) return { status: "unavailable", username };
    const parsed = z.array(eventSchema).safeParse(await response.json());
    if (!parsed.success) return { status: "unavailable", username };
    const event = parsed.data
      .filter(
        (item) =>
          item.public &&
          item.actor.login.toLowerCase() === username.toLowerCase(),
      )
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    if (!event) return { status: "empty", username };
    return {
      status: "ready",
      username,
      event: {
        kind: kinds[event.type] ?? "activity",
        repository: event.repo.name,
        href: "https://github.com/" + event.repo.name,
        createdAt: event.created_at,
      },
    };
  } catch {
    return { status: "unavailable", username };
  }
}
