import { resolveStepsForLocale, splitOutputLines } from "./resolve";
import type { TerminalStepResolved } from "./types";

const steps: TerminalStepResolved[] = [
  {
    order: 1,
    translations: [
      {
        appLanguageId: "lang-es",
        languageCode: "es",
        command: "whoami",
        output: "jesús",
      },
      {
        appLanguageId: "lang-en",
        languageCode: "en",
        command: "whoami",
        output: "jesus",
      },
    ],
  },
  {
    order: 0,
    translations: [
      {
        appLanguageId: "lang-en",
        languageCode: "en",
        command: "cat ~/profile.json",
        output: '{\n  "name": "Jesus"\n}',
      },
      {
        appLanguageId: "lang-es",
        languageCode: "es",
        command: "cat ~/profile.json",
        output: '{\n  "nombre": "Jesús"\n}',
      },
    ],
  },
];

describe("splitOutputLines", () => {
  it("splits multiline output into string array", () => {
    expect(splitOutputLines("line1\nline2\nline3")).toEqual([
      "line1",
      "line2",
      "line3",
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(splitOutputLines("")).toEqual([]);
  });
});

describe("resolveStepsForLocale", () => {
  it("sorts steps by order and resolves commands/outputs for locale", () => {
    const result = resolveStepsForLocale(steps, "en");

    expect(result.commands).toEqual(["cat ~/profile.json", "whoami"]);
    expect(result.outputs[0]).toEqual(["{", '  "name": "Jesus"', "}"]);
    expect(result.outputs[1]).toEqual(["jesus"]);
  });

  it("resolves Spanish translations", () => {
    const result = resolveStepsForLocale(steps, "es");

    expect(result.outputs[0]).toEqual(["{", '  "nombre": "Jesús"', "}"]);
    expect(result.outputs[1]).toEqual(["jesús"]);
  });

  it("falls back to defaultLocale when locale translation is missing", () => {
    const partialSteps: TerminalStepResolved[] = [
      {
        order: 0,
        translations: [
          {
            appLanguageId: "lang-en",
            languageCode: "en",
            command: "ls",
            output: "file.txt",
          },
        ],
      },
    ];

    const result = resolveStepsForLocale(partialSteps, "nl", "en");

    expect(result.commands).toEqual(["ls"]);
    expect(result.outputs[0]).toEqual(["file.txt"]);
  });

  it("falls back to first available translation", () => {
    const partialSteps: TerminalStepResolved[] = [
      {
        order: 0,
        translations: [
          {
            appLanguageId: "lang-es",
            languageCode: "es",
            command: "pwd",
            output: "/home",
          },
        ],
      },
    ];

    const result = resolveStepsForLocale(partialSteps, "nl");

    expect(result.commands).toEqual(["pwd"]);
    expect(result.outputs[0]).toEqual(["/home"]);
  });
});
