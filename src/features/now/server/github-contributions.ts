import "server-only";
import { z } from "zod";
import { getTenantIntegrationConfig } from "@/lib/integrations/tenant-integrations-service";
import type { GitHubContributions } from "../lib/github-contributions";
import {
  githubActivityFields,
  githubStatsFields,
  readGitHubContributionStats,
} from "./github-contribution-stats";
const levelSchema = z.enum([
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
]);
const calendarResponse = z.object({
  data: z.object({
    user: z.object({
      login: z.string(),
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number().int().nonnegative(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                  contributionCount: z.number().int().nonnegative(),
                  contributionLevel: levelSchema,
                  weekday: z.number().int().min(0).max(6),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});
const query = `query($login:String!){user(login:$login){login ${githubStatsFields} contributionsCollection{${githubActivityFields} contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}`;
export async function getGitHubContributions(
  userId: string,
  username: string | null,
): Promise<GitHubContributions> {
  if (!username) return { status: "unconfigured", username };
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username))
    return { status: "unavailable", username };
  try {
    const config = await getTenantIntegrationConfig(userId, "github");
    if (!config?.accessToken) return { status: "unconfigured", username };
    if (config.login.toLowerCase() !== username.toLowerCase())
      return { status: "unavailable", username };
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { login: username } }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { status: "unavailable", username };
    const payload: unknown = await response.json();
    const parsed = calendarResponse.safeParse(payload);
    if (
      !parsed.success ||
      parsed.data.data.user.login.toLowerCase() !== username.toLowerCase()
    )
      return { status: "unavailable", username };
    const calendar =
      parsed.data.data.user.contributionsCollection.contributionCalendar;
    return {
      status: "ready",
      username,
      total: calendar.totalContributions,
      stats: readGitHubContributionStats(payload),
      weeks: calendar.weeks.map((week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
          weekday: day.weekday,
          level: levelSchema.options.indexOf(day.contributionLevel),
        })),
      ),
    };
  } catch {
    return { status: "unavailable", username };
  }
}

export async function verifyGitHubToken(
  accessToken: string,
): Promise<{ login: string } | null> {
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "query { viewer { login contributionsCollection { contributionCalendar { totalContributions } } } }",
      }),
    });
    if (!response.ok) return null;
    const parsed = z
      .object({
        data: z.object({
          viewer: z.object({
            login: z.string().min(1),
            contributionsCollection: z.object({
              contributionCalendar: z.object({
                totalContributions: z.number().int().nonnegative(),
              }),
            }),
          }),
        }),
      })
      .safeParse(await response.json());
    return parsed.success ? { login: parsed.data.data.viewer.login } : null;
  } catch {
    return null;
  }
}
