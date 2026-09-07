import { terminalRouter } from "./terminal.router";
import {
  createRouterCaller,
  createTrpcTestContext,
  MOCK_OWNER_USER,
} from "@/test-utils/trpc-caller";

const terminal = {
  id: "term-1",
  userId: MOCK_OWNER_USER.id,
  username: "ada",
  typingSpeed: 45,
  delayBetweenCommands: 1000,
  steps: [
    {
      id: "st-1",
      order: 0,
      translations: [
        {
          appLanguageId: "lang-en",
          language: { code: "en" },
          command: "whoami",
          output: "ada",
        },
      ],
    },
  ],
};

describe("terminalRouter", () => {
  it("returns null editor data when missing", async () => {
    const caller = createRouterCaller(
      terminalRouter,
      createTrpcTestContext({
        db: { cvTerminal: { findUnique: jest.fn().mockResolvedValue(null) } },
      }),
    );
    await expect(caller.getMine()).resolves.toBeNull();
  });

  it("maps getMine and getPublic from stored steps", async () => {
    const db = {
      cvTerminal: { findUnique: jest.fn().mockResolvedValue(terminal) },
    };
    const caller = createRouterCaller(
      terminalRouter,
      createTrpcTestContext({ db }),
    );
    const mine = await caller.getMine();
    expect(mine?.username).toBe("ada");
    expect(mine?.steps[0]?.translations["lang-en"]?.command).toBe("whoami");

    const published = await caller.getPublic({ locale: "en" });
    expect(published?.commands).toEqual(["whoami"]);
    expect(published?.outputs[0]).toEqual(["ada"]);
  });

  it("upserts a terminal and returns the editor DTO", async () => {
    const tx = {
      cvTerminal: {
        upsert: jest.fn().mockResolvedValue({ id: "term-1" }),
        findUnique: jest.fn().mockResolvedValue(terminal),
      },
      cvTerminalStep: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };
    const db = {
      cvTerminal: { findUnique: jest.fn().mockResolvedValue(terminal) },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
        await fn(tx),
      ),
    };
    const caller = createRouterCaller(
      terminalRouter,
      createTrpcTestContext({ db }),
    );
    const result = await caller.upsert({
      username: "ada",
      steps: [
        {
          order: 0,
          translations: { "lang-en": { command: "whoami", output: "ada" } },
        },
        {
          order: 1,
          translations: { "lang-en": { command: "  ", output: "  " } },
        },
      ],
    });
    expect(result.username).toBe("ada");
    expect(tx.cvTerminalStep.create).toHaveBeenCalledTimes(1);
  });
});
