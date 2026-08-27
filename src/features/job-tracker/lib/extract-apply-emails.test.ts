import { extractEmailsFromText } from "./extract-apply-emails";

describe("extractEmailsFromText", () => {
  it("finds unique emails in a job description", () => {
    const text =
      "Envíanos tu CV a carol@joinready.com o escribe a Carol@JoinReady.com";
    expect(extractEmailsFromText(text)).toEqual(["carol@joinready.com"]);
  });

  it("returns empty when none present", () => {
    expect(extractEmailsFromText("No email here")).toEqual([]);
  });
});
