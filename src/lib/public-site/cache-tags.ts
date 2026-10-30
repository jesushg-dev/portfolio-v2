export const PRIMARY_PORTFOLIO_TAG = "public:primary-portfolio";

export function publicPortfolioTag(userId: string): string {
  return `public:portfolio:${userId}`;
}
