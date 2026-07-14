import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import nl from "../../../messages/nl.json";

import {
  compareMessageKeySets,
  flattenMessageKeys,
} from "./flatten-message-keys";

describe("message key parity", () => {
  const enKeys = flattenMessageKeys(en);
  const esKeys = flattenMessageKeys(es);
  const nlKeys = flattenMessageKeys(nl);

  it("es.json has the same keys as en.json", () => {
    const { missingInTarget, extraInTarget } = compareMessageKeySets(
      enKeys,
      esKeys,
    );
    expect(missingInTarget).toEqual([]);
    expect(extraInTarget).toEqual([]);
  });

  it("nl.json has the same keys as en.json", () => {
    const { missingInTarget, extraInTarget } = compareMessageKeySets(
      enKeys,
      nlKeys,
    );
    expect(missingInTarget).toEqual([]);
    expect(extraInTarget).toEqual([]);
  });
});
