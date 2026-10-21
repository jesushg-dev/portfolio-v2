import { eventPrepHref, eventPrepPathname } from "./event-prep-href";

describe("eventPrepHref", () => {
  it("builds admin event prep params", () => {
    expect(eventPrepHref("app-1", "evt-2")).toEqual({
      pathname: eventPrepPathname,
      params: { id: "app-1", eventId: "evt-2" },
    });
  });
});
