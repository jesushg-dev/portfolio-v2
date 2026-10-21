import { createTranslatedMetadata } from "./create-translated-metadata";

describe("createTranslatedMetadata", () => {
  it("uses translator keys for title and description", async () => {
    const metadata = await createTranslatedMetadata(
      Promise.resolve({ locale: "en" }),
      {
        namespace: "pages.privacy",
        pathname: "/privacy",
      },
    );

    expect(metadata.title).toBeTruthy();
    expect(metadata.alternates).toBeDefined();
  });

  it("falls back to the site name when no title key exists", async () => {
    const metadata = await createTranslatedMetadata(
      Promise.resolve({ locale: "en" }),
      { namespace: "missing.namespace" },
    );

    expect(typeof metadata.title).toBe("string");
  });
});
