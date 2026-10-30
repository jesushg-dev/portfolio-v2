import { createCompanyMonogram, loadResumePhoto } from "./resume-photo";
import sharp from "sharp";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

it.each([
  "https://res.cloudinary.com/account/image/upload/photo.png",
  "https://utfs.io/f/photo.png",
])("loads CMS photos from %s", async (url) => {
  const pixel = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, body: [pixel] });
  const photo = await loadResumePhoto(url);
  expect(photo?.extension).toBe("png");
  expect(photo?.data.subarray(1, 4).toString()).toBe("PNG");
  expect(await sharp(photo!.data).metadata()).toMatchObject({
    width: 600,
    height: 800,
  });
  expect(global.fetch).toHaveBeenCalledWith(
    new URL(url),
    expect.objectContaining({ redirect: "error" }),
  );
});

it("does not fetch when the CMS has no photo", async () => {
  global.fetch = jest.fn();
  await expect(loadResumePhoto()).resolves.toBeUndefined();
  expect(global.fetch).not.toHaveBeenCalled();
});

it("creates square monograms with transparent rounded corners", async () => {
  const logo = await createCompanyMonogram("Asociación de Iglesias Reformadas");
  expect(await sharp(logo.data).metadata()).toMatchObject({
    width: 600,
    height: 600,
    hasAlpha: true,
  });
  const corner = await sharp(logo.data)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
  expect(corner[3]).toBe(0);
});

it("rejects private and unrecognized image destinations", async () => {
  global.fetch = jest.fn();
  await expect(loadResumePhoto("http://127.0.0.1/private")).rejects.toThrow(
    "header.photoUrl",
  );
  await expect(
    loadResumePhoto("https://res.cloudinary.com.example.org/photo.png"),
  ).rejects.toThrow("header.photoUrl");
  expect(global.fetch).not.toHaveBeenCalled();
});
