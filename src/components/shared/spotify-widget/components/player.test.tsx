import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import Player from "./player";

jest.mock("react-use-audio-player", () => ({
  useAudioPlayer: () => ({
    duration: 30,
    load: jest.fn(),
    getPosition: () => 15,
    play: jest.fn(),
    pause: jest.fn(),
    isPlaying: false,
    seek: jest.fn(),
    setVolume: jest.fn(),
  }),
}));

describe("Player", () => {
  it("renders player component when active", () => {
    const onChange = jest.fn();
    renderWithIntl(
      <Player
        isLocalPlaying={false}
        onChange={onChange}
        audioSrc="https://example.com/audio.mp3"
      />,
    );
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});
