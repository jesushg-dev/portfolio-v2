export type GitHubActivityKind =
  | "push"
  | "pullRequest"
  | "issue"
  | "star"
  | "fork"
  | "release"
  | "create"
  | "activity";
export type GitHubActivity =
  | {
      status: "ready";
      username: string;
      event: {
        kind: GitHubActivityKind;
        repository: string;
        href: string;
        createdAt: string;
      };
    }
  | {
      status: "unconfigured" | "unavailable" | "empty";
      username: string | null;
    };
