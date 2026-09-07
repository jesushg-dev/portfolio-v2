import { POST } from "./route";

jest.mock("@/features/analytics/server/collect", () => ({
  handleAnalyticsCollect: jest.fn(async () => ({ status: 204 })),
}));

import { handleAnalyticsCollect } from "@/features/analytics/server/collect";

describe("POST /api/analytics/collect", () => {
  it("delegates to handleAnalyticsCollect", async () => {
    const request = { json: async () => ({}) } as Request;
    const response = await POST(request);
    expect(handleAnalyticsCollect).toHaveBeenCalledWith(request);
    expect(response).toEqual({ status: 204 });
  });
});
