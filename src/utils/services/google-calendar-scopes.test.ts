import { GOOGLE_CALENDAR_REQUIRED_SCOPES } from "./google-calendar-scopes";

describe("GOOGLE_CALENDAR_REQUIRED_SCOPES", () => {
  it("requests only calendar.events", () => {
    expect(GOOGLE_CALENDAR_REQUIRED_SCOPES).toEqual([
      "https://www.googleapis.com/auth/calendar.events",
    ]);
  });
});
