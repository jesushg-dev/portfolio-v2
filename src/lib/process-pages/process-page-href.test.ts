import { processPageHref, PROCESS_PAGE_PATHNAME } from "./process-page-href";

describe("processPageHref", () => {
  it("builds the process page pathname params", () => {
    expect(processPageHref("how-i-use-ai")).toEqual({
      pathname: PROCESS_PAGE_PATHNAME,
      params: { slug: "how-i-use-ai" },
    });
  });
});
