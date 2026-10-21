import { createHash } from "node:crypto";
import {
  getEmailTrackingDisclosure,
  hashEmailOpenTrackingToken,
} from "./email-open-tracking";

describe("email open tracking helpers", () => {
  it("stores only a one-way hash of the pixel token", () => {
    const token = "a".repeat(64);
    expect(hashEmailOpenTrackingToken(token)).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
  });

  it("provides transparent disclosure for each supported locale", () => {
    expect(getEmailTrackingDisclosure("en")).toContain("tracking image");
    expect(getEmailTrackingDisclosure("es")).toContain("imagen de seguimiento");
    expect(getEmailTrackingDisclosure("nl")).toContain("trackingafbeelding");
  });
});
