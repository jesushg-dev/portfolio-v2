import { POST } from "./route";

jest.mock("@/features/analytics/server/collect", () => ({
  handleAnalyticsCollect: jest.fn().mockResolvedValue({ status: 204 }),
}));

import { handleAnalyticsCollect } from "@/features/analytics/server/collect";

describe("POST /api/analytics/collect", () => {
  it("delegates to handleAnalyticsCollect", async () => {
    const request = { json: () => Promise.resolve({}) } as unknown as Request;
    const response = await POST(request);
    expect(handleAnalyticsCollect).toHaveBeenCalledWith(request);
    expect(response).toEqual({ status: 204 });
  });
});
