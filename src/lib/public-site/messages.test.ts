import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import nl from "../../../messages/nl.json";

import { pickPublicMessages, pickPublicRouteMessages } from "./messages";

it.each([en, es, nl])(
  "keeps only shared translations at the public root",
  (messages) => {
    const selected = pickPublicMessages(messages);

    expect(Object.keys(selected)).toEqual(["global"]);
    expect(selected.global).toBe(messages.global);
    expect(selected).not.toHaveProperty("admin");
    expect(JSON.stringify(selected).length).toBeLessThan(
      JSON.stringify(messages).length / 2,
    );
  },
);

it.each([en, es, nl])(
  "isolates client messages by public route",
  (messages) => {
    const home = pickPublicRouteMessages(messages, "home");
    const now = pickPublicRouteMessages(messages, "now");
    const cv = pickPublicRouteMessages(messages, "curriculum");

    expect(home.main).toHaveProperty("portfolio", messages.main.portfolio);
    expect(home.main).not.toHaveProperty("now");
    expect(home.main).not.toHaveProperty("howIUseAi");
    expect(home).not.toHaveProperty("curriculum");
    expect(now.main).toEqual({ now: messages.main.now });
    expect(now.global).toBe(messages.global);
    expect(cv.curriculum).toBe(messages.curriculum);
    expect(cv).not.toHaveProperty("main");
    expect(pickPublicRouteMessages(messages, "skills").certification).toBe(
      messages.certification,
    );
    expect(JSON.stringify(home).length).toBeLessThan(
      JSON.stringify(messages).length / 5,
    );
  },
);
