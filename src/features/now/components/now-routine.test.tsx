import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { NowRoutine } from "./now-routine";
import type { PublicStatusSlot } from "../lib/status-schedule";

const mockSchedule: PublicStatusSlot[] = [
  {
    id: "slot-1",
    startMinute: 0,
    endMinute: 1440,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    emoji: "💼",
    body: "shipping projects and learning",
  },
];

describe("NowRoutine", () => {
  it("renders 24h timeline ticks and routine status when slot matches", () => {
    renderWithIntl(
      <NowRoutine
        schedule={mockSchedule}
        timezone="UTC"
        initialNow="2026-11-02T12:00:00Z"
      />,
    );

    expect(screen.getByText("00")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(
      screen.getByText("shipping projects and learning"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Usual routine|Gebruikelijke routine|Rutina habitual/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /in the usual window|binnen het gebruikelijke venster|dentro del horario habitual/i,
      ),
    ).toBeInTheDocument();
  });
});
