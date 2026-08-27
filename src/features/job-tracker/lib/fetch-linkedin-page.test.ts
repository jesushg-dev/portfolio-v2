import { ImportFromUrlError } from "./import-from-url-errors";
import { fetchLinkedInHtml } from "./fetch-linkedin-page";

function mockResponse(
  status: number,
  body: string,
  headers: Record<string, string> = {},
): Response {
  const headerLookup = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => headerLookup[name.toLowerCase()] ?? null,
    },
    text: () => Promise.resolve(body),
  } as Response;
}

describe("fetchLinkedInHtml", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("follows same-host redirects and returns HTML", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        mockResponse(302, "", {
          location: "/jobs/view/4457394559/",
        }),
      )
      .mockResolvedValueOnce(mockResponse(200, "<html>ok</html>"));
    global.fetch = fetchMock as typeof fetch;

    await expect(
      fetchLinkedInHtml("https://www.linkedin.com/jobs/view/4457394559/"),
    ).resolves.toBe("<html>ok</html>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not follow off-domain redirects", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        mockResponse(302, "", { location: "https://evil.example/steal" }),
      ) as typeof fetch;

    await expect(
      fetchLinkedInHtml("https://www.linkedin.com/jobs/view/4457394559/"),
    ).rejects.toMatchObject({ code: "IMPORT_FETCH_FAILED" });
  });

  it("maps 999/403 to a login wall", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockResponse(999, "blocked")) as typeof fetch;

    await expect(
      fetchLinkedInHtml("https://www.linkedin.com/jobs/view/4457394559/"),
    ).rejects.toBeInstanceOf(ImportFromUrlError);

    await expect(
      fetchLinkedInHtml("https://www.linkedin.com/jobs/view/4457394559/"),
    ).rejects.toMatchObject({ code: "IMPORT_LOGIN_WALL" });
  });
});
