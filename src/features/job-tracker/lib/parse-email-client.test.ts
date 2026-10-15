import { parseEmailClient } from "./parse-email-client";

describe("parseEmailClient", () => {
  it("identifies GoogleImageProxy as Gmail proxy", () => {
    const result = parseEmailClient(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 GoogleImageProxy",
    );
    expect(result.clientName).toBe("Gmail (Google Proxy)");
    expect(result.isProxy).toBe(true);
  });

  it("identifies Outlook", () => {
    const result = parseEmailClient(
      "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; Microsoft Outlook 16.0.14332)",
    );
    expect(result.clientName).toBe("Microsoft Outlook");
    expect(result.isProxy).toBe(false);
  });

  it("identifies Apple Mail iOS", () => {
    const result = parseEmailClient(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    );
    expect(result.clientName).toBe("Apple Mail (iOS)");
    expect(result.isProxy).toBe(false);
  });

  it("identifies Thunderbird", () => {
    const result = parseEmailClient(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Thunderbird/115.0",
    );
    expect(result.clientName).toBe("Mozilla Thunderbird");
    expect(result.isProxy).toBe(false);
  });

  it("returns fallback for empty or unknown user agent", () => {
    expect(parseEmailClient(null)).toEqual({
      clientName: "Email client",
      isProxy: false,
    });
    expect(parseEmailClient("CustomBot/1.0")).toEqual({
      clientName: "Webmail / Client",
      isProxy: false,
    });
  });
});
