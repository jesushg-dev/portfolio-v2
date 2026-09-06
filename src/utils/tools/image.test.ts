import {
  classifyMediaSrc,
  isAbsoluteOrLocalImagePath,
  isRenderableProjectImage,
} from "./image";

describe("classifyMediaSrc", () => {
  it("detects local paths and absolute URLs, and rejects shorthand ids", () => {
    expect(classifyMediaSrc("")).toBe("empty");
    expect(classifyMediaSrc("/hero.png")).toBe("local");
    expect(classifyMediaSrc("https://utfs.io/f/abc.webp")).toBe("remote-url");
    expect(
      classifyMediaSrc(
        "https://res.cloudinary.com/other/image/upload/v1/photo.jpg",
      ),
    ).toBe("remote-url");
    expect(classifyMediaSrc("portf-1_bkhwxr")).toBe("empty");
    expect(classifyMediaSrc("react")).toBe("empty");
  });
});

describe("isAbsoluteOrLocalImagePath", () => {
  it("accepts only local paths and valid absolute URLs", () => {
    expect(isAbsoluteOrLocalImagePath("/hero.png")).toBe(true);
    expect(isAbsoluteOrLocalImagePath("https://utfs.io/f/x")).toBe(true);
    expect(isAbsoluteOrLocalImagePath("portf-1_bkhwxr")).toBe(false);
  });
});

describe("isRenderableProjectImage", () => {
  it("accepts absolute URLs and local paths, not public ids", () => {
    expect(isRenderableProjectImage("https://utfs.io/f/x")).toBe(true);
    expect(isRenderableProjectImage("/covers/shot.webp")).toBe(true);
    expect(isRenderableProjectImage("portf-1_bkhwxr")).toBe(false);
    expect(isRenderableProjectImage("")).toBe(false);
  });
});
