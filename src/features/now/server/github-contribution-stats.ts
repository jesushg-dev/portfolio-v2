import "server-only";
import { z } from "zod";
import type { GitHubContributionStats } from "../lib/github-contributions";

const count = z.number().int().nonnegative();
const statsSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        totalCommitContributions: count,
        totalIssueContributions: count,
        totalPullRequestContributions: count,
        totalPullRequestReviewContributions: count,
        totalRepositoryContributions: count,
      }),
      repositories: z.object({
        totalCount: count,
        nodes: z.array(
          z.object({
            stargazerCount: count,
            forkCount: count,
            languages: z.object({
              totalSize: count,
              edges: z.array(
                z.object({
                  size: count,
                  node: z.object({ name: z.string() }),
                }),
              ),
            }),
          }),
        ),
      }),
    }),
  }),
});

export const githubStatsFields = `
  repositories(first: 100, privacy: PUBLIC, ownerAffiliations: [OWNER],
    isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
    totalCount
    nodes {
      stargazerCount forkCount
      languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
        totalSize edges { size node { name } }
      }
    }
  }
`;
export const githubActivityFields = `
  totalCommitContributions totalIssueContributions
  totalPullRequestContributions totalPullRequestReviewContributions
  totalRepositoryContributions
`;

// Parse independently: a missing analytics field must not hide a valid calendar.
export function readGitHubContributionStats(
  input: unknown,
): GitHubContributionStats | null {
  const result = statsSchema.safeParse(input);
  if (!result.success) return null;
  const { contributionsCollection: activity, repositories } =
    result.data.data.user;
  const languages = new Map<string, number>();
  let otherBytes = 0;
  for (const repo of repositories.nodes) {
    let knownBytes = 0;
    for (const { size, node } of repo.languages.edges) {
      languages.set(node.name, (languages.get(node.name) ?? 0) + size);
      knownBytes += size;
    }
    otherBytes += Math.max(0, repo.languages.totalSize - knownBytes);
  }
  const sorted = [...languages]
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes);
  const shown = sorted.slice(0, 5);
  otherBytes += sorted.slice(5).reduce((sum, item) => sum + item.bytes, 0);
  if (otherBytes) shown.push({ name: "__other__", bytes: otherBytes });
  return {
    activity: {
      commits: activity.totalCommitContributions,
      issues: activity.totalIssueContributions,
      pullRequests: activity.totalPullRequestContributions,
      reviews: activity.totalPullRequestReviewContributions,
      repositories: activity.totalRepositoryContributions,
    },
    languages: shown,
    sampledRepositories: repositories.nodes.length,
    totalRepositories: repositories.totalCount,
    stars: repositories.nodes.reduce(
      (sum, repo) => sum + repo.stargazerCount,
      0,
    ),
    forks: repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0),
  };
}
