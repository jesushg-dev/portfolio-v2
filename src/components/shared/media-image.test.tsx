import { render } from "@testing-library/react";
import Image from "next/image";

import { MediaImage } from "./media-image";

jest.mock("next/image", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockImage = jest.mocked(Image);

beforeEach(() => mockImage.mockClear());

it.each([
  ["https://res.cloudinary.com/site/image/upload/v1/avatar.jpg", false],
  ["https://other-cdn.example/avatar.jpg", true],
  ["https://res.cloudinary.com.example/avatar.jpg", true],
  ["/projects/cover.jpg", false],
])("selects the image delivery policy for %s", (src, unoptimized) => {
  render(<MediaImage src={src} alt="Avatar" width={48} height={48} />);

  expect(mockImage.mock.calls[0][0]).toMatchObject({ src, unoptimized });
});

it("honors an explicit optimization override", () => {
  render(
    <MediaImage
      src="https://res.cloudinary.com/site/image/upload/v1/avatar.jpg"
      alt="Avatar"
      width={48}
      height={48}
      unoptimized
    />,
  );

  expect(mockImage.mock.calls[0][0].unoptimized).toBe(true);
});

it("forwards the supported preload property", () => {
  render(
    <MediaImage src="/hero.jpg" alt="Hero" width={48} height={48} preload />,
  );

  expect(mockImage.mock.calls[0][0].preload).toBe(true);
});
