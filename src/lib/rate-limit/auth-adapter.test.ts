import { Prisma } from "@prisma/client";

import { withRateLimitRetry } from "./auth-adapter";

jest.mock("@prisma/client", () => ({
  Prisma: jest.requireActual<typeof import("@prisma/client/runtime/library")>(
    "@prisma/client/runtime/library",
  ),
}));

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "6.19.3",
  });
}

function setup() {
  const incrementOne = jest.fn();
  const findOne = jest.fn();
  const factory = jest.fn().mockReturnValue({ incrementOne, findOne });
  const adapter = withRateLimitRetry(factory)({});
  const input = {
    model: "rateLimit",
    where: [{ field: "count", operator: "lt" as const, value: 5 }],
    increment: { count: 1 },
    set: { lastRequest: 123 },
  };
  return { adapter, incrementOne, findOne, input };
}

describe("auth rate limit transaction retries", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("retries aborted transactions with the same limit predicate", async () => {
    const { adapter, incrementOne, input, findOne } = setup();
    const row = { count: 5 };
    incrementOne
      .mockRejectedValueOnce(prismaError("P2034"))
      .mockRejectedValueOnce(prismaError("P2034"))
      .mockResolvedValueOnce(row);
    const result = adapter.incrementOne(input);
    await jest.runAllTimersAsync();
    await expect(result).resolves.toBe(row);
    expect(incrementOne).toHaveBeenCalledTimes(3);
    for (const [actual] of incrementOne.mock.calls) expect(actual).toBe(input);
    expect(adapter.findOne).toBe(findOne);
  });

  it("preserves a rejected counter claim after another request takes the slot", async () => {
    const { adapter, incrementOne, input } = setup();
    incrementOne
      .mockRejectedValueOnce(prismaError("P2034"))
      .mockResolvedValueOnce(null);
    const result = adapter.incrementOne(input);
    await jest.runAllTimersAsync();
    await expect(result).resolves.toBeNull();
    expect(incrementOne).toHaveBeenCalledTimes(2);
  });

  it("stops after five retries and propagates persistent conflicts", async () => {
    const { adapter, incrementOne, input } = setup();
    const error = prismaError("P2034");
    incrementOne.mockRejectedValue(error);
    const assertion = expect(adapter.incrementOne(input)).rejects.toBe(error);
    await jest.runAllTimersAsync();
    await assertion;
    expect(incrementOne).toHaveBeenCalledTimes(6);
  });

  it.each(["P2002", "P2025"])("does not retry %s", async (code) => {
    const { adapter, incrementOne, input } = setup();
    const error = prismaError(code);
    incrementOne.mockRejectedValue(error);
    await expect(adapter.incrementOne(input)).rejects.toBe(error);
    expect(incrementOne).toHaveBeenCalledTimes(1);
  });

  it("does not retry writes outside the rate limit model", async () => {
    const { adapter, incrementOne, input } = setup();
    const error = prismaError("P2034");
    incrementOne.mockRejectedValue(error);
    await expect(
      adapter.incrementOne({ ...input, model: "user" }),
    ).rejects.toBe(error);
    expect(incrementOne).toHaveBeenCalledTimes(1);
  });
});
