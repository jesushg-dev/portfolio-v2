import { Bot, HeartHandshake, Zap } from "lucide-react";

import { resolveProcessPageIcon } from "./process-page-icons";

describe("resolveProcessPageIcon", () => {
  it("returns the Lucide icon for a whitelisted name", () => {
    expect(resolveProcessPageIcon("HeartHandshake")).toBe(HeartHandshake);
    expect(resolveProcessPageIcon("Zap")).toBe(Zap);
  });

  it("falls back to Bot for unknown or empty names", () => {
    expect(resolveProcessPageIcon("NotAnIcon")).toBe(Bot);
    expect(resolveProcessPageIcon("")).toBe(Bot);
    expect(resolveProcessPageIcon(undefined)).toBe(Bot);
  });
});
