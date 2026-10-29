export interface ContributionDay {
  date: string;
  count: number;
  level: number;
  weekday: number;
}
export interface GitHubContributionStats {
  activity: {
    commits: number;
    issues: number;
    pullRequests: number;
    reviews: number;
    repositories: number;
  };
  languages: { name: string; bytes: number }[];
  sampledRepositories: number;
  totalRepositories: number;
  stars: number;
  forks: number;
}
export interface ReadyGitHubContributions {
  status: "ready";
  username: string;
  total: number;
  weeks: ContributionDay[][];
  stats: GitHubContributionStats | null;
}
export type GitHubContributions =
  | ReadyGitHubContributions
  | { status: "unconfigured" | "unavailable"; username: string | null };
